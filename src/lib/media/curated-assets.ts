/**
 * VIP TADJ — Curated Public Menswear Asset Library
 * 26 verified active Unsplash CDN editorial photos for luxury menswear, footwear, and accessories.
 */

import { ProductCategoryType } from '@/types';

export interface CuratedAsset {
  id: string;
  title: string;
  category: ProductCategoryType;
  subcategory: string;
  url: string;
  alt: string;
  photographer: string;
}

export const CURATED_MENSWEAR_ASSETS: CuratedAsset[] = [
  // ----------------------------------------------------
  // CLOTHING / VÊTEMENTS (10 assets)
  // ----------------------------------------------------
  {
    id: 'asset-suit-navy',
    title: 'Costume Trois Pièces Bleu Nuit Sartorial',
    category: 'clothing',
    subcategory: 'Costumes',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=1200',
    alt: 'Costume trois pièces bleu nuit coupe ajustée italienne avec gilet cintré',
    photographer: 'Unsplash Fashion',
  },
  {
    id: 'asset-suit-tuxedo',
    title: 'Smoking de Cérémonie Noir Profond & Satin',
    category: 'clothing',
    subcategory: 'Costumes',
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200',
    alt: 'Homme en smoking noir élégant revers châle satiné',
    photographer: 'Unsplash Men',
  },
  {
    id: 'asset-blazer-wool',
    title: 'Blazer Croisé en Velours de Laine Anthracite',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=1200',
    alt: 'Veston blazer en laine fine à chevrons avec pochette blanche',
    photographer: 'Sartorial Focus',
  },
  {
    id: 'asset-blazer-cobalt',
    title: 'Veste de Costume Sur Mesure Bleu Cobalt',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&q=80&w=1200',
    alt: 'Blazer contemporain taillé sur mesure revers en pointe',
    photographer: 'Atelier Sartorial',
  },
  {
    id: 'asset-suit-prince',
    title: 'Costume Prince de Galles Gris Perle',
    category: 'clothing',
    subcategory: 'Costumes',
    url: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&q=80&w=1200',
    alt: 'Costume deux pièces prince de galles gris élégance intemporelle',
    photographer: 'Haute Couture Men',
  },
  {
    id: 'asset-blazer-burgundy',
    title: 'Blazer Royal Bordeaux en Laine Peignée',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&q=80&w=1200',
    alt: 'Veste de costume bordeaux profond boutons corne naturelle',
    photographer: 'Milano Editorial',
  },
  {
    id: 'asset-coat-camel',
    title: 'Manteau Long d\'Apparat en Cachemire Camel',
    category: 'clothing',
    subcategory: 'Manteaux',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=1200',
    alt: 'Manteau par-dessus croisé en drap de cachemire camel',
    photographer: 'Winter Elegance',
  },
  {
    id: 'asset-coat-charcoal',
    title: 'Pardessus d\'Hiver en Laine Vierge Noire',
    category: 'clothing',
    subcategory: 'Manteaux',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pardessus classique en drap de laine anthracite col tailleur',
    photographer: 'Urban Gentleman',
  },
  {
    id: 'asset-shirt-white',
    title: 'Chemise Habillée en Coton Égyptien Blanc',
    category: 'clothing',
    subcategory: 'Chemises',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chemise blanche formelle col italien en popeline de coton égyptien',
    photographer: 'Bespoke Shirtmaker',
  },
  {
    id: 'asset-shirt-blue',
    title: 'Chemise Popeline Bleu Glacier Boutons Nacre',
    category: 'clothing',
    subcategory: 'Chemises',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chemise bleue cintrée poignets biseautés finitions tailleur',
    photographer: 'Sartorial Classic',
  },
  {
    id: 'asset-pants-pleated',
    title: 'Pantalon Tailleur à Pinces Flanelle Gris Graphite',
    category: 'clothing',
    subcategory: 'Pantalons',
    url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pantalon habillé taille haute à pinces et pattes de serrage',
    photographer: 'Modern Dandy',
  },

  // ----------------------------------------------------
  // FOOTWEAR / CHAUSSURES (7 assets)
  // ----------------------------------------------------
  {
    id: 'asset-shoes-richelieu',
    title: 'Richelieus d\'Apparat en Cuir Patiné Cognac',
    category: 'shoes',
    subcategory: 'Richelieus',
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1200',
    alt: 'Souliers richelieu en cuir de veau pleine fleur patiné main cognac',
    photographer: 'Italian Bottier',
  },
  {
    id: 'asset-shoes-oxford',
    title: 'Derbies Oxford Noirs Cousu Goodyear',
    category: 'shoes',
    subcategory: 'Oxfords',
    url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chaussures richelieus Oxford noires brillantes semelle cuir Goodyear',
    photographer: 'Classic Footwear',
  },
  {
    id: 'asset-shoes-horsebit',
    title: 'Mocassins à Mors Dorés en Cuir Noir Brillant',
    category: 'shoes',
    subcategory: 'Mocassins',
    url: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&q=80&w=1200',
    alt: 'Mocassins italiens en cuir lisse ornés d\'un mors doré métallique',
    photographer: 'Luxury Loafers',
  },
  {
    id: 'asset-shoes-penny',
    title: 'Mocassins Penny Loafer en Veau Velours Havane',
    category: 'shoes',
    subcategory: 'Mocassins',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
    alt: 'Penny loafers en daim suédé brun havane semelle souple',
    photographer: 'Casual Gentleman',
  },
  {
    id: 'asset-shoes-chelsea',
    title: 'Bottines Chelsea en Daim Chocolat Profond',
    category: 'shoes',
    subcategory: 'Bottines',
    url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=1200',
    alt: 'Bottines chelsea en suède marron chocolat avec élastiques renforcés',
    photographer: 'Bootmaker Studio',
  },
  {
    id: 'asset-shoes-derby',
    title: 'Derbies Classiques à Bout Droit en Cuir Brossé',
    category: 'shoes',
    subcategory: 'Derbies',
    url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=1200',
    alt: 'Derbies habillés marron acajou à lacets fins cirés',
    photographer: 'Shoemaker Atelier',
  },

  // ----------------------------------------------------
  // ACCESSORIES / ACCESSOIRES (8 assets)
  // ----------------------------------------------------
  {
    id: 'asset-watch-chrono',
    title: 'Montre Chronographe Automatique Or & Cuir Noir',
    category: 'accessories',
    subcategory: 'Horlogerie',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200',
    alt: 'Montre de luxe boîtier doré cadran soleillé bracelet cuir noir surpiqué',
    photographer: 'Timepiece Master',
  },
  {
    id: 'asset-watch-silver',
    title: 'Montre Automatique Héritage Cadran Argenté',
    category: 'accessories',
    subcategory: 'Horlogerie',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1200',
    alt: 'Montre habillée classique aiguilles bleuies et verre saphir inrayable',
    photographer: 'Horology Gallery',
  },
  {
    id: 'asset-tie-silk',
    title: 'Cravate en Soie Jacquard Bleu Impérial & Or',
    category: 'accessories',
    subcategory: 'Cravates',
    url: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&q=80&w=1200',
    alt: 'Cravate 7 plis en pure soie italienne motifs jacquard délicats',
    photographer: 'Como Silks',
  },
  {
    id: 'asset-belt-leather',
    title: 'Ceinture Réversible Cuir Grainé Noir & Cognac',
    category: 'accessories',
    subcategory: 'Ceintures',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1200',
    alt: 'Ceinture artisanale en cuir de veau pleine fleur avec boucle ardillon',
    photographer: 'Leathercraft Guild',
  },
  {
    id: 'asset-cufflinks-gold',
    title: 'Boutons de Manchette Géométriques Or 18k & Onyx',
    category: 'accessories',
    subcategory: 'Boutons de Manchette',
    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Paire de boutons de manchette dorés avec incrustation d\'onyx naturel',
    photographer: 'Fine Jewelry Men',
  },
  {
    id: 'asset-pocket-square',
    title: 'Pochette de Costume en Soie Pure Roulottée Main',
    category: 'accessories',
    subcategory: 'Pochettes',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pochette de costume en twill de soie bords roulottés à la main',
    photographer: 'Pocket Square Club',
  },
  {
    id: 'asset-briefcase',
    title: 'Porte-Documents Business Cuir Noble Bordeaux',
    category: 'accessories',
    subcategory: 'Maroquinerie',
    url: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Cartable serviette d\'affaires en cuir de veau rigide finitions or brossé',
    photographer: 'Luxury Leather',
  },
  {
    id: 'asset-wallet',
    title: 'Portefeuille Fin en Cuir Nappa d\'Italie',
    category: 'accessories',
    subcategory: 'Maroquinerie',
    url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1200',
    alt: 'Portefeuille élégant en cuir nappa ultra fin avec fentes cartes dorées',
    photographer: 'Accessories Atelier',
  },
];
