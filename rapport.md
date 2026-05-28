# Rapport de projet — ROOF-PRO
**Application mobile de gestion pour couvreurs**
Auteur : Ridhouane Mathlouthi

---

## 1. Rappel du sujet

ROOF-PRO est une application mobile destinée à un entrepreneur en toiture
(couvreur). Elle centralise la gestion commerciale et opérationnelle de son
activité : suivi des prospects (leads), création de devis, planification des
rendez-vous, suivi des chantiers et pilotage du chiffre d'affaires.

L'objectif est de permettre au couvreur de transformer rapidement un contact
en devis chiffré, de suivre l'avancement commercial jusqu'à la signature, puis
d'assurer le suivi terrain de l'exécution du chantier — le tout depuis son
téléphone, sans dépendance à une connexion réseau.

L'application est développée en React Native avec Expo, et utilise une base de
données SQLite locale pour la persistance des données.

---

## 2. Spécifications des fonctionnalités

*(Cette section s'enrichit au fur et à mesure de l'implémentation. Légende :
✅ réalisé · 🚧 en cours · ⬜ prévu)*

- ⬜ Gestion des clients et leads (CRUD, statuts lead/actif/archivé)
- ⬜ Catalogue de produits / matériaux (CRUD)
- ⬜ Création de devis avec lignes, calcul automatique de la TVA et du total
- ⬜ Cycle de vie du devis (brouillon → envoyé → accepté/refusé)
- ⬜ Transformation d'un devis accepté en chantier
- ⬜ Gestion des rendez-vous
- ⬜ Tableau de bord (CA, taux de conversion, nombre de devis)
- ⬜ Suivi de chantier
- ⬜ Export PDF des devis

---

## 3. Justifications techniques

### 3.1 Framework : React Native + Expo

Le projet utilise **Expo**, qui simplifie la configuration native et permet de
tester l'application directement sur un appareil physique via Expo Go, sans
build natif. La navigation repose sur **Expo Router**, un système de routage
basé sur l'arborescence de fichiers (chaque fichier du dossier `app/` devient
une route).

Une navigation de type **Stack** est utilisée au niveau racine (logique
hiérarchique adaptée aux applications métier : liste → détail → édition),
complétée par une navigation par **onglets (Tabs)** pour les sections
principales de l'application.

### 3.2 Persistance : SQLite plutôt qu'AsyncStorage ou un backend distant

Le stockage des données repose sur **SQLite** (via `expo-sqlite`), et non sur
AsyncStorage ni sur un backend distant (type Supabase ou Firebase). Trois
raisons :

- **SQLite plutôt qu'AsyncStorage** : l'application manipule plusieurs entités
  reliées entre elles (un devis appartient à un client, possède des lignes,
  référence des produits ; un chantier découle d'un devis). AsyncStorage est un
  simple stockage clé/valeur sans relations, sans requêtes ni jointures. SQLite
  offre des tables typées, des clés étrangères, des requêtes `SELECT`/`JOIN` et
  des transactions atomiques.

- **SQLite plutôt qu'un backend distant** : l'application est mono-utilisateur
  (le couvreur sur son propre téléphone) et doit fonctionner en autonomie, y
  compris sur un chantier sans réseau. Une base locale élimine toute dépendance
  à une connexion et toute latence serveur.

- **Pas d'ORM** : les requêtes sont écrites en SQL natif (paramétré), ce qui
  correspond à l'enseignement du cours et garde une maîtrise totale du
  comportement de la base.

L'évolution du schéma est gérée manuellement via le pattern `PRAGMA
user_version` : un numéro de version est stocké dans l'en-tête du fichier de
base, et seules les migrations manquantes sont appliquées au démarrage.

### 3.3 Gestion d'état : pas de gestionnaire global

L'application **n'utilise pas de gestionnaire d'état global** (type Zustand ou
Redux). Le choix repose sur un principe simple : **la base SQLite est l'unique
source de vérité**. Les écrans consomment des hooks personnalisés (`useClients`,
`useQuotes`, etc.) qui interrogent la base et exposent les données via
`useState`. Lorsqu'une donnée change, l'écran rafraîchit sa requête. Cette
approche évite la duplication des données en mémoire et les risques de
désynchronisation entre un store et la base.

De même, **React Query n'est pas utilisé** : cet outil sert à mettre en cache
et synchroniser des données issues d'une API distante, ce qui n'a pas de sens
avec une base locale sans réseau.

### 3.4 Validation des données

*(À compléter — la validation des formulaires utilisera la bibliothèque Zod,
enseignée au Module 5.)*

---

## 4. Architecture

### 4.1 Structure des dossiers

Le code source est organisé sous `src/` selon une séparation par
responsabilité :

```
src/
  app/          Écrans et navigation (Expo Router)
  components/   Composants d'interface réutilisables
  features/     Logique métier pure (calculs, formatage)
  services/     Accès aux données (SQLite) et intégrations externes
  hooks/        Hooks React faisant le pont écran ↔ services
  types/        Types TypeScript des entités
  constants/    Couleurs, espacements, constantes
  utils/        Fonctions utilitaires génériques
  lib/          Configuration de la base de données
  validations/  Schémas de validation (Zod)
```

### 4.2 Flux de données

Le flux suit toujours le même chemin, dans un sens unique :

```
Écran (composant)
      │  appelle
      ▼
Hook personnalisé (useClients, useQuotes…)
      │  récupère la connexion via useSQLiteContext()
      │  et appelle
      ▼
Service (client.service.ts…)   ←  fonctions SQL pures (db en paramètre)
      │  exécute
      ▼
Base SQLite (source de vérité)
```

La connexion à la base est ouverte une seule fois au démarrage par le composant
`<SQLiteProvider>` (placé dans le layout racine), puis partagée à toute
l'application via le hook `useSQLiteContext()`. Les migrations sont déclenchées
à ce moment-là, avant le premier affichage des écrans.

---

## 5. Auto-évaluation

*(Tableau final à compléter au Jour 8 : fonctionnalités annoncées vs réalisées.)*

| Fonctionnalité annoncée | Réalisée | Commentaire |
|---|---|---|
| *(à compléter)* | | |