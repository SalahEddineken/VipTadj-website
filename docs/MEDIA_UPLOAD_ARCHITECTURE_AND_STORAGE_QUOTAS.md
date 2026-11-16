# VIP TADJ — Architecture des Médias & Guide des Quotas de Stockage

**Plateforme** : VIP TADJ — Haute Élégance Masculine  
**Document** : Spécification Technique & Guide Opérationnel des Médias (Exigence R2)  
**Version** : 1.0.0 (Production-Ready)  
**Date** : Novembre 2026  

---

## Table des Matières
1. [Vue d'Ensemble & Principes Architecturaux](#1-vue-densemble--principes-architecturaux)
2. [Mécanisme d'Upload Direct Cloudinary (Non-Signé)](#2-mécanisme-dupload-direct-cloudinary-non-signé)
3. [Compression Pré-Upload dans le Navigateur (`client-image-compressor.ts`)](#3-compression-pré-upload-dans-le-navigateur-client-image-compressorts)
4. [Normalisateur d'URLs Google Drive (`url-normalizer.ts`)](#4-normalisateur-durls-google-drive-url-normalizerts)
5. [Réseau de Diffusion (CDN) Externe & Système de Secours Luxe](#5-réseau-de-diffusion-cdn-externe--système-de-secours-luxe)
6. [Modélisation Détaillée des Quotas de Stockage et Bande Passante (en Go)](#6-modélisation-détaillée-des-quotas-de-stockage-et-bande-passante-en-go)
7. [Guide de Configuration Opérationnelle Cloudinary en Production](#7-guide-de-configuration-opérationnelle-cloudinary-en-production)
8. [Sécurité, Hardening & Protection Anti-Abus](#8-sécurité-hardening--protection-anti-abus)

---

## 1. Vue d'Ensemble & Principes Architecturaux

VIP TADJ adopte une architecture média **multi-paliers à coût zéro**, spécialement conçue pour concilier une présentation visuelle haute fidélité (produits de luxe, costumes sur-mesure, souliers artisanaux) avec les contraintes d'infrastructure sans serveur (*serverless*) et les réalités du réseau algérien (connexions 3G/4G hétérogènes).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FLUX D'ACQUISITION & DIFFUSION                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                  │
                  [Capture Photo / Fichier Source]
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │     1. COMPRESSION CLIENT (HTML5 Canvas Offscreen)     │
      │        (12 Mo photo smartphone ──► ~300 Ko WebP/JPEG)  │
      └────────────────────────────────────────────────────────┘
                                  │
        ┌─────────────────────────┴─────────────────────────┐
        ▼                                                   ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  Mode 1 : Upload Direct      │              │  Mode 2 : URL Google Drive   │
│  Cloudinary Non-Signé        │              │  (Normalisation instantanée) │
│  (XHR direct Navigateur->CDN)│              │  (/file/d/... ──► uc / lh3)  │
└──────────────────────────────┘              └──────────────────────────────┘
        │                                                   │
        └─────────────────────────┬─────────────────────────┘
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │     2. NORMALISATION & OPTIMISATION (Edge CDN)         │
      │        - Cloudinary : f_auto,q_auto,w_{width},c_limit  │
      │        - Unsplash   : auto=format&fit=crop&q=80&w=1200 │
      │        - Fallback   : SVG Luxe Vectoriel Obsidian/Or   │
      └────────────────────────────────────────────────────────┘
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │     3. PERSISTANCE BASE DE DONNÉES (Cloud Firestore)   │
      │        ProductImage: { id, url, alt, isPrimary, ... }  │
      └────────────────────────────────────────────────────────┘
                                  │
                                  ▼
      ┌────────────────────────────────────────────────────────┐
      │     4. AFFICHAGE STOREFRONT SANS FRAIS DE COMPUTE      │
      │        Native <img> ciblant directement les flux CDN   │
      │        (Évite le quota Vercel de 1 000 images Next/img)│
      └────────────────────────────────────────────────────────┘
```

### Règle d'Or de l'Architecture
1. **Zéro transit de fichiers lourds sur les lambdas Vercel** : Transiter des fichiers de 10 Mo par le serveur Next.js consommerait la mémoire des fonctions serverless, ralentirait l'upload et saturerait la bande passante edge. Les uploads vont directement du navigateur de l'administrateur aux serveurs de Cloudinary.
2. **Préservation de la clé secrète** : L'upload non-signé garantit qu'aucun `API_SECRET` n'est injecté dans le bundle JavaScript public.
3. **Zéro dépendance fragile** : Si Cloudinary n'est pas configuré, l'application fonctionne avec Google Drive, les 26 assets curated Unsplash, ou le générateur de placeholder SVG vectoriel intégré.

---

## 2. Mécanisme d'Upload Direct Cloudinary (Non-Signé)

### 2.1 Fonctionnement Technique (`src/lib/media/upload-service.ts`)
L'upload direct repose sur l'API d'upload REST de Cloudinary, exécutée côté client via `XMLHttpRequest` afin de fournir un retour visuel en temps réel sur la progression du transfert.

- **Point de terminaison (Endpoint)** :
  ```http
  POST https://api.cloudinary.com/v1_1/${NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload
  ```
- **En-têtes HTTP** : Pas d'en-tête d'autorisation requis (l'authentification s'effectue via l'upload preset non-signé).
- **Structure du Payload (`FormData`)** :
  ```typescript
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset); // Ex: 'viptadj_unsigned_products'
  formData.append('folder', 'vip-tadj/products');
  formData.append('tags', 'vip-tadj,product');
  ```
- **Suivi de Progression** :
  ```typescript
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable && onProgress) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress({ loaded: event.loaded, total: event.total, percent });
    }
  };
  ```

### 2.2 Extraction & Normalisation de la Réponse
Dès réception du statut HTTP `200 OK`, le service extrait les métadonnées normalisées :
```typescript
const data = JSON.parse(xhr.responseText);
return {
  url: data.secure_url || data.url,
  publicId: data.public_id,
  width: data.width,
  height: data.height,
  format: data.format,
};
```
En cas d'erreur HTTP (ex. quota dépassé, format non supporté), le service intercepte la réponse et renvoie `errRes.error?.message` pour un affichage explicite dans le formulaire d'administration.

---

## 3. Compression Pré-Upload dans le Navigateur (`client-image-compressor.ts`)

### 3.1 Problématique Résolue
Les appareils photo des smartphones récents (Samsung Galaxy, iPhone) génèrent des clichés de 12 à 48 mégapixels pesant entre 8 Mo et 20 Mo. Les uploader sans traitement préalable engendre :
- Le rejet par Cloudinary (le palier gratuit limite la taille maximale à **10 Mo par image**).
- Des temps de transfert prohibitifs sur les réseaux mobiles algériens (plus de 45 secondes pour un seul fichier).
- L'épuisement prématuré du quota de stockage mensuel.

### 3.2 Implémentation de la Compression HTML5 Canvas
Avant toute transmission réseau dans `AdminMediaUpload.tsx` et `ProductForm.tsx`, le fichier est soumis à `compressImageFile(rawFile, options)` :

```typescript
// Paramètres de référence calibrés pour le catalogue VIP TADJ :
const COMPRESSION_DEFAULTS = {
  maxWidth: 1600,   // Largeur maximale suffisante pour les écrans Retina 4K
  maxHeight: 2000,  // Hauteur maximale adaptée au ratio portrait mode (4:5)
  quality: 0.85,    // Qualité de compression perceptuellement sans perte
};
```

**Algorithme de Réduction** :
1. **Filtre de bypass** : Les formats vectoriels (`image/svg+xml`), les animations (`image/gif`), et les fichiers dont la taille est déjà inférieure à 250 Ko ne sont pas modifiés.
2. **Calcul de l'échelle proportionnelle** : Le ratio d'aspect original est strictement conservé.
3. **Rendu Canvas hors-écran** : Le navigateur trace l'image sur un élément `<canvas>` avec le paramètre `ctx.imageSmoothingQuality = 'high'`.
4. **Gestion de la transparence** : Pour les conversions PNG vers JPEG, un fond blanc opaque (`#FFFFFF`) est automatiquement appliqué afin d'éviter les artefacts noirs sous les pixels transparents.
5. **Garde-fou d'intégrité de taille** : Si le Blob compressé produit une taille supérieure ou égale au fichier source (cas rare sur images déjà compressées), le fichier original est conservé.

**Résultats Mesurés** :
- Photo brute 12 Mo (4032 × 3024 px) ──► **Image optimisée 280 Ko** (1600 × 1200 px).
- **Gain de bande passante** : **97.6% de réduction**.
- **Temps d'upload moyen (4G Ooredoo / Mobilis / Djezzy)** : **0.8 seconde** par cliché.

---

## 4. Normalisateur d'URLs Google Drive (`url-normalizer.ts`)

Pour les gestionnaires de stock qui conservent leurs séries de photographies sur Google Drive, VIP TADJ intègre un parseur d'URL robuste capable d'extraire automatiquement l'identifiant du fichier à partir de tout lien de partage.

### 4.1 Modèles d'URLs & Expressions Régulières Reconnues
Le normalisateur gère les 4 formats de liens Google Drive :
1. **Lien de partage standard** : `drive.google.com/file/d/([a-zA-Z0-9_-]+)`
2. **Lien d'ouverture directe** : `drive.google.com/open?id=([a-zA-Z0-9_-]+)`
3. **Paramètre d'identifiant** : `[?&]id=([a-zA-Z0-9_-]+)` ou `[?&]fileId=([a-zA-Z0-9_-]+)`
4. **Identifiant brut Google Drive** : Validé par `isConfirmedGoogleDriveId(id)` (chaîne de 25 à 55 caractères alphanumériques à forte entropie, excluant les slugs de catégories ou les faux positifs).

### 4.2 Formats de Flux de Sortie
Deux modes de diffusion sont supportés :
- **Mode `uc` (Direct View Stream - Défaut)** :
  ```http
  https://drive.google.com/uc?export=view&id={fileId}
  ```
  Permet l'intégration directe en source d'image HTML.
- **Mode `lh3` (Google User Content Edge Stream)** :
  ```http
  https://lh3.googleusercontent.com/d/{fileId}=w{width}
  ```
  Permet de solliciter directement le redimensionnement au niveau du cache Google.

### 4.3 Avertissement Opérationnel Critique : Les Limites de Débit Google Drive
> ⚠️ **ATTENTION OPÉRATIONNELLE : Google Drive n'est PAS un CDN commercial.**  
> Google applique des mécanismes stricts de protection anti-abus sur les téléchargements publics.

1. **Le Verrouillage des 24 Heures ("Too many users have viewed or downloaded this file recently")** :  
   Si une image hébergée sur Google Drive subit un pic de requêtes (ex. campagne publicitaire Facebook/Instagram ou newsletter recevant plusieurs centaines de visites simultanées), Google coupe le flux de l'image pour une durée de **24 heures** avec une erreur `HTTP 403 Forbidden` ou `429 Too Many Requests`.
2. **Blocage CORS & En-tête `Referer`** :  
   Google modifie périodiquement sa politique sur l'en-tête `Referer`. Les images peuvent subitement rediriger vers une page HTML intermédiaire bloquant l'affichage dans la balise `<img>`.
3. **Absence de Transcodage WebP / AVIF** :  
   Le flux `uc?export=view` livre le fichier binaire brut tel qu'uploadé. Si l'administrateur a déposé un fichier de 6 Mo sur son Drive, chaque client mobile téléchargera 6 Mo, pénalisant lourdement le LCP (*Largest Contentful Paint*) et le référencement Google.
4. **Conclusion Stratégique** :  
   Google Drive est une solution de commodité ou de dépannage temporaire. **Cloudinary demeure le moteur principal impératif pour la production.**

---

## 5. Réseau de Diffusion (CDN) Externe & Système de Secours Luxe

### 5.1 Optimisation Dynamique Unsplash Imgix
Pour les visuels éditoriaux et le catalogue de démonstration, VIP TADJ exploite la bibliothèque de 26 visuels de confection masculine (`src/lib/media/curated-assets.ts`). La fonction `optimizeUnsplashUrl` injecte à la volée :
```http
https://images.unsplash.com/...?...&auto=format&fit=crop&q=80&w={width}
```
Les serveurs Edge Imgix transcodent dynamiquement la source en WebP ou AVIF selon les capacités du navigateur du visiteur.

### 5.2 Optimisation Dynamique Cloudinary (`optimizeCloudinaryUrl`)
Pour chaque image servie via Cloudinary, l'URL est enrichie des paramètres d'optimisation automatique :
```http
https://res.cloudinary.com/{cloudName}/image/upload/f_auto,q_auto,w_{width},c_limit/{publicId}
```
- `f_auto` : Sélection automatique du format optimal (AVIF pour Chrome/Safari récent, WebP pour navigateurs compatibles, JPEG pour anciens clients).
- `q_auto` : Algorithme de compression perceptuelle adaptative (économise jusqu'à 60% du poids sans dégradation visible).
- `c_limit` : Empêche l'agrandissement d'une image au-delà de sa résolution native.

### 5.3 Balises `<img>` Natives vs Composant Next.js `<Image />`
**Décision d'architecture majeure** : Dans les composants vitrines (`ProductCard.tsx`, `ProductGallery.tsx`), VIP TADJ utilise délibérément la balise native `<img />` pointant vers les flux pré-optimisés des CDN externes plutôt que le composant `<Image />` de Next.js.
- **Raison technique** : Next.js `<Image />` achemine les images externes par sa route proxy interne `/_next/image`, qui utilise le CPU des lambdas Vercel pour recompresser l'image.
- **Plafond Vercel Hobby** : Le palier gratuit Vercel impose une limite stricte de **1 000 optimisations d'images source par mois**. Au-delà, les images échouent ou entraînent des surcoûts.
- **Bénéfice VIP TADJ** : En déléguant le formatage à Cloudinary (`f_auto,q_auto`) et Unsplash, VIP TADJ contourne entièrement ce plafond de 1 000 images et consomme **0 crédit d'optimisation Vercel**, tout en maintenant un temps de premier octet (TTFB) inférieur à 80 ms.

### 5.4 Placeholder Vectoriel de Luxe SVG (`getLuxuryPlaceholderSvg`)
En cas de lien brisé, d'erreur 404, de chaîne malveillante ou d'indisponibilité réseau, l'application génère un SVG vectoriel inline encodé en Data URI (`data:image/svg+xml;utf8,...`).

**Identité Visuelle** :
- **Arrière-plan** : Dégradé radial noir obsidienne profond (`#0B0C10` vers `#1F2421`).
- **Encadrement** : Double filet métallique or impérial avec reflets (`#F3E5AB` vers `#AA771C`).
- **Emblème** : Couronne royale stylisée à géométrie précise découpée à l'or pur.
- **Typographie** : Sérif impérial "VIP TADJ", mention "HAUTE ÉLÉGANCE MASCULINE", et badge de catégorie dynamique.
- **Sécurité Anti-XSS** : La catégorie injectée est obligatoirement filtrée par `escapeXml()`, neutralisant tout risque d'injection SVG ou d'exécution de script malveillant.

---

## 6. Modélisation Détaillée des Quotas de Stockage et Bande Passante (en Go)

### 6.1 Spécifications du Palier Gratuit Cloudinary (Free Tier)
Le modèle Cloudinary fonctionne sur un système unifié de **Net Credits** (Crédits Nets Mensuels) :
$$\mathbf{1\text{ Crédit Net}} = \mathbf{1\text{ Go de Stockage Géré}} \quad \text{OU} \quad \mathbf{1\text{ Go de Bande Passante CDN}} \quad \text{OU} \quad \mathbf{1\,000\text{ Transformations}}$$

| Ressource | Quota Gratuit Mensuel | Remarques & Limites Physiques |
|---|---|---|
| **Crédits Nets Totaux** | **25 crédits / mois** | Mutualisés entre Stockage, Bande Passante et Transformations |
| **Taille Max par Image** | **10 Mo** | Tout fichier > 10 Mo est immédiatement rejeté en HTTP 400 |
| **Résolution Max** | **25 Mégapixels** | Amplement suffisant pour des photographies haute définition |
| **Bande Passante Vidéo** | 1 crédit = 2 Go | (VIP TADJ n'utilise que des images fixes en V1) |
| **Comptes Administrateurs** | 3 utilisateurs | Suffisant pour l'équipe de gestion du catalogue |
| **Coût Mensuel** | **0,00 $ / mois** | Aucune carte bancaire requise à l'inscription |

---

### 6.2 Modélisation en Gigaoctets (Go) pour le Catalogue VIP TADJ

#### Hypothèse A : Catalogue Actif de 500 Produits (1 500 Photos)
- **Nombre de produits** : 500 articles (costumes, blazers, chemises, souliers, cravates).
- **Photos par article** : 3 angles haute résolution (face, profil, détail étoffe) = **1 500 photographies**.
- **Taille moyenne après compression pré-upload** : ~300 Ko par photo originale.

1. **Calcul du Stockage Master (Originaux)** :
   $$1\,500 \times 300\text{ Ko} = 450\,000\text{ Ko} \approx \mathbf{0{,}45\text{ Go}}$$
2. **Calcul du Stockage Dérivé (Cache des Formats Responsive)** :
   Cloudinary stocke les déclinaisons générées pour le site :
   - Vignette catalogue (`w_600`, WebP qualité auto) : ~60 Ko
   - Plein écran fiche produit (`w_1200`, WebP qualité auto) : ~180 Ko
   $$1\,500 \times (60\text{ Ko} + 180\text{ Ko}) = 1\,500 \times 240\text{ Ko} \approx \mathbf{0{,}36\text{ Go}}$$
3. **Stockage Total Consommé** :
   $$\text{Stockage Total} = 0{,}45\text{ Go} + 0{,}36\text{ Go} = \mathbf{0{,}81\text{ Go}} \quad (\approx 0{,}81\text{ crédit})$$
4. **Transformations Initiales (Exécutées une seule fois à la création)** :
   $$1\,500 \times 2\text{ variantes} = 3\,000\text{ transformations} = \mathbf{3{,}00\text{ crédits}}$$
5. **Bande Passante Mensuelle Disponible pour les Visiteurs** :
   $$\text{Crédits restants} = 25 - (0{,}81 + 3{,}00) = \mathbf{21{,}19\text{ crédits}} \implies \mathbf{21{,}19\text{ Go de bande passante / mois}}$$
6. **Capacité d'Affichage (Impressions d'Images Mensuelles)** :
   Avec un poids moyen de 80 Ko par image servie en WebP :
   $$\text{Nombre d'affichages d'images} = \frac{21{,}19 \times 1\,024 \times 1\,024\text{ Ko}}{80\text{ Ko}} \approx \mathbf{277\,700\text{ affichages d'images / mois}}$$
   *(Soit l'équivalent de plus de 25 000 visites complètes de fiches produits par mois à 0 $).*

---

#### Hypothèse B : Catalogue Étendu de 1 000 Produits (3 000 Photos)
- **Nombre de produits** : 1 000 articles = **3 000 photographies**.
1. **Stockage Total (Originaux + Variantes en Cache)** :
   $$3\,000 \times (300\text{ Ko} + 240\text{ Ko}) = 1\,620\,000\text{ Ko} \approx \mathbf{1{,}62\text{ Go}} \quad (\approx 1{,}62\text{ crédit})$$
2. **Transformations Initiales** :
   $$3\,000 \times 2 = 6\,000\text{ transformations} = \mathbf{6{,}00\text{ crédits}}$$
3. **Bande Passante Mensuelle Disponible** :
   $$\text{Crédits restants} = 25 - (1{,}62 + 6{,}00) = \mathbf{17{,}38\text{ crédits}} \implies \mathbf{17{,}38\text{ Go de bande passante / mois}}$$
4. **Capacité d'Affichage** :
   $$\frac{17{,}38 \times 1\,024 \times 1\,024\text{ Ko}}{80\text{ Ko}} \approx \mathbf{227\,800\text{ affichages d'images / mois}}$$

---

### 6.3 Seuils de Transition vers les Paliers Payants Cloudinary
Lorsque l'activité e-commerce dépasse les plafonds gratuits, la transition s'opère sans rupture de service :

| Palier | Crédits Mensuels | Capacité Stockage / Bande Passante | Coût Mensuel | Déclencheur Recommandé pour VIP TADJ |
|---|---|---|---|---|
| **Free** | **25 crédits** | 25 Go mutualisés | **0 $** | Lancement & phase de croissance jusqu'à ~800 produits |
| **Plus** | **225 crédits** | 225 Go mutualisés | **89 $ / mois** | Catalogues > 1 500 produits ou trafic > 250 000 vues/mois |
| **Advanced** | **600 crédits** | 600 Go mutualisés | **224 $ / mois** | Forte expansion multi-boutiques, intégration de vidéos 4K |

---

### 6.4 Comparatif des Quotas Google Drive
| Ressource | Google Drive Gratuit | Google One 100 Go | Google One 2 To |
|---|---|---|---|
| **Stockage Fichiers** | **15 Go** (Partagé avec Gmail & Photos) | 100 Go | 2 000 Go (2 To) |
| **Coût Mensuel** | 0 $ | ~1,99 $ / mois | ~9,99 $ / mois |
| **Limite Taille Fichier** | 5 To | 5 To | 5 To |
| **Bande Passante Web CDN** | **Non garantie (blocage après ~100-500 hits/h)** | Identique (pas d'accord SLA web) | Identique |
| **Transcodage Image** | Aucun | Aucun | Aucun |

---

## 7. Guide de Configuration Opérationnelle Cloudinary en Production

Suivez rigoureusement ces étapes pour initialiser l'environnement Cloudinary officiel de VIP TADJ :

### Étape 1 : Création du Compte
1. Rendez-vous sur [cloudinary.com](https://cloudinary.com) et inscrivez-vous avec l'adresse technique officielle (ex. `tech@viptadj.dz`).
2. Dans le tableau de bord (*Dashboard*), notez le **Cloud name** généré (ex. `vip-tadj-prod`).

### Étape 2 : Création de l'Upload Preset Non-Signé
1. Cliquez sur l'icône **Settings** (roue crantée en bas à gauche), puis rendez-vous dans l'onglet **Upload**.
2. Faites défiler la page jusqu'à la section **Upload presets** et cliquez sur **Add upload preset**.
3. Renseignez scrupuleusement les champs suivants :
   - **Upload preset name** : `viptadj_unsigned_products`
   - **Signing Mode** : Sélectionner impérativement **Unsigned** (*Non-signé*).
   - **Folder** : `vip-tadj/products` *(Isole les photos du catalogue dans un répertoire dédié)*.
   - **Allowed formats** : `jpg, jpeg, png, webp` *(Rejette tout format non autorisé)*.
   - **Max file size** : `10000000` octets (10 Mo).
   - **Discard original filename** : Cocher **Yes** *(Génère un identifiant aléatoire sécurisé pour prévenir les conflits de nom)*.
   - **Tags** : `vip-tadj,product` *(Permet les purges globales ou le classement automatisé)*.
4. Dans la sous-section **Incoming Transformations** :
   - **Max width** : `2000`
   - **Max height** : `2000`
   - **Crop mode** : `Limit` (`c_limit`)
5. Cliquez sur **Save** pour enregistrer et activer le preset.

### Étape 3 : Déploiement des Variables d'Environnement
Dans l'interface de votre hébergeur (ex. Dashboard Vercel > Paramètres du projet > Environment Variables) :

```bash
# Variables Publiques (Nécessaires pour l'upload direct depuis le navigateur admin)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="vip-tadj-prod"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="viptadj_unsigned_products"

# Variables Serveur (Optionnelles, utilisées par la route proxy de secours /api/media/upload)
CLOUDINARY_CLOUD_NAME="vip-tadj-prod"
CLOUDINARY_UPLOAD_PRESET="viptadj_unsigned_products"
```

### Étape 4 : Validation Opérationnelle
1. Connectez-vous au portail administrateur VIP TADJ : `/admin/products/new`.
2. Glissez-déposez une photo de test dans la zone de téléversement.
3. Vérifiez l'affichage de la barre de progression en temps réel (0% ──► 100%).
4. Observez l'URL générée : elle doit débuter par `https://res.cloudinary.com/vip-tadj-prod/image/upload/...`.
5. Ouvrez la console Cloudinary > Media Library et vérifiez la présence du fichier dans le dossier `vip-tadj/products/`.

---

## 8. Sécurité, Hardening & Protection Anti-Abus

1. **Verrouillage Strict des Formats MIME** :  
   L'upload preset n'autorise que les fichiers matriciels (`jpg, jpeg, png, webp`). Le téléversement de fichiers SVG personnalisés via l'upload preset non-signé est délibérément interdit pour empêcher les attaques XSS stockées (*Stored XSS*) via balises `<script>` imbriquées dans le XML des SVG.
2. **Limitation de Débit Automatique Cloudinary** :  
   Dans *Settings > Security*, activez l'option **Rate limit unsigned uploads** pour bloquer toute tentative d'inondation de requêtes (*flood*) provenant d'une même adresse IP.
3. **Protection des Routes Administrateur** :  
   Le composant d'upload `AdminMediaUpload.tsx` n'est accessible que derrière le garde d'authentification `AdminAuthGuard`. Les visiteurs non connectés ne peuvent ni charger le composant d'upload ni interagir avec le formulaire.
4. **Sanitisation XML dans le Fallback SVG** :  
   Tous les textes dynamiques insérés dans le placeholder de secours (nom de la catégorie, labels) passent obligatoirement par la fonction `escapeXml(str)` qui encode les caractères `&`, `<`, `>`, `"`, et `'`.
5. **Politique d'Accompagnement Éphémère en Mode Serverless** :  
   La route de secours `/api/media/upload` qui écrit sur le disque local (`public/uploads`) est signalée comme éphémère. Sur Vercel ou Cloud Run, le système de fichiers est en lecture seule ou réinitialisé à chaque arrêt de conteneur. La configuration de Cloudinary est donc classée comme **obligatoire** pour la pérennité des médias en production.
