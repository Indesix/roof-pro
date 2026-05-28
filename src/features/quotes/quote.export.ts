// src/features/quotes/quote.export.ts
// Export PDF d'un devis, en trois temps :
//   1. buildQuoteHtml() construit un document HTML simple à partir du devis ;
//   2. exportQuotePdf() transforme ce HTML en PDF (expo-print), le RENOMME
//      proprement (Devis_DEV-2026-001.pdf), puis ouvre le menu de partage
//      natif (expo-sharing) → email, WhatsApp, etc.
//
// On garde un HTML SOBRE (pas de CSS exotique) pour un rendu fiable sur iOS
// comme sur Android. La logique est isolée ici, hors de l'écran (comme le
// calculateur), pour rester testable et réutilisable.

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { type Quote, type QuoteLine, formatPrice } from '../../models/quote';
import { QUOTE_STATUS_LABELS } from '../../models/quote';

// Coordonnées de l'artisan, EN DUR au MVP (à éditer ici).
// Choix assumé : pas d'écran de réglages au stade actuel ; ces infos
// figurent obligatoirement sur un devis, on les centralise donc ici.
const ARTISAN = {
  name: 'Toiture Pro SPRL',
  address: 'Rue de la Couverture 12, 6000 Charleroi',
  phone: '+32 71 00 00 00',
  email: 'contact@toiturepro.be',
  vat: 'BE 0123.456.789',
};

// Échappe les caractères HTML pour éviter qu'un nom/desc casse le template.
function esc(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Construit le HTML du devis.
export function buildQuoteHtml(quote: Quote, lines: QuoteLine[]): string {
  // Les lignes du tableau.
  const rows = lines
    .map(
      (line) => `
        <tr>
          <td>${esc(line.description)}</td>
          <td class="num">${line.quantity} ${esc(line.unit)}</td>
          <td class="num">${formatPrice(line.unit_price)}</td>
          <td class="num">${formatPrice(line.line_total)}</td>
        </tr>`
    )
    .join('');

  const vatPercent = Math.round(quote.vat_rate * 100);

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Helvetica, Arial, sans-serif; color: #222; padding: 24px; font-size: 13px; }
          h1 { color: #2E5E8C; margin: 0 0 4px 0; }
          .muted { color: #666; }
          .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
          .box { margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th { background: #2E5E8C; color: #fff; text-align: left; padding: 8px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .num { text-align: right; }
          .totals { margin-top: 16px; width: 100%; }
          .totals td { border: none; padding: 4px 8px; }
          .totals .label { text-align: right; color: #666; }
          .totals .value { text-align: right; width: 120px; }
          .grand { font-weight: bold; font-size: 15px; color: #2E5E8C; }
          .notes { margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>DEVIS</h1>
            <div class="muted">N° ${esc(quote.quote_number)}</div>
            <div class="muted">Statut : ${QUOTE_STATUS_LABELS[quote.status]}</div>
          </div>
          <div style="text-align: right;">
            <strong>${esc(ARTISAN.name)}</strong><br/>
            <span class="muted">${esc(ARTISAN.address)}</span><br/>
            <span class="muted">${esc(ARTISAN.phone)}</span><br/>
            <span class="muted">${esc(ARTISAN.email)}</span><br/>
            <span class="muted">TVA : ${esc(ARTISAN.vat)}</span>
          </div>
        </div>

        ${quote.title ? `<div class="box"><strong>${esc(quote.title)}</strong></div>` : ''}

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Quantité</th>
              <th class="num">Prix unitaire</th>
              <th class="num">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <table class="totals">
          <tr>
            <td class="label">Sous-total HT</td>
            <td class="value">${formatPrice(quote.subtotal)}</td>
          </tr>
          <tr>
            <td class="label">TVA (${vatPercent} %)</td>
            <td class="value">${formatPrice(quote.vat_amount)}</td>
          </tr>
          <tr>
            <td class="label grand">Total TTC</td>
            <td class="value grand">${formatPrice(quote.total)}</td>
          </tr>
        </table>

        ${
          quote.notes
            ? `<div class="notes"><strong>Notes</strong><br/><span class="muted">${esc(quote.notes)}</span></div>`
            : ''
        }
      </body>
    </html>`;
}

// Génère le PDF et ouvre le menu de partage. Lève une erreur si le partage
// n'est pas disponible (l'écran appelant gère l'alerte).
export async function exportQuotePdf(quote: Quote, lines: QuoteLine[]): Promise<void> {
  const html = buildQuoteHtml(quote, lines);

  // 1. HTML → fichier PDF (expo-print). Renvoie l'URI d'un fichier au nom
  //    aléatoire (ex: .../a3f9b2.pdf), peu présentable pour le client.
  const { uri } = await Print.printToFileAsync({ html });

  // 2. On renomme le fichier proprement : "Devis_DEV-2026-001.pdf".
  //    On nettoie le numéro pour n'autoriser que des caractères de nom de
  //    fichier sûrs (lettres, chiffres, tiret, underscore).
  const safeName = `Devis_${quote.quote_number}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const target = `${FileSystem.cacheDirectory}${safeName}.pdf`;

  // Si un fichier du même nom existe déjà (export précédent), on le supprime.
  await FileSystem.deleteAsync(target, { idempotent: true });
  await FileSystem.moveAsync({ from: uri, to: target });

  // 3. Ouvre le menu de partage natif si disponible (email, WhatsApp...).
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Le partage n\'est pas disponible sur cet appareil.');
  }
  await Sharing.shareAsync(target, {
    mimeType: 'application/pdf',
    dialogTitle: `Devis ${quote.quote_number}`,
    UTI: 'com.adobe.pdf',
  });
}
