# VIP TADJ — Évaluation des Plateformes de Déploiement & Guide de Mise en Production

**Plateforme** : VIP TADJ — Haute Élégance Masculine  
**Document** : Comparatif Vercel vs. Firebase & Manuel de Déploiement (Exigence R3)  
**Version** : 1.0.0 (Production-Ready)  
**Date** : Novembre 2026  

---

## Table des Matières
1. [Contexte Architectural & Enjeux de Déploiement](#1-contexte-architectural--enjeux-de-déploiement)
2. [Évaluation Comparative Structurée : Vercel vs. Firebase](#2-évaluation-comparative-structurée--vercel-vs-firebase)
   - 2.1 [Compatibilité Next.js 14 App Router](#21-compatibilité-nextjs-14-app-router)
   - 2.2 [Latence des Démarrages à Froid (Cold Starts) & Runtimes](#22-latence-des-démarrages-à-froid-cold-starts--runtimes)
   - 2.3 [Modèle Économique & Paliers Gratuits](#23-modèle-économique--paliers-gratuits)
   - 2.4 [Complexité de Configuration & Maintenance Opérationnelle](#24-complexité-de-configuration--maintenance-opérationnelle)
3. [Recommandation Stratégique pour VIP TADJ : L'Architecture Hybride](#3-recommandation-stratégique-pour-vip-tadj--larchitecture-hybride)
4. [Guide de Déploiement Pas à Pas pour la Cible Recommandée](#4-guide-de-déploiement-pas-à-pas-pour-la-cible-recommandée)
   - Étape 1 : [Préparation du Dépôt Git & Import sur Vercel](#étape-1--préparation-du-dépôt-git--import-sur-vercel)
   - Étape 2 : [Configuration des Variables d'Environnement](#étape-2--configuration-des-variables-denvironnement)
   - Étape 3 : [Validation des Paramètres de Build & Output Directory](#étape-3--validation-des-paramètres-de-build--output-directory)
   - Étape 4 : [Déploiement des Règles de Sécurité & Index Firestore via Firebase CLI](#étape-4--déploiement-des-règles-de-sécurité--index-firestore-via-firebase-cli)
   - Étape 5 : [Checklist de Validation & Tests Post-Déploiement](#étape-5--checklist-de-validation--tests-post-déploiement)

---

## 1. Contexte Architectural & Enjeux de Déploiement

VIP TADJ est une application web d'e-commerce de luxe développée sur la version **Next.js 14.2.18**, utilisant l'**App Router**. L'architecture logicielle exploite de façon intensive :
- Des **React Server Components (RSC)** pour le rendu instantané du storefront, l'injection des métadonnées OpenGraph et l'élimination du JavaScript superflu côté client.
- Des **Route Handlers dynamiques (`/api/*`)** pour la validation des commandes Cash-on-Delivery (COD), la mise à jour des statuts dans la machine à états et la gestion des stocks.
- Le **Dual-Provider Pattern (`IDataStore`)** : basculant automatiquement entre `FirestoreDataProvider` (Cloud Firestore en production) et `MockSeedDataProvider` (mode de secours résilient hors ligne).
- Une clientèle mobile située majoritairement en Algérie, naviguant sur des réseaux cellulaires (3G/4G) où le **Temps de Premier Octet (TTFB)** et la rapidité du démarrage à froid sont décisifs pour le taux de conversion.

Le choix de l'infrastructure d'hébergement doit donc maximiser les performances de l'App Router, minimiser les coûts d'exploitation et garantir une haute disponibilité sans complexité devops superflue.

---

## 2. Évaluation Comparative Structurée : Vercel vs. Firebase

Deux approches majeures s'offrent pour déployer cette pile technologique :
1. **Vercel** : La plateforme native conçue par les créateurs et mainteneurs de Next.js.
2. **Google Cloud Firebase** : Déploiement via *Firebase App Hosting* (basé sur Cloud Run) ou *Cloud Functions for Firebase v2*.

---

### Tableau Synthétique Comparatif

| Critère d'Évaluation | Vercel (Recommandé) | Firebase (App Hosting / Cloud Run) | Impact Spécifique pour VIP TADJ |
|---|---|---|---|
| **Support Next.js 14 App Router** | **Natif & Immédiat (Day-0)**<br>Support complet sans conteneurisation | **Support via Docker / Buildpacks**<br>Génère un conteneur Cloud Run | Vercel ne requiert aucun fichier `apphosting.yaml` ni compilation Docker. |
| **Latence Cold Start (RSC / API)** | **150 ms – 400 ms** (MicroVM Serverless Functions)<br>**< 50 ms** sur Edge Network | **1 500 ms – 5 000 ms** (Initialisation du conteneur Cloud Run + Node.js) | Sur un réseau 4G algérien, un cold start de 4s entraîne l'abandon du panier. |
| **Réseau CDN & PoPs Proximité** | **> 100 PoPs mondiaux** (Madrid, Marseille, Paris très proches d'Alger) | Google Cloud CDN lié aux régions Cloud Run (ex. `europe-west1`) | Vercel met en cache les bundles statiques et les routes dynamiques au plus près d'Alger. |
| **Coût & Formule Gratuite** | **Hobby Plan (100% Gratuit)**<br>• 100 Go de bande passante / mois<br>• Domaines personnalisés & SSL gratuits<br>• 100 Go-heures d'exécution serveur | **Spark Plan (Gratuit) mais INCOMPATIBLE SSR**<br>Nécessite le **Blaze Plan** (carte bancaire obligatoire) pour exécuter Cloud Run / SSR. | Vercel permet de faire tourner l'intégralité du front-end Next.js 14 sans aucune dépense d'infrastructure. |
| **Optimisation d'Images** | 1 000 images source / mois gratuites via `_next/image` | Nécessite le binaire Sharp dans Cloud Run ou un bucket GCS | VIP TADJ utilise Cloudinary et Unsplash en amont, rendant Vercel totalement gratuit. |
| **Déploiement Continu (CI/CD)** | **Zéro Configuration** : Push Git ──► Preview URL ──► Production automatique en ~60s | **Moyenne à Complexe** : Nécessite Secret Manager, Cloud Build API, IAM Permissions | Gain de temps considérable pour les déploiements et rollbacks immédiats. |
| **Rollback & Historique** | Restauration instantanée en 1 clic vers n'importe quel commit antérieur | Nécessite le redéploiement d'une révision Cloud Run ou image Docker | Sécurité opérationnelle maximale en cas de bug de production. |

---

### 2.1 Compatibilité Next.js 14 App Router

- **Vercel** :  
  Vercel est l'écosystème de référence pour Next.js. Toutes les fonctionnalités de pointe introduites dans Next.js 14 (Suspense streaming, Server Actions avec revalidation de cache via `revalidatePath`, gestion fine des cookies de session admin dans les Route Handlers) fonctionnent immédiatement sans configuration de runtime. Les routes statiques (`/`, `/catalog`, `/cart`) sont automatiquement distribuées sur le réseau CDN mondial, tandis que les Route Handlers (`/api/orders`, `/api/products`) sont isolés dans des fonctions serverless instantanées.
- **Firebase** :  
  Firebase a historiquement été conçu pour les applications monopages statiques (SPA) et les applications mobiles. Le support de Next.js SSR s'effectue via *Firebase App Hosting* (qui encapsule l'application dans une image conteneur OCI déployée sur Google Cloud Run) ou via l'intégration expérimentale des Cloud Functions v2. Bien que fonctionnel, chaque mise à jour majeure de Next.js peut nécessiter des ajustements de buildpack ou des patchs de compatibilité, et l'architecture impose la présence de Docker ou de configurations d'orchestration (`apphosting.yaml`).

---

### 2.2 Latence des Démarrages à Froid (Cold Starts) & Runtimes

- **Vercel** :  
  L'architecture repose sur des microVMs légères préchauffées. Lors d'un démarrage à froid (par exemple, la première requête de la journée sur `/api/orders`), la fonction s'exécute en **150 à 400 millisecondes**. Les pages statiques et les composants pré-rendus bénéficient d'un TTFB inférieur à **50 millisecondes**, car ils sont servis directement depuis le point de présence (PoP) edge le plus proche d'Algérie (Marseille / Madrid).
- **Firebase** :  
  Dans Cloud Run ou Cloud Functions, un démarrage à froid implique l'allocation d'une instance conteneurisée, le téléchargement de l'image, le démarrage du moteur Node.js et l'exécution du bundle complet. Les métriques observées oscillent entre **1 500 ms et 5 000 ms**. Pour un acheteur algérien passant commande sur son smartphone, une latence de 5 secondes au moment de cliquer sur "Confirmer la commande" crée une friction critique et incite au rechargement de la page, risquant de générer des doublons de commande.

---

### 2.3 Modèle Économique & Paliers Gratuits

- **Vercel** :  
  Le forfait **Vercel Hobby** est permanent et 100% gratuit :
  - **100 Go de bande passante mensuelle**.
  - **100 Go-heures de calcul serveur**.
  - Certificats SSL automatiques Let's Encrypt illimités.
  - Connexion automatique aux branches Git (GitHub / GitLab / Bitbucket).
  - Aucune carte de crédit requise pour démarrer.
- **Firebase** :  
  Bien que le plan *Spark* propose un hébergement statique gratuit, **le rendu dynamique côté serveur (SSR) et l'exécution de conteneurs Next.js sont strictement impossibles sur le plan gratuit**. L'activation de *Firebase App Hosting* ou *Cloud Functions* exige impérativement le passage au forfait **Blaze (Pay-as-you-go)** avec enregistrement d'une carte bancaire internationale. Même si les consommations initiales restent modestes, l'obligation de carte de paiement constitue un frein opérationnel pour de nombreuses entreprises locales.

---

### 2.4 Complexité de Configuration & Maintenance Opérationnelle

- **Vercel** :  
  Intégration directe avec le dépôt GitHub. Dès qu'un commit est poussé sur la branche `main`, Vercel détecte automatiquement Next.js, installe les dépendances avec `npm install`, compile avec `next build` et déploie sur son réseau Anycast en moins de 60 secondes. Chaque Pull Request génère automatiquement une URL de prévisualisation isolée (*Preview Deployment*).
- **Firebase** :  
  Exige l'installation du CLI Firebase, l'activation des API Google Cloud Platform (Cloud Run API, Artifact Registry API, Cloud Build API, Secret Manager), la configuration du fichier `apphosting.yaml` et la gestion des rôles de service IAM (*Service Accounts*). Le cycle de build conteneurisé prend généralement 4 à 8 minutes par déploiement.

---

## 3. Recommandation Stratégique pour VIP TADJ : L'Architecture Hybride

Au vu des résultats comparatifs, la recommandation technique officielle et définitive pour VIP TADJ est la suivante :

### 🏆 Architecture Hybride Gagnante : Vercel (Front-end & API) + Google Cloud Firebase (Données & Auth)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARCHITECTURE HYBRIDE OFFICIELLE                       │
└─────────────────────────────────────────────────────────────────────────────┘

       [Clients Algérie & International (Mobile / Desktop / 4G)]
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │             COUCHE FRONT-END & APPLICATION             │
      │                     HÉBERGÉ SUR VERCEL                 │
      │  - Next.js 14 App Router (RSC, Server Actions)        │
      │  - CDN Mondial Anycast (PoP Madrid / Marseille)        │
      │  - Route Handlers sécurisés (/api/orders, /api/media)  │
      │  - Coût d'infrastructure : 0,00 $ (Hobby Plan)         │
      └────────────────────────────────────────────────────────┘
                                  │
                                  ▼ (Appels Sécurisés SDK Web)
      ┌────────────────────────────────────────────────────────┐
      │          COUCHE BASE DE DONNÉES & AUTHENTIFICATION     │
      │           HÉBERGÉ SUR GOOGLE CLOUD FIREBASE            │
      │  - Cloud Firestore (Mode Natif Document Store)         │
      │  - 7 Index Composés (firestore.indexes.json)           │
      │  - Règles de Sécurité Granulaires (firestore.rules)    │
      │  - Firebase Authentication (Sessions Administrateur)   │
      │  - Coût d'infrastructure : 0,00 $ (Spark Plan Gratuit) │
      └────────────────────────────────────────────────────────┘
                                  │
                                  ▼ (Uploads Directs & CDN)
      ┌────────────────────────────────────────────────────────┐
      │                 COUCHE MÉDIA & VISUELS                 │
      │                 HÉBERGÉ SUR CLOUDINARY                 │
      │  - Uploads directs non-signés (client-side XHR)        │
      │  - Optimisation f_auto, q_auto                         │
      │  - Coût d'infrastructure : 0,00 $ (Free Plan 25 Crédits)│
      └────────────────────────────────────────────────────────┘
```

### Pourquoi ce choix est le plus performant pour VIP TADJ ?
1. **Zéro Coût Fixe d'Hébergement** : L'ensemble des 3 briques (Vercel Hobby + Firebase Spark + Cloudinary Free) fonctionne en production à **0,00 $/mois**, tout en supportant confortablement plusieurs milliers de visiteurs quotidiens.
2. **Expérience Utilisateur d'Élite** : Les acheteurs bénéficient de la réactivité maximale de Next.js 14 sur Vercel (< 100 ms TTFB), sans jamais subir de démarrage à froid de 5 secondes.
3. **Pérennité & Scalabilité des Données** : Les commandes et le catalogue restent stockés dans l'infrastructure Cloud Firestore hautement disponible de Google Cloud, avec réplication multi-zones et exports réguliers.

---

## 4. Guide de Déploiement Pas à Pas pour la Cible Recommandée

Suivez rigoureusement ce guide pour déployer VIP TADJ en production sur Vercel et connecter votre instance Cloud Firestore.

---

### Étape 1 : Préparation du Dépôt Git & Import sur Vercel

1. **Initialisation du Dépôt Git** (si ce n'est pas déjà fait) :
   ```bash
   git add .
   git commit -m "feat(prod): configuration de production et readiness audit"
   git push origin main
   ```
2. **Connexion à Vercel** :
   - Rendez-vous sur [vercel.com](https://vercel.com) et connectez-vous avec votre compte GitHub.
3. **Importation du Projet** :
   - Cliquez sur **Add New...** ──► **Project**.
   - Sélectionnez votre dépôt `VIP-TADJ` dans la liste.
   - Vercel détecte automatiquement : **Framework Preset: Next.js**.

---

### Étape 2 : Configuration des Variables d'Environnement

Dans l'écran d'importation de Vercel (ou ultérieurement dans *Project Settings > Environment Variables*), renseignez l'intégralité des variables en consultant le fichier de référence `.env.example` :

| Nom de la Variable | Exemple de Valeur | Visibilité | Rôle |
|---|---|---|---|
| `NODE_ENV` | `production` | Production | Définit le runtime de production Next.js |
| `NEXT_PUBLIC_APP_URL` | `https://www.viptadj.dz` | Tous | URL canonique du site |
| `NEXT_PUBLIC_SITE_NAME` | `VIP TADJ — Haute Élégance Masculine` | Tous | Nom officiel affiché |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q` | Client / Serveur | Clé API Web Firebase Client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `vip-tadj-prod.firebaseapp.com` | Client | Domaine d'authentification Firebase |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `vip-tadj-prod` | Client / Serveur | Identifiant du projet Google Cloud |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `vip-tadj-prod.appspot.com` | Client | Bucket Cloud Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Client | Identifiant d'expéditeur FCM |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abcdef012345` | Client | Identifiant de l'application Web |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Client | Identifiant de suivi Google Analytics 4 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `viptadj` | Client / Serveur | Nom de compte Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `viptadj_unsigned_products` | Client / Serveur | Nom du preset d'upload non-signé |
| `CLOUDINARY_CLOUD_NAME` | `viptadj` | Serveur | Fallback serveur Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | `viptadj_unsigned_products` | Serveur | Fallback serveur Cloudinary |
| `SEED_SECRET` | `vt_prod_seed_sec_994821a7c3f8e02d` | Serveur (Secret) | Clé secrète de protection du `/api/seed` |
| `NEXT_PUBLIC_STORE_PHONE` | `0550123456` | Client | Téléphone du service client algérien |
| `NEXT_PUBLIC_STORE_WHATSAPP` | `213550123456` | Client | Numéro WhatsApp pour confirmation COD |

> 🔒 **Consigne de sécurité** : Cochez les cases **Production** et **Preview** pour toutes ces variables.

---

### Étape 3 : Validation des Paramètres de Build & Output Directory

Dans les paramètres de build Vercel (*Build and Output Settings*) :
- **Build Command** : `next build` (ou laisser sur *Default*).
- **Output Directory** : `.next` (laisser sur *Default*).
- **Install Command** : `npm install` (laisser sur *Default*).
- **Root Directory** : `./` (laisser vide).

Cliquez sur **Deploy**.  
En 60 à 90 secondes, le statut passe au vert : **Congratulations! Your project has been deployed**.

---

### Étape 4 : Déploiement des Règles de Sécurité & Index Firestore via Firebase CLI

Afin que le backend Cloud Firestore applique les 7 index composés et les règles de sécurité déclarées dans le projet, déployez-les depuis votre terminal local :

1. **Vérification de la présence des fichiers de configuration** :
   Assurez-vous que `firebase.json` et `.firebaserc` sont bien présents à la racine du projet :
   ```json
   // firebase.json
   {
     "firestore": {
       "rules": "firestore.rules",
       "indexes": "firestore.indexes.json"
     }
   }
   ```
   ```json
   // .firebaserc
   {
     "projects": {
       "default": "vip-tadj-prod"
     }
   }
   ```

2. **Authentification Firebase** :
   ```bash
   npx firebase login
   ```

3. **Liaison au Projet de Production** :
   ```bash
   npx firebase use vip-tadj-prod
   ```

4. **Déploiement des Règles & des Index** :
   ```bash
   npx firebase deploy --only firestore
   ```
   *Sortie attendue* :
   ```text
   ✔  firestore: released rules firestore.rules to cloud.firestore
   ✔  firestore: indexes in firestore.indexes.json deployed successfully
   ```

5. **Initialisation du Catalogue de Production (Seeding Sécurisé)** :
   Une fois le déploiement terminé, initialisez le catalogue de départ (18 produits de prestige et les paramètres des 58 Wilayas) en exécutant une requête HTTP autorisée par votre clé `SEED_SECRET` :
   ```bash
   curl -X POST "https://www.viptadj.dz/api/seed?secret=vt_prod_seed_sec_994821a7c3f8e02d" \
        -H "Content-Type: application/json" \
        -d '{"force": false}'
   ```
   *Réponse attendue* :
   ```json
   {
     "success": true,
     "message": "Catalogue et paramètres initialisés avec succès dans Cloud Firestore.",
     "count": 18
   }
   ```

---

### Étape 5 : Checklist de Validation & Tests Post-Déploiement

Exécutez cette procédure de vérification dès la mise en ligne :

- [ ] **1. Vérification de la Page d'Accueil (`/`)** :  
  L'application charge le thème luxe noir obsidienne & or (`#0B0C10`, `#D4AF37`), les 3 univers de confection (Vêtements, Chaussures, Accessoires) s'affichent sans image brisée.
- [ ] **2. Vérification de la Bascule Bilingue FR / AR** :  
  Cliquer sur le sélecteur de langue dans la barre supérieure. En arabe (`العربية`), la direction du document passe immédiatement en RTL (`dir="rtl"`), la typographie Tajawal/Amiri s'applique, et les intitulés se traduisent fidèlement.
- [ ] **3. Test du Tunnel de Commande Cash-on-Delivery (`/checkout`)** :  
  - Ajouter un costume au panier (`/cart`).
  - Sélectionner la Wilaya d'Alger (16) : vérifier les frais de livraison à domicile (400 DA) ou en bureau (250 DA).
  - Ajouter des articles pour dépasser 15 000 DA : vérifier que le badge **"Livraison Gratuite"** s'active immédiatement et que les frais passent à 0 DA.
  - Saisir un numéro de téléphone algérien valide (ex. `0550123456`) et valider la commande.
  - Vérifier l'arrivée sur `/checkout/success/[orderId]` avec le numéro de référence généré et le bouton d'ouverture directe vers WhatsApp Concierge.
- [ ] **4. Test du Portail Administrateur (`/admin`)** :  
  - Accéder à `/admin/orders`.
  - Vérifier que la nouvelle commande apparaît en statut `pending`.
  - Vérifier le carillon audio d'alerte lors de l'arrivée d'une commande.
  - Mettre à jour le statut vers `confirmed` puis `shipped` : vérifier la transition d'état et l'audit trail.
- [ ] **5. Test d'Upload Photo Direct (`/admin/products/new`)** :  
  - Téléverser une photo de test depuis un téléphone.
  - Vérifier que la compression automatique ramène l'image sous 350 Ko et que l'URL retournée provient du CDN Cloudinary.
