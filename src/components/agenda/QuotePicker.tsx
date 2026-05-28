// src/components/agenda/QuotePicker.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

export type PickableQuote = {
  id: number;
  quote_number: string;
  title: string;
  status: string;
  client_id: number;
};

type Props = {
  value: PickableQuote | null;
  onChange: (quote: PickableQuote | null) => void;
  /** Si fourni, on ne propose que les devis de ce client. */
  filterByClientId?: number | null;
  placeholder?: string;
};

/**
 * Picker de devis (optionnel) : bouton qui ouvre un modal listant les
 * devis. Si filterByClientId est fourni, on ne propose que ceux du
 * client sélectionné — ce qui est le comportement attendu : on ne lie
 * pas un RDV à un devis d'un autre client.
 */
export function QuotePicker({
  value,
  onChange,
  filterByClientId,
  placeholder = 'Lier un devis (optionnel)',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
      >
        <Text style={value ? styles.fieldValue : styles.fieldPlaceholder}>
          {value ? `${value.quote_number} — ${value.title}` : placeholder}
        </Text>
        {value && (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </Pressable>

      <QuotePickerModal
        visible={open}
        onClose={() => setOpen(false)}
        filterByClientId={filterByClientId ?? null}
        onSelect={q => {
          onChange(q);
          setOpen(false);
        }}
      />
    </>
  );
}

function QuotePickerModal({
  visible,
  onClose,
  onSelect,
  filterByClientId,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (q: PickableQuote) => void;
  filterByClientId: number | null;
}) {
  const db = useSQLiteContext();
  const [quotes, setQuotes] = useState<PickableQuote[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const where = filterByClientId != null ? 'WHERE client_id = ?' : '';
        const params = filterByClientId != null ? [filterByClientId] : [];
        const rows = await db.getAllAsync<PickableQuote>(
          `SELECT id, quote_number, title, status, client_id
             FROM quotes
             ${where}
            ORDER BY created_at DESC`,
          params
        );
        if (alive) setQuotes(rows);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, db, filterByClientId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter(
      x =>
        x.quote_number.toLowerCase().includes(q) ||
        x.title.toLowerCase().includes(q)
    );
  }, [quotes, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choisir un devis</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.modalClose}>Annuler</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.search}
          placeholder="Rechercher (numéro ou titre)…"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />

        {loading ? (
          <Text style={styles.muted}>Chargement…</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.muted}>
            {filterByClientId != null
              ? 'Aucun devis pour ce client.'
              : 'Aucun devis disponible.'}
          </Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={q => String(q.id)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.item,
                  pressed && { backgroundColor: '#F3F4F6' },
                ]}
              >
                <Text style={styles.itemTitle}>
                  {item.quote_number} — {item.title}
                </Text>
                <Text style={styles.itemMeta}>Statut : {item.status}</Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  fieldPressed: { backgroundColor: '#F3F4F6' },
  fieldValue: { flex: 1, fontSize: 15, color: '#111827' },
  fieldPlaceholder: { flex: 1, fontSize: 15, color: '#9CA3AF' },
  clearBtn: { paddingHorizontal: 6 },
  clearText: { fontSize: 16, color: '#6B7280' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  modalClose: { fontSize: 15, color: '#2563EB' },
  search: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    fontSize: 15,
  },
  muted: { padding: 16, color: '#6B7280' },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  itemTitle: { fontSize: 15, color: '#111827', fontWeight: '500' },
  itemMeta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
