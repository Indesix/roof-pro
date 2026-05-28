# Bienvenue sur Roof-Pro App👋

Roof-Pro vous permet de gérer vos chantiers toitures, du devis en passant par les opérations de chantiers, jusqu'aux dashboard de chiffre d'affaire !

## Installation et lancement

Prérequis : Node.js (v18+) et npm installés.

   ```bash
   npm install
   ```

2. Lancer l'application :

   ```bash
   npx expo start
   ```
3. Scanner le QR code avec l'app Expo Go (Android/iOS),
   ou appuyer sur 'a' pour lancer sur un émulateur Android.
   
In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Mise en place de la navigation

Une navigation de base a été mise en place avec Expo Router.  
Le projet a été structuré autour d’un dossier `src/app`, contenant un layout racine ainsi qu’un groupe d’onglets `(tabs)`.

Cette étape avait pour objectif de valider la structure globale du projet avant d’implémenter les fonctionnalités métier.  
Des écrans placeholders ont été créés pour les modules principaux : dashboard, clients, devis, produits, agenda et réglages. 


## Choix de navigation

L’application a été structurée avec Expo Router selon une logique hiérarchique.  
Un layout racine a été mis en place afin de définir la navigation globale de l’application, tandis qu’un second layout, situé dans le groupe `(tabs)`, organise les principaux modules sous forme d’onglets.

Ce découpage permet de distinguer deux niveaux :
- une navigation générale entre les grandes parties de l’application ;
- une navigation locale propre aux écrans principaux.

Le choix d’une Stack au niveau racine se justifie par la nécessité de gérer des transitions hiérarchiques entre écrans, par exemple entre une liste, une fiche détail et un formulaire d’édition.  
Le choix des Tabs permet quant à lui d’offrir un accès rapide aux modules les plus utilisés, tels que le dashboard, les clients, les devis ou l’agenda.

Enfin, Expo Router repose sur une convention de fichiers : chaque écran placé dans le dossier `app` devient une route navigable. Cette convention renforce la cohérence entre l’arborescence technique du projet et la structure fonctionnelle de l’application.

