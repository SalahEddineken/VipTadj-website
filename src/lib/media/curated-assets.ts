/**
 * VIP TADJ — Curated Public Menswear Asset Library
 * 25 verified active Unsplash CDN editorial photos for luxury menswear, footwear, and accessories.
 */

import { ProductCategoryType } from '@/types';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getLocalizedSubcategory } from '@/lib/i18n/catalog-translations';

export interface CuratedAsset {
  id: string;
  title: string;
  titleEn?: string;
  titleAr?: string;
  category: ProductCategoryType;
  subcategory: string;
  url: string;
  alt: string;
  altEn?: string;
  altAr?: string;
  photographer: string;
}

export const CURATED_MENSWEAR_ASSETS: CuratedAsset[] = [
  // ----------------------------------------------------
  // CLOTHING / VÊTEMENTS (11 assets)
  // ----------------------------------------------------
  {
    id: 'asset-suit-navy',
    title: 'Veste Saharienne Élégante en Coton & Lin',
    titleEn: 'Elegant Cotton & Linen Safari Jacket',
    titleAr: 'سترة سفاري أنيقة من القطن والكتان',
    category: 'clothing',
    subcategory: 'Vestes',
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=1200',
    alt: 'Veste saharienne élégante en lin et coton naturel coupe ajustée',
    altEn: 'Tailored safari jacket in natural linen and cotton',
    altAr: 'سترة سفاري أنيقة من الكتان والقطن الطبيعي بقصة مضبوطة',
    photographer: 'Unsplash Fashion',
  },
  {
    id: 'asset-suit-tuxedo',
    title: 'Veste Bomber Minimaliste en Cuir Suédé Doux',
    titleEn: 'Minimalist Soft Suede Leather Bomber Jacket',
    titleAr: 'جاكيت بومبر عصري من الجلد السويدي الناعم',
    category: 'clothing',
    subcategory: 'Vestes',
    url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=1200',
    alt: 'Blouson bomber contemporain en cuir suédé doux',
    altEn: 'Contemporary soft suede leather bomber jacket',
    altAr: 'جاكيت بومبر عصري من الجلد السويدي الناعم',
    photographer: 'Unsplash Men',
  },
  {
    id: 'asset-blazer-wool',
    title: 'Blazer Croisé en Velours de Laine Anthracite',
    titleEn: 'Double-Breasted Anthracite Wool Velvet Blazer',
    titleAr: 'سترة بليزر مزدوجة الأزرار من مخمل الصوف الرمادي الفحمي',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=1200',
    alt: 'Veston blazer en laine fine à chevrons avec pochette blanche',
    altEn: 'Fine herringbone wool blazer with white pocket square',
    altAr: 'سترة بليزر من الصوف الناعم مع منديل جيب أبيض',
    photographer: 'Sartorial Focus',
  },
  {
    id: 'asset-blazer-cobalt',
    title: 'Veste Déstructurée Bleu Cobalt Napolitain',
    titleEn: 'Neapolitan Unstructured Cobalt Blue Jacket',
    titleAr: 'سترة بليزر نابولي بلون أزرق كوبالت',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&q=80&w=1200',
    alt: 'Blazer contemporain taillé sur mesure revers en pointe',
    altEn: 'Contemporary tailored blazer with peak lapels',
    altAr: 'سترة بليزر عصرية مفصلة بياقة رمحية',
    photographer: 'Atelier Sartorial',
  },
  {
    id: 'asset-suit-prince',
    title: 'Surchemise Chaude en Laine & Cachemire',
    titleEn: 'Warm Wool & Cashmere Overshirt',
    titleAr: 'قميص جاكيت دافئ من الصوف والكشمير',
    category: 'clothing',
    subcategory: 'Chemises',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=1200',
    alt: 'Surchemise en laine et cachemire à carreaux élégance intemporelle',
    altEn: 'Checkered wool and cashmere overshirt with timeless elegance',
    altAr: 'قميص جاكيت من الصوف والكشمير بنقشة كاروهات أنيقة',
    photographer: 'Haute Couture Men',
  },
  {
    id: 'asset-blazer-burgundy',
    title: 'Blazer Royal Bordeaux en Laine Peignée',
    titleEn: 'Royal Burgundy Worsted Wool Blazer',
    titleAr: 'سترة بليزر عنابي ملكي من الصوف الممشط',
    category: 'clothing',
    subcategory: 'Blazers',
    url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&q=80&w=1200',
    alt: 'Veste bordeaux profond boutons corne naturelle',
    altEn: 'Deep burgundy blazer with natural horn buttons',
    altAr: 'سترة بلون عنابي داكن مع أزرار طبيعية',
    photographer: 'Milano Editorial',
  },
  {
    id: 'asset-coat-camel',
    title: 'Manteau Long d\'Apparat en Cachemire Camel',
    titleEn: 'Long Ceremonial Camel Cashmere Coat',
    titleAr: 'معطف طويل فاخر من كشمير الكاميل',
    category: 'clothing',
    subcategory: 'Manteaux',
    url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&q=80&w=1200',
    alt: 'Manteau par-dessus croisé en drap de cachemire camel',
    altEn: 'Double-breasted camel cashmere overcoat',
    altAr: 'معطف طويل مزدوج الأزرار من الكشمير بلون بيج كاميل',
    photographer: 'Winter Elegance',
  },
  {
    id: 'asset-coat-charcoal',
    title: 'Pardessus d\'Hiver en Laine Vierge Noire',
    titleEn: 'Black Virgin Wool Winter Overcoat',
    titleAr: 'معطف شتوي من الصوف الأسود الفاخر',
    category: 'clothing',
    subcategory: 'Manteaux',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pardessus classique en drap de laine anthracite col tailleur',
    altEn: 'Classic charcoal wool overcoat with tailored collar',
    altAr: 'معطف شتوي كلاسيكي من الصوف الرمادي الفحمي بياقة رسمية',
    photographer: 'Urban Gentleman',
  },
  {
    id: 'asset-shirt-white',
    title: 'Chemise Habillée en Coton Égyptien Blanc',
    titleEn: 'White Egyptian Cotton Dress Shirt',
    titleAr: 'قميص رسمي أبيض من القطن المصري الفاخر',
    category: 'clothing',
    subcategory: 'Chemises',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chemise blanche formelle col italien en popeline de coton égyptien',
    altEn: 'Formal white Egyptian cotton poplin shirt with Italian collar',
    altAr: 'قميص رسمي أبيض بياقة إيطالية من القطن المصري',
    photographer: 'Bespoke Shirtmaker',
  },
  {
    id: 'asset-shirt-blue',
    title: 'Chemise Popeline Bleu Glacier Boutons Nacre',
    titleEn: 'Ice Blue Poplin Shirt with Mother-of-Pearl Buttons',
    titleAr: 'قميص بوبلين أزرق فاتح بأزرار عرق اللؤلؤ',
    category: 'clothing',
    subcategory: 'Chemises',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chemise bleue cintrée poignets biseautés finitions tailleur',
    altEn: 'Fitted blue dress shirt with bevelled cuffs and tailored finish',
    altAr: 'قميص أزرق بقصة مضبوطة وأكمام رسمية متقنة',
    photographer: 'Sartorial Classic',
  },
  {
    id: 'asset-pants-pleated',
    title: 'Pantalon Tailleur à Pinces Flanelle Gris Graphite',
    titleEn: 'Graphite Flannel Pleated Tailored Trousers',
    titleAr: 'سروال كلاسيكي بكسرات من الفلانيل الرمادي',
    category: 'clothing',
    subcategory: 'Pantalons',
    url: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pantalon habillé taille haute à pinces et pattes de serrage',
    altEn: 'High-waisted pleated dress trousers with side adjusters',
    altAr: 'سروال كلاسيكي بخصر عالٍ وكسرات أنيقة',
    photographer: 'Modern Dandy',
  },

  // ----------------------------------------------------
  // FOOTWEAR / CHAUSSURES (6 assets)
  // ----------------------------------------------------
  {
    id: 'asset-shoes-richelieu',
    title: 'Richelieus d\'Apparat en Cuir Patiné Cognac',
    titleEn: 'Hand-Patinated Cognac Leather Richelieu Shoes',
    titleAr: 'أحذية ريشليو من الجلد المصقول بلون بني كونياك',
    category: 'shoes',
    subcategory: 'Richelieus',
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=80&w=1200',
    alt: 'Souliers richelieu en cuir de veau pleine fleur patiné main cognac',
    altEn: 'Full-grain calfskin Richelieu shoes with hand-applied cognac patina',
    altAr: 'أحذية ريشليو من جلد العجل الطبيعي المصقول يدوياً بلون كونياك',
    photographer: 'Italian Bottier',
  },
  {
    id: 'asset-shoes-oxford',
    title: 'Derbies Oxford Noirs Cousu Goodyear',
    titleEn: 'Goodyear-Welted Black Oxford Shoes',
    titleAr: 'أحذية أكسفورد سوداء بخياطة غوديار',
    category: 'shoes',
    subcategory: 'Oxfords',
    url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=1200',
    alt: 'Chaussures richelieus Oxford noires brillantes semelle cuir Goodyear',
    altEn: 'Polished black Oxford shoes with Goodyear leather sole',
    altAr: 'أحذية أكسفورد سوداء لامعة بنعل جلدي متين',
    photographer: 'Classic Footwear',
  },
  {
    id: 'asset-shoes-horsebit',
    title: 'Mocassins à Mors Dorés en Cuir Noir Brillant',
    titleEn: 'Glossy Black Leather Horsebit Loafers',
    titleAr: 'أحذية موكاسان بإبزيم ذهبي وجلد أسود لامع',
    category: 'shoes',
    subcategory: 'Mocassins',
    url: 'https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&q=80&w=1200',
    alt: 'Mocassins italiens en cuir lisse ornés d\'un mors doré métallique',
    altEn: 'Italian smooth leather loafers adorned with a gold metal bit',
    altAr: 'أحذية موكاسان إيطالية من الجلد الأملس بحلية معدنية ذهبية',
    photographer: 'Luxury Loafers',
  },
  {
    id: 'asset-shoes-penny',
    title: 'Mocassins Penny Loafer en Veau Velours Havane',
    titleEn: 'Havana Suede Calfskin Penny Loafers',
    titleAr: 'أحذية بيني لوفر من جلد السويد بلون هافانا',
    category: 'shoes',
    subcategory: 'Mocassins',
    url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=1200',
    alt: 'Penny loafers en daim suédé brun havane semelle souple',
    altEn: 'Havana brown suede penny loafers with flexible sole',
    altAr: 'أحذية موكاسان بيني لوفر من جلد السويد البني بنعل مريح',
    photographer: 'Casual Gentleman',
  },
  {
    id: 'asset-shoes-chelsea',
    title: 'Bottines Chelsea en Daim Chocolat Profond',
    titleEn: 'Deep Chocolate Suede Chelsea Boots',
    titleAr: 'أحذية بوت تشيلسي من جلد السويد بلون الشوكولاتة',
    category: 'shoes',
    subcategory: 'Bottines',
    url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&q=80&w=1200',
    alt: 'Bottines chelsea en suède marron chocolat avec élastiques renforcés',
    altEn: 'Chocolate brown suede Chelsea boots with reinforced elastic gussets',
    altAr: 'أحذية بوت تشيلسي من جلد السويد بلون الشوكولاتة الداكن',
    photographer: 'Bootmaker Studio',
  },
  {
    id: 'asset-shoes-derby',
    title: 'Derbies Classiques à Bout Droit en Cuir Brossé',
    titleEn: 'Classic Cap-Toe Derbies in Brushed Leather',
    titleAr: 'أحذية ديربي كلاسيكية من الجلد البني المصقول',
    category: 'shoes',
    subcategory: 'Derbies',
    url: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&q=80&w=1200',
    alt: 'Derbies habillés marron acajou à lacets fins cirés',
    altEn: 'Mahogany brown dress derbies with fine waxed laces',
    altAr: 'أحذية ديربي رسمية بلون بني دافئ وأربطة رفيعة مشمعة',
    photographer: 'Shoemaker Atelier',
  },

  // ----------------------------------------------------
  // ACCESSORIES / ACCESSOIRES (8 assets)
  // ----------------------------------------------------
  {
    id: 'asset-watch-chrono',
    title: 'Montre Chronographe Automatique Or & Cuir Noir',
    titleEn: 'Gold & Black Leather Automatic Chronograph Watch',
    titleAr: 'ساعة كرونوغراف أوتوماتيكية ذهبية بسوار جلد أسود',
    category: 'accessories',
    subcategory: 'Horlogerie',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=1200',
    alt: 'Montre de luxe boîtier doré cadran soleillé bracelet cuir noir surpiqué',
    altEn: 'Luxury watch with gold case, sunray dial, and stitched black leather strap',
    altAr: 'ساعة فاخرة بإطار ذهبي وميناء مشع وسوار جلد أسود مخيط',
    photographer: 'Timepiece Master',
  },
  {
    id: 'asset-watch-silver',
    title: 'Montre Automatique Héritage Cadran Argenté',
    titleEn: 'Heritage Automatic Watch Silver Dial',
    titleAr: 'ساعة أوتوماتيكية كلاسيكية بميناء فضي',
    category: 'accessories',
    subcategory: 'Horlogerie',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=80&w=1200',
    alt: 'Montre habillée classique aiguilles bleuies et verre saphir inrayable',
    altEn: 'Classic dress watch with blued hands and scratch-resistant sapphire crystal',
    altAr: 'ساعة رسمية كلاسيكية بعقارب زرقاء وزجاج ياقوتي مقاوم للخدش',
    photographer: 'Horology Gallery',
  },
  {
    id: 'asset-tie-silk',
    title: 'Cravate en Soie Jacquard Bleu Impérial & Or',
    titleEn: 'Imperial Blue & Gold Jacquard Silk Tie',
    titleAr: 'ربطة عنق من حرير الجاكار بلون أزرق إمبراطوري وذهبي',
    category: 'accessories',
    subcategory: 'Cravates',
    url: 'https://images.unsplash.com/photo-1589756823695-278bc923f962?auto=format&fit=crop&q=80&w=1200',
    alt: 'Cravate 7 plis en pure soie italienne motifs jacquard délicats',
    altEn: 'Seven-fold pure Italian silk tie with delicate jacquard motifs',
    altAr: 'ربطة عنق من الحرير الإيطالي الخالص بنقوش جاكار دقيقة',
    photographer: 'Como Silks',
  },
  {
    id: 'asset-belt-leather',
    title: 'Ceinture Réversible Cuir Grainé Noir & Cognac',
    titleEn: 'Reversible Grained Leather Belt Black & Cognac',
    titleAr: 'حزام جلد طبيعي بوجهين أسود وبني كونياك',
    category: 'accessories',
    subcategory: 'Ceintures',
    url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=1200',
    alt: 'Ceinture artisanale en cuir de veau pleine fleur avec boucle ardillon',
    altEn: 'Handcrafted full-grain calfskin belt with pin buckle',
    altAr: 'حزام مصنوع من جلد العجل الطبيعي بإبزيم معدني أنيق',
    photographer: 'Leathercraft Guild',
  },
  {
    id: 'asset-cufflinks-gold',
    title: 'Boutons de Manchette Géométriques Or 18k & Onyx',
    titleEn: '18k Gold & Onyx Geometric Cufflinks',
    titleAr: 'أزرار أكمام هندسية مذهبة بحجر الأونيكس',
    category: 'accessories',
    subcategory: 'Boutons de Manchette',
    url: 'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Paire de boutons de manchette dorés avec incrustation d\'onyx naturel',
    altEn: 'Pair of gold cufflinks inlaid with natural black onyx',
    altAr: 'زوج أزرار أكمام ذهبية مرصعة بحجر الأونيكس الأسود الطبيعي',
    photographer: 'Fine Jewelry Men',
  },
  {
    id: 'asset-pocket-square',
    title: 'Pochette en Soie Pure Roulottée Main',
    titleEn: 'Hand-Rolled Pure Silk Pocket Square',
    titleAr: 'منديل جيب من الحرير الخالص المبروم يدوياً',
    category: 'accessories',
    subcategory: 'Pochettes',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=1200',
    alt: 'Pochette en twill de soie bords roulottés à la main',
    altEn: 'Silk twill pocket square with hand-rolled edges',
    altAr: 'منديل جيب من الحرير الطبيعي بحواف مبرومة يدوياً',
    photographer: 'Pocket Square Club',
  },
  {
    id: 'asset-briefcase',
    title: 'Porte-Documents Business Cuir Noble Bordeaux',
    titleEn: 'Burgundy Fine Leather Executive Briefcase',
    titleAr: 'حقيبة أعمال فاخرة من الجلد العنابي',
    category: 'accessories',
    subcategory: 'Maroquinerie',
    url: 'https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?auto=format&fit=crop&q=80&w=1200',
    alt: 'Cartable serviette d\'affaires en cuir de veau rigide finitions or brossé',
    altEn: 'Structured calfskin business briefcase with brushed gold hardware',
    altAr: 'حقيبة أعمال من جلد العجل الصلب بلمسات ذهبية مطفية',
    photographer: 'Luxury Leather',
  },
  {
    id: 'asset-wallet',
    title: 'Portefeuille Fin en Cuir Nappa d\'Italie',
    titleEn: 'Slim Italian Nappa Leather Wallet',
    titleAr: 'محفظة جيب رفيعة من جلد النابا الإيطالي',
    category: 'accessories',
    subcategory: 'Maroquinerie',
    url: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=1200',
    alt: 'Portefeuille élégant en cuir nappa ultra fin avec fentes cartes dorées',
    altEn: 'Elegant ultra-slim nappa leather wallet with gold-accented card slots',
    altAr: 'محفظة جيب أنيقة ونحيفة من جلد النابا مع أماكن للبطاقات',
    photographer: 'Accessories Atelier',
  },
];

export function getLocalizedCuratedAsset(
  asset: CuratedAsset,
  language: SupportedLanguage = 'fr'
): { title: string; alt: string; subcategory: string } {
  const title =
    language === 'ar'
      ? asset.titleAr || asset.title
      : language === 'en'
      ? asset.titleEn || asset.title
      : asset.title;

  const alt =
    language === 'ar'
      ? asset.altAr || asset.alt
      : language === 'en'
      ? asset.altEn || asset.alt
      : asset.alt;

  return {
    title,
    alt,
    subcategory: getLocalizedSubcategory(asset.subcategory, language),
  };
}
