# VIP TADJ — Manuel des Opérations de Production

**Plateforme** : VIP TADJ — Haute Élégance Masculine  
**Document** : Manuel d'Exploitation & Guide des Opérations Marché Algérien (Exigence R4)  
**Version** : 1.0.0 (Production-Ready)  
**Date** : Novembre 2026  

---

## Table des Matières
1. [Introduction & Rôles Opérationnels](#1-introduction--rôles-opérationnels)
2. [Gestion des Secrets & Variables d'Environnement de Production](#2-gestion-des-secrets--variables-denvironnement-de-production)
3. [Configuration du Domaine Personnalisé (`viptadj.dz`) & Certificats SSL](#3-configuration-du-domaine-personnalisé-viptadjdz--certificats-ssl)
4. [Maintenance Cloud Firestore : Index Composés & Sauvegardes Automatisées](#4-maintenance-cloud-firestore--index-composés--sauvegardes-automatisées)
   - 4.1 [Déploiement des 7 Index Composés](#41-déploiement-des-7-index-composés)
   - 4.2 [Procédure de Sauvegarde Quotidienne sur Google Cloud Storage (GCS)](#42-procédure-de-sauvegarde-quotidienne-sur-google-cloud-storage-gcs)
   - 4.3 [Procédure de Restauration d'Urgence (Disaster Recovery)](#43-procédure-de-restauration-durgence-disaster-recovery)
5. [Opérations Spécifiques au Marché Algérien](#5-opérations-spécifiques-au-marché-algérien)
   - 5.1 [Grille Tarifaire des 58 Wilayas (Domicile vs. Bureau / Point Relais)](#51-grille-tarifaire-des-58-wilayas-domicile-vs-bureau--point-relais)
   - 5.2 [Règle Nationale de Gratuité des Frais de Port (Seuil 15 000 DA)](#52-règle-nationale-de-gratuité-des-frais-de-port-seuil-15-000-da)
   - 5.3 [Cycle de Vie & Traitement des Commandes Cash-on-Delivery (COD)](#53-cycle-de-vie--traitement-des-commandes-cash-on-delivery-cod)
   - 5.4 [Validation Téléphonique Pré-Expédition & Protection Anti-RTO](#54-validation-téléphonique-pré-expédition--protection-anti-rto)
   - 5.5 [Notification Audio en Temps Réel & Conciergerie WhatsApp](#55-notification-audio-en-temps-réel--conciergerie-whatsapp)
6. [Plan de Continuité & Procédures d'Urgence](#6-plan-de-continuité--procédures-durgence)

---

## 1. Introduction & Rôles Opérationnels

Ce document constitue le manuel d'exploitation officiel destiné à l'équipe technique et aux gestionnaires opérationnels de VIP TADJ en Algérie. Il régit la configuration de l'infrastructure, la sécurisation des secrets, les sauvegardes de la base de données, ainsi que la logistique et le traitement des commandes en paiement à la livraison (*Cash-on-Delivery* - COD).

---

## 2. Gestion des Secrets & Variables d'Environnement de Production

### 2.1 Classification des Variables
Les variables d'environnement de VIP TADJ sont classées en deux catégories étanches :
1. **Variables Publiques (`NEXT_PUBLIC_*`)** :  
   Ces clés sont intégrées au code JavaScript compilé par Next.js et transmises au navigateur du visiteur. Elles ne doivent contenir aucun mot de passe d'administration ni clé secrète avec droits d'écriture sans restriction.
2. **Variables Privées (Serveur Uniquement)** :  
   Exécutées exclusivement dans le contexte Node.js sur les fonctions serveur Vercel. Elles ne sont jamais exposées au client web.

### 2.2 Inventaire des Variables & Valeurs Recommandées

| Clé | Portée | Description & Format | Exemple Production |
|---|---|---|---|
| `NODE_ENV` | Système | Environnement d'exécution | `production` |
| `NEXT_PUBLIC_APP_URL` | Publique | URL officielle sans slash final | `https://www.viptadj.dz` |
| `NEXT_PUBLIC_SITE_NAME` | Publique | Nom de la marque | `VIP TADJ — Haute Élégance Masculine` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Publique | Clé API Web Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Publique | Domaine d'authentification | `vip-tadj-prod.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Publique | Projet Google Cloud / Firebase | `vip-tadj-prod` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`| Publique | Bucket de stockage Firebase | `vip-tadj-prod.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Publique | ID numérique de messagerie | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Publique | ID de l'application Web | `1:123456789012:web:abcdef...` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Publique | ID de mesure Google Analytics 4 | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Publique | Nom du Cloud Cloudinary | `viptadj` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| Publique | Nom de l'upload preset non-signé | `viptadj_unsigned_products` |
| `CLOUDINARY_CLOUD_NAME` | Privée | Fallback serveur pour `/api/media/upload`| `viptadj` |
| `CLOUDINARY_UPLOAD_PRESET` | Privée | Fallback serveur pour `/api/media/upload`| `viptadj_unsigned_products` |
| `SEED_SECRET` | Privée | Jeton cryptographique d'accès au seed | Chaîne aléatoire hexadécimale 32+ caractères |
| `NEXT_PUBLIC_STORE_PHONE` | Publique | Ligne téléphonique du service client | `0550123456` |
| `NEXT_PUBLIC_STORE_WHATSAPP` | Publique | WhatsApp format international (213) | `213550123456` |

### 2.3 Rotation des Secrets & Bonnes Pratiques
- **Génération de `SEED_SECRET`** : Générer une clé robuste avec OpenSSL avant le premier déploiement :
  ```bash
  openssl rand -hex 32
  ```
- **Gestion des Changements** : Tout changement de variable sur le tableau de bord Vercel déclenche automatiquement une invite de redéploiement (*Redeploy*) pour intégrer les nouvelles valeurs aux bundles compilés.

---

## 3. Configuration du Domaine Personnalisé (`viptadj.dz`) & Certificats SSL

### 3.1 Architecture DNS
VIP TADJ recommande l'utilisation d'un nom de domaine sous le registre national algérien (`.dz`), ou d'une extension internationale (`.com`). La configuration standard configure le sous-domaine `www.viptadj.dz` comme URL canonique et redirige le domaine racine (Apex) vers celui-ci via une redirection permanente HTTP 308.

```
[Visiteur tape viptadj.dz] ──► (Redirection 308) ──► [https://www.viptadj.dz]
```

### 3.2 Table des Enregistrements DNS à Configurer chez le Registrar (NIC.DZ, Hostinger, Namecheap)

| Type | Nom d'Hôte / Host | Cible / Valeur | TTL | Rôle |
|---|---|---|---|---|
| **A** | `@` (ou racine `viptadj.dz`) | `76.76.21.21` | 300 s (5 min) | Route l'Apex vers le réseau Anycast Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com.` | 300 s (5 min) | Route le sous-domaine www vers Vercel Edge |

*(Si votre registrar supporte les enregistrements ALIAS ou ANAME sur la racine, vous pouvez faire pointer directement l'Apex vers `cname.vercel-dns.com`)*.

### 3.3 Provisionnement Automatique SSL/TLS
1. Dès que la propagation DNS est effective (généralement 15 minutes à 2 heures pour le registre `.dz`), Vercel génère automatiquement un certificat SSL/TLS X.509 émis par l'autorité de certification **Let's Encrypt** (avec ZeroSSL en secours).
2. **Renouvellement Automatisé** : Le certificat est renouvelé silencieusement par Vercel 30 jours avant son expiration sans aucune intervention de l'administrateur.
3. **Sécurité HSTS** : Tout le trafic HTTP non chiffré sur le port 80 est automatiquement redirigé vers HTTPS sur le port 443 avec l'en-tête `Strict-Transport-Security`.

---

## 4. Maintenance Cloud Firestore : Index Composés & Sauvegardes Automatisées

### 4.1 Déploiement des 7 Index Composés
Pour permettre les requêtes complexes du catalogue (tri par prix croissant/décroissant au sein d'une catégorie, filtrage par statut de commande et par Wilaya), le projet intègre 7 index composés dans `firestore.indexes.json` :

```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "inStock", "order": "ASCENDING" },
        { "fieldPath": "isFeatured", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "categorySlug", "order": "ASCENDING" },
        { "fieldPath": "subcategory", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "customer.wilayaCode", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Commande de Déploiement** :
```bash
npx firebase deploy --only firestore:indexes
```
Vérifiez dans la console Firebase (*Firestore Database > Onglet Index*) que tous les index affichent l'état vert **Activé** (*Enabled*).

---

### 4.2 Procédure de Sauvegarde Quotidienne sur Google Cloud Storage (GCS)

La base de données Firestore contient l'ensemble des commandes et des fiches produits. Afin de prévenir toute corruption ou erreur humaine, une sauvegarde quotidienne automatisée doit être activée via Google Cloud CLI (`gcloud`).

#### Étape A : Création du Bucket de Sauvegarde
Créer un bucket Cloud Storage situé dans la même région que votre base Firestore (ex. `europe-west1` pour une faible latence) :
```bash
gcloud storage buckets create gs://viptadj-firestore-backups \
    --project=vip-tadj-prod \
    --location=europe-west1 \
    --default-storage-class=NEARLINE
```

#### Étape B : Attribution des Droits IAM au Service Account Firestore
Autoriser le compte de service Cloud Firestore à écrire dans ce bucket :
```bash
PROJECT_ID="vip-tadj-prod"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/datastore.importExportAdmin"

gcloud storage buckets add-iam-policy-binding gs://viptadj-firestore-backups \
    --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
    --role="roles/storage.admin"
```

#### Étape C : Automatisation Quotidienne via Cloud Scheduler
Créer une tâche planifiée exécutant l'export à 03:00 heure d'Alger (02:00 UTC, heures creuses) :
```bash
gcloud scheduler jobs create http firestore-daily-backup \
    --project=vip-tadj-prod \
    --location=europe-west1 \
    --schedule="0 2 * * *" \
    --time-zone="UTC" \
    --uri="https://firestore.googleapis.com/v1/projects/vip-tadj-prod/databases/(default):exportDocuments" \
    --message-body='{"outputUriPrefix": "gs://viptadj-firestore-backups/daily"}' \
    --oauth-service-account-email="${PROJECT_ID}@appspot.gserviceaccount.com"
```

---

### 4.3 Procédure de Restauration d'Urgence (Disaster Recovery)

En cas d'incident critique nécessitant la restauration de la base à partir d'une sauvegarde antérieure :

1. **Identifier l'horodatage du dossier de sauvegarde dans GCS** :
   ```bash
   gcloud storage ls gs://viptadj-firestore-backups/daily/
   ```
   *Exemple d'URI identifiée* : `gs://viptadj-firestore-backups/daily/2026-11-16T02:00:00_45892/`

2. **Lancer la restauration complète** :
   ```bash
   gcloud firestore import gs://viptadj-firestore-backups/daily/2026-11-16T02:00:00_45892/ \
       --project=vip-tadj-prod
   ```

3. **Restauration ciblée d'une seule collection (ex. Catalogue Produits)** :
   ```bash
   gcloud firestore import gs://viptadj-firestore-backups/daily/2026-11-16T02:00:00_45892/ \
       --collection-ids='products' \
       --project=vip-tadj-prod
   ```

---

## 5. Opérations Spécifiques au Marché Algérien

### 5.1 Grille Tarifaire des 58 Wilayas (Domicile vs. Bureau / Point Relais)

Le commerce en ligne algérien s'appuie sur deux modes de distribution physique via les réseaux de messagerie express (Yalidine, ZR Express, Maystro, Procolis) :
- **À Domicile (Home Delivery)** : Livraison par coursier directement à la porte du client.
- **En Bureau / Stop Desk (Desk Pickup)** : Le client récupère lui-même son colis dans l'agence ou point relais local du transporteur, à un tarif préférentiel.

VIP TADJ couvre l'intégralité des 58 Wilayas d'Algérie, réparties en 4 grandes zones logistiques tarifaires :

| Zone Géographique | Wilayas Incluses | Tarif Domicile | Tarif Bureau (Desk) | Délai Estimé |
|---|---|---|---|---|
| **Zone 1 : Capitale (Alger)** | 16 - Alger | **400 DA** | **250 DA** | 24 heures |
| **Zone 2 : Grand Centre** | 09 - Blida, 35 - Boumerdès, 42 - Tipaza | **500 DA** | **300 DA** | 24 à 48 heures |
| **Zone 3 : Nord, Est, Ouest & Hauts-Plateaux** | 15 - Tizi Ouzou, 06 - Béjaïa, 25 - Constantine, 31 - Oran, 19 - Sétif, 13 - Tlemcen, 23 - Annaba, 02 - Chlef, 10 - Bouira, 18 - Jijel, 21 - Skikda, 26 - Médéa, 27 - Mostaganem, 28 - M'Sila, 29 - Mascara, etc. | **600 DA** | **350 DA** | 24 à 48 heures |
| **Zone 4 : Grand Sud & Oasis** | 01 - Adrar, 03 - Laghouat, 07 - Biskra, 08 - Béchar, 11 - Tamanrasset, 30 - Ouargla, 33 - Illizi, 39 - El Oued, 47 - Ghardaïa, 52 - Béni Abbès, 53 - In Salah, 54 - In Guezzam, 55 - Touggourt, 56 - Djanet, 57 - El M'Ghair, 58 - El Meniaa | **800 – 900 DA** | **500 – 600 DA** | 48 à 96 heures |

*Note technique* : Les tarifs par défaut sont déclarés dans `src/lib/data/wilayas.ts` et peuvent être ajustés dynamiquement sans redéploiement depuis l'onglet **Paramètres de Livraison** du portail administrateur (`/admin/settings`).

---

### 5.2 Règle Nationale de Gratuité des Frais de Port (Seuil 15 000 DA)

Pour encourager les paniers d'achat à forte valeur ajoutée (notamment les costumes complets, blazers semi-entoilés et souliers artisanaux), VIP TADJ intègre une règle d'exemption tarifaire nationale :

- **Montant du Seuil** : `DEFAULT_FREE_SHIPPING_THRESHOLD = 15000` (15 000 DA).
- **Règle de Calcul (`src/lib/utils/deliveryUtils.ts`)** :
  ```typescript
  if (subtotal >= freeShippingThreshold) {
    return 0; // Frais de livraison offerts sur les 58 Wilayas !
  }
  ```
- **Affichage Dynamique** :  
  Dans le panier (`/cart`) et au paiement (`/checkout`), une jauge interactive indique au client le montant restant pour débloquer la livraison gratuite. Dès que `subtotal >= 15000`, les frais sont automatiquement rayés et remplacés par la mention en lettres d'or **"OFFERTE"**.

---

### 5.3 Cycle de Vie & Traitement des Commandes Cash-on-Delivery (COD)

En Algérie, plus de 95% des transactions e-commerce s'effectuent en paiement à la livraison (COD). La gestion rigoureuse de la machine à états des commandes est essentielle pour prévenir les ruptures de stock fantômes et les impayés.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 MACHINE À ÉTATS D'UNE COMMANDE COD VIP TADJ                 │
└─────────────────────────────────────────────────────────────────────────────┘

       [Passation de Commande par le Client]
                         │
                         ▼
                   ┌───────────┐
                   │  PENDING  │ ◄── [Alerte Chime Sonore dans l'Admin]
                   └─────┬─────┘
                         │
        ┌────────────────┴────────────────┐
        ▼ (Appel de Validation Réussi)    ▼ (Injoignable / Annulation)
  ┌───────────┐                     ┌───────────┐
  │ CONFIRMED │                     │ CANCELLED │ ◄── [VERROUILLÉ / STOCK RESTAURÉ]
  └─────┬─────┘                     └───────────┘
        │
        ▼ (Remise au Transporteur Yalidine/ZR)
   ┌─────────┐
   │ SHIPPED │
   └────┬────┘
        │
        ├─────────────────────────────────┐
        ▼ (Client a Payé en Espèces)      ▼ (Refus de Colis / Colis Retourné)
  ┌───────────┐                     ┌───────────┐
  │ DELIVERED │                     │ CANCELLED │ ◄── [VERROUILLÉ / STOCK RESTAURÉ]
  └───────────┘                     └───────────┘
        ▲
        └─ [VERROUILLÉ : COMMANDE DÉFINITIVE]
```

#### Transitions Légales & Actions Déclenchées (`orderStateMachine.ts`) :
1. **`pending` ──► `confirmed`** :  
   Déclenché par l'administrateur après appel téléphonique au client. Confirme la taille du costume et l'adresse physique. Le stock demeure réservé.
2. **`confirmed` ──► `shipped`** :  
   Déclenché lors de la remise physique du colis au transporteur express avec saisie du numéro de suivi (*Tracking Number*).
3. **`shipped` ──► `delivered`** :  
   Déclenché lorsque le coursier encaisse les dinars algériens (DA) en espèces et confirme la remise. Cet état est **terminal et irréversible**.
4. **Transition vers `cancelled`** :  
   Possible depuis les états `pending`, `confirmed`, ou `shipped` (en cas de retour de livraison).  
   **Effet Automatique Majeur** : La transition vers `cancelled` déclenche obligatoirement la **restauration immédiate des stocks** dans l'inventaire Firestore (`stockQuantity += item.quantity`, `inStock = true`) et exige la saisie d'un motif documenté parmi la liste officielle (`customer_cancelled`, `customer_unreachable`, `invalid_phone`, `out_of_stock`, `refused_delivery`, `duplicate_order`, `other`).

---

### 5.4 Validation Téléphonique Pré-Expédition & Protection Anti-RTO

Le fléau majeur du e-commerce en Algérie est le taux de retour à l'expéditeur (*Return-To-Origin* - RTO), souvent causé par des numéros erronés, des commandes impulsives non honorées ou des fausses adresses. VIP TADJ déploie une défense à 3 niveaux :

1. **Validation Stricte des Préfixes Mobiles Algériens (`phoneUtils.ts`)** :  
   Le formulaire de commande refuse toute soumission qui ne correspond pas aux formats mobiles nationaux :
   - Mobilis : `06XX XX XX XX`
   - Djezzy : `07XX XX XX XX`
   - Ooredoo : `05XX XX XX XX`
   - Formats internationaux autorisés : `+213 5/6/7...` ou `00213 5/6/7...`
   - Les téléphones fixes (`02`, `03`, `04`) et numéros fantaisistes sont systématiquement rejetés dès la saisie.
2. **Protocole de l'Appel de Confirmation sous 2 Heures** :  
   Toute commande à l'état `pending` doit faire l'objet d'un appel téléphonique par le concierge VIP TADJ :
   - Cliquer sur le bouton d'appel direct dans `/admin/orders/[id]` (`tel:+213...`).
   - Vérifier la stature du client pour confirmer la taille de la veste (48, 50, 52...) ou des souliers.
   - Valider la disponibilité du destinataire pour recevoir le livreur en espèces sous 24h à 48h.
3. **Protection contre le Double Clic & Commandes Doublons** :  
   Le bouton de validation au checkout désactive immédiatement les interactions et bloque les soumissions concurrentes avec le même numéro de téléphone dans un intervalle de 60 secondes.

---

### 5.5 Notification Audio en Temps Réel & Conciergerie WhatsApp

1. **Carillon Audio en Temps Réel (`orderAudioChime.ts`)** :  
   Lorsque le gestionnaire garde l'onglet `/admin` ouvert sur son ordinateur ou sa tablette, un polling toutes les 30 secondes compare le nombre de commandes en attente avec l'état précédent. Dès qu'une nouvelle commande est détectée, le synthétiseur audio Web Audio API génère un **accord carillon harmonieux à double ton or** (fréquence 587.33 Hz [D5] suivie de 880.00 Hz [A5]) pour alerter instantanément l'équipe sans nécessiter de rafraîchissement manuel de la page.
2. **Générateur de Lien WhatsApp Concierge Bilingue (`contactUtils.ts`)** :  
   Sur la page de confirmation de commande `/checkout/success/[orderId]`, un bouton doré proéminent permet au client de notifier le concierge VIP TADJ en un clic.  
   Le lien `https://wa.me/213550123456?text=...` pré-remplit un message élégant reprenant le numéro de commande, le nom du client, la liste des articles et le montant total en dinars, rédigé en français ou en arabe selon la langue active du visiteur.

---

## 6. Plan de Continuité & Procédures d'Urgence

| Scénario d'Incident | Symptôme Observé | Procédure de Résolution Immédiate |
|---|---|---|
| **Régression de Code suite à un Déploiement** | Page d'accueil en erreur ou comportement inattendu | Rendez-vous sur Vercel > Déploiements > Identifier le déploiement stable précédent > Cliquer sur **Instant Rollback**. Le rétablissement s'effectue en 10 secondes. |
| **Quota Cloudinary Épuisé** | Rejet des uploads de photos dans l'administration | 1. Les images existantes continuent d'être servies.<br>2. Basculer temporairement sur l'onglet **Lien Google Drive** dans l'administration pour ajouter de nouveaux visuels.<br>3. Mettre à niveau le compte Cloudinary vers le plan Plus (89 $/mois). |
| **Erreur de Permissions Firestore** | Statuts de commandes non modifiables ou catalogue vide | 1. Exécuter `npx firebase deploy --only firestore:rules` pour réinitialiser les règles de sécurité déclarées dans `firestore.rules`.<br>2. Vérifier que l'UID de l'administrateur figure bien dans la collection `/admins`. |
| **Panne Rapprochement Transporteur** | Tarifs d'une Wilaya modifiés par Yalidine/ZR | Rendez-vous sur `/admin/settings` > Modifier directement le tarif domicile ou bureau de la Wilaya concernée > Enregistrer. La mise à jour est immédiate pour tous les clients sans redéploiement de code. |
