import { SupportedLanguage } from './types';

export interface ProductTranslation {
  title: string;
  description: string;
  subtitle?: string;
  materials?: string;
  careInstructions?: string;
}

export interface CategoryTranslation {
  name: string;
  subtitle: string;
  description: string;
}

export const CATEGORY_TRANSLATIONS: Record<string, Record<SupportedLanguage, CategoryTranslation>> = {
  clothing: {
    fr: {
      name: 'Vêtements',
      subtitle: 'Costumes, Blazers & Confection Sartoriale',
      description:
        "L'art du sur-mesure et de la coupe d'apparat. Des laines vierges d'exception Super 130s, des boutonnières façon tailleur et des finitions semi-entoilées d'une distinction souveraine.",
    },
    en: {
      name: 'Clothing',
      subtitle: 'Suits, Blazers & Sartorial Tailoring',
      description:
        'The art of bespoke tailoring and ceremonial silhouettes. Exceptional Super 130s virgin wools, artisan buttonholes, and semi-canvassed construction of commanding distinction.',
    },
    ar: {
      name: 'أزياء فاخرة',
      subtitle: 'بدلات راقية، سترات بليزر وخياطة متقنة',
      description:
        'فن الخياطة الرفيعة والقصات الملكية. أصواف نقية Super 130s، عراوي متقونة بلمسة يدوية وبطانة نصف مدعمة تمنح هيبة وتميزاً استثنائياً.',
    },
  },
  shoes: {
    fr: {
      name: 'Chaussures',
      subtitle: 'Souliers de Maître Bottier & Richelieus',
      description:
        "Façonnés dans des cuirs pleine fleur d'Italie et d'Espagne. Montages Goodyear et cousu Blake, patines appliquées à la main pour une cambrure d'une tenue irréprochable.",
    },
    en: {
      name: 'Footwear',
      subtitle: 'Master Shoemaker Shoes & Oxfords',
      description:
        'Crafted from full-grain leathers from Italy and Spain. Goodyear welts and Blake stitching, hand-applied patinas for flawless arch support and poise.',
    },
    ar: {
      name: 'أحذية',
      subtitle: 'أحذية جلدية كلاسيكية وصناعة يدوية',
      description:
        'مصنوعة من أرقى جلود العجل الطبيعية من إيطاليا وإسبانيا. خياطة غوديار وبليك متينة وتلميع يدوي يمنح راحة ووقاراً منقطع النظير.',
    },
  },
  accessories: {
    fr: {
      name: 'Accessoires',
      subtitle: 'Soie Jacquard, Maroquinerie & Horlogerie',
      description:
        'Le raffinement des détails qui couronne la silhouette masculine : cravates sept plis en soie, ceintures bombées en cuir véritable et boutons de manchette dorés.',
    },
    en: {
      name: 'Accessories',
      subtitle: 'Jacquard Silk, Leather Goods & Timepieces',
      description:
        'Refined details crowning the masculine silhouette: seven-fold silk ties, curved genuine leather belts, and gilded cufflinks.',
    },
    ar: {
      name: 'إكسسوارات',
      subtitle: 'حرير طبيعي، مصنوعات جلدية وساعات',
      description:
        'تفاصيل راقية تتوج الإطلالة الرجالية المتكاملة: ربطات عنق سباعية الطيات من الحرير، أحزمة جلدية متقنة وأزرار أكمام مذهبة.',
    },
  },
};

export const PRODUCT_TRANSLATIONS: Record<string, Record<Exclude<SupportedLanguage, 'fr'>, ProductTranslation>> = {
  'prod-suit-01': {
    en: {
      title: 'Two-Piece Italian Super 130s Wool Suit',
      description:
        "Crafted in pure virgin Super 130's wool spun in Italy, this two-piece suit embodies the pinnacle of VIP TADJ masculine refinement. Featuring a semi-canvassed notch lapel jacket and pleated fluid trousers, it guarantees an impeccable sculptural drape for prestige receptions and business.",
    },
    ar: {
      title: 'بدلة كلاسيكية من قطعتين بصوف إيطالي فائق الجودة Super 130s',
      description:
        'صُنعت هذه البدلة الكلاسيكية من الصوف الخالص Super 130s المغزول في إيطاليا، وتجسد قمة الرقي الرجالي لدى VIP TADJ. تتألف من سترة بنصف بطانة وياقة مشقوقة وسروال مريح بكسرات، مما يمنح قواماً مثالياً وجاذبية لا تُضاهى للمناسبات الرسمية والاجتماعات الرفيعة.',
    },
  },
  'prod-smoking-ceremonie-noir': {
    en: {
      title: 'Deep Black Ceremonial Tuxedo with Satin Lapels',
      description:
        'Masterpiece for gala evenings and formal ceremonies, this deep black tuxedo features shawl lapels faced in duchess satin, covered buttons, and bespoke tailored trousers.',
    },
    ar: {
      title: 'بدلة سموكينغ فاخرة للمناسبات باللون الأسود الملكي وحرير الساتان',
      description:
        'تحفة استثنائية لأمسيات الغالا والمناسبات الكبرى، تتميز بدلة السموكينغ بياقة شال مكسوة بحرير الساتان الفاخر وأزرار مغطاة مع سروال مفصل بدقة متناهية.',
    },
  },
  'prod-blazer-velours-anthracite': {
    en: {
      title: 'Double-Breasted Anthracite Wool Velvet Blazer',
      description:
        'Exceptional sartorial tailoring in soft, rich anthracite wool velvet with natural horn buttons and tailored structure for high-society winter evenings.',
    },
    ar: {
      title: 'سترة بليزر بأزرار مزدوجة من مخمل الصوف بلون الفحم',
      description:
        'تفصيل استثنائي من مخمل الصوف الفاخر بلون الفحم الداكن، مع أزرار قرنية طبيعية وبنية مفصلة تمنح الدفء والأناقة في الأمسيات الشتوية الراقية.',
    },
  },
  'prod-blazer-royal-bordeaux': {
    en: {
      title: 'Royal Burgundy Worsted Wool Blazer',
      description:
        'Deep burgundy blazer in worsted wool, offering sophisticated character, peak lapels, and timeless elegance for the modern distinguished gentleman.',
    },
    ar: {
      title: 'سترة بليزر ملكية بلون العنابي من الصوف الممشط',
      description:
        'سترة بليزر بلون عنابي ملكي من الصوف الممشط الفاخر، تتميز بياقة رمحية وأناقة عصرية تبرز المكانة والشخصية المتميزة.',
    },
  },
  'prod-manteau-long-cachemire-camel': {
    en: {
      title: 'Long Ceremonial Coat in Camel Cashmere',
      description:
        'Pure Italian cashmere overcoat with double-face finish, providing supreme thermal comfort and a commanding, regal silhouette through winter days.',
    },
    ar: {
      title: 'معطف طويل فاخر من كشمير الكاميل الأصيل',
      description:
        'معطف شتوي فاخر من الكشمير الإيطالي الخالص بلون الكاميل، يوفر دفئاً ملكياً استثنائياً وقواماً مهيباً خلال أيام الشتاء الباردة.',
    },
  },
  'prod-chemise-egyptien-blanc': {
    en: {
      title: 'Formal Dress Shirt in White Egyptian Cotton',
      description:
        'Two-ply Giza Egyptian cotton dress shirt with French cuffs, structured Italian collar, and genuine Australian mother-of-pearl buttons.',
    },
    ar: {
      title: 'قميص رسمي كلاسيكي من القطن المصري الأبيض الفاخر',
      description:
        'قميص رسمي فاخر منسوج من قطن الجيزة المصري ذي التيلة الطويلة، بأكمام فرنسية مزدوجة وياقة إيطالية وأزرار من عرق اللؤلؤ الطبيعي.',
    },
  },
  'prod-pantalon-tailleur-pinces': {
    en: {
      title: 'Pleated Tailored Trousers in Graphite Flannel',
      description:
        'Pleated wool flannel trousers with side brass adjusters and turn-up hems, combining vintage tailoring charm with contemporary ease.',
    },
    ar: {
      title: 'سروال كلاسيكي بكسرات من فلانيل الجرافيت',
      description:
        'سروال رسمي بكسرات مصنوع من قماش الفلانيل الصوفي الفاخر مع مشابك ضبط جانبية نحاسية تجمع بين الأصالة والراحة العصرية.',
    },
  },
  'prod-shoes-01': {
    en: {
      title: 'One-Cut Box Calf Richelieu Shoes',
      description:
        'Cut from a single piece of full-grain French box calf leather with hand-painted patina, Goodyear welted sole, and bevelled waist.',
    },
    ar: {
      title: 'أحذية ريشليو كلاسيكية قطعة واحدة من جلد العجل الفاخر',
      description:
        'صُنعت هذه الأحذية من قطعة جلدية واحدة متكاملة من أجود جلود العجل الفرنسية، مع تلميع يدوي دقيق وخياطة غوديار المتينة لمتانة تدوم عقوداً.',
    },
  },
  'prod-oxford-noir-goodyear': {
    en: {
      title: 'Black Oxford Derbies Goodyear Welted',
      description:
        'Classic black oxfords with Goodyear welted leather soles, closed lacing, and hand-finished burnished toe for premier formal events.',
    },
    ar: {
      title: 'أحذية أكسفورد سوداء بخياطة غوديار التقليدية',
      description:
        'أحذية أكسفورد سوداء كلاسيكية بنعل جلدي مخيط بطريقة غوديار وتصميم يضمن أقصى درجات الأناقة والراحة في المناسبات الرسمية.',
    },
  },
  'prod-mocassins-mors-dores': {
    en: {
      title: 'Horsebit Loafers in Glossy Black Leather',
      description:
        'Italian style horsebit loafers crafted in smooth polished calfskin with gilded brass hardware and Blake stitched flexible leather soles.',
    },
    ar: {
      title: 'أحذية موكاسان بإبزيم ذهبي وجلد أسود لامع',
      description:
        'أحذية موكاسان على الطراز الإيطالي الأصيل من جلد العجل المصقول، مزينة بحلية معدنية مذهبة ونعل جلدي مرن بخياطة بليك المتقنة.',
    },
  },
  'prod-mocassins-penny-havane': {
    en: {
      title: 'Penny Loafers in Havana Suede Calfskin',
      description:
        'Refined Havana suede calfskin penny loafers with Blake stitched leather and rubber injected soles for effortless sartorial casual elegance.',
    },
    ar: {
      title: 'أحذية بيني لوفر كلاسيكية من جلد السويد الهافان',
      description:
        'أحذية بيني لوفر راقية من جلد الشامواه الناعم بلون الهافان الكلاسيكي، تمنح إطلالة أنيقة ومريحة للإطلالات اليومية والعملية.',
    },
  },
  'prod-chelsea-daim-chocolat': {
    en: {
      title: 'Chelsea Boots in Deep Chocolate Suede',
      description:
        'Sleek chocolate suede Chelsea boots with elastic tone-on-tone side gussets, leather lining, and handcrafted Goodyear welted soles.',
    },
    ar: {
      title: 'أحذية بوت تشيلسي من جلد السويد بلون الشوكولاتة',
      description:
        'أحذية تشيلسي مميزة من جلد السويد بلون الشوكولاتة الغني مع جوانب مرنة متناسقة وبطانة جلدية كاملة ونعل متين مخيط يدوياً.',
    },
  },
  'prod-montre-chrono-or-cuir': {
    en: {
      title: 'Automatic Chronograph Watch Gold & Leather',
      description:
        'Prestige automatic chronograph timepiece with 18k gold PVD case, sunray champagne dial, and hand-stitched alligator embossed leather strap.',
    },
    ar: {
      title: 'ساعة كرونوغراف أوتوماتيكية مذهبة بحزام جلدي',
      description:
        'ساعة كرونوغراف أوتوماتيكية فاخرة بهيكل مطلي بالذهب عيار 18 وميناء مشع بلون الشامبانيا مع سوار جلدي مخيط يدوياً بنقش جلد التمساح.',
    },
  },
  'prod-montre-heritage-argent': {
    en: {
      title: 'Heritage Automatic Watch Silver Dial',
      description:
        'Minimalist heritage automatic timepiece featuring a sunburst silver dial, sapphire crystal, and exhibition caseback displaying precision rotor craftsmanship.',
    },
    ar: {
      title: 'ساعة هيريتيج أوتوماتيكية بميناء فضي كلاسيكي',
      description:
        'ساعة أوتوماتيكية كلاسيكية بتصميم بسيط وأنيق، ميناء فضي مشع وزجاج ياقوتي مقاوم للخدش مع غطاء خلفي شفاف يعرض دقة الحركة الميكانيكية.',
    },
  },
  'prod-cravate-soie-jacquard': {
    en: {
      title: 'Imperial Blue & Gold Jacquard Silk Tie',
      description:
        'Seven-fold pure Como jacquard silk tie with exquisite micro-patterning and hand-rolled finishes for supreme formal distinction.',
    },
    ar: {
      title: 'ربطة عنق من حرير الجاكار بلون أزرق إمبراطوري وذهبي',
      description:
        'ربطة عنق سباعية الطيات منسوجة من حرير كومو الإيطالي الفاخر بنقوش ميكرو دقيقة وأطراف ملفوفة يدوياً لأبهى إطلالة كلاسيكية.',
    },
  },
  'prod-acc-01': {
    en: {
      title: 'Reversible Full-Grain Leather Belt Black & Cognac',
      description:
        'Full-grain reversible leather belt offering black on one side and cognac on the other with a rotatable brushed gold buckle.',
    },
    ar: {
      title: 'حزام جلدي طبيعي بوجهين بلوني الأسود والكونياك',
      description:
        'حزام من جلد البقر الطبيعي بوجهين (أسود وكونياك) مع إبزيم دوار مطلي بالذهب المات، يتيح تنسيقاً مثالياً مع مختلف البدلات والأحذية.',
    },
  },
  'prod-boutons-manchette-or-onyx': {
    en: {
      title: 'Geometric Gold & Onyx Cufflinks',
      description:
        'Architectural geometric cufflinks crafted in gilded brass with natural black onyx stone inlays and swivel bar closure.',
    },
    ar: {
      title: 'أزرار أكمام هندسية مذهبة بحجر الأونيكس الأسود',
      description:
        'أزرار أكمام بتصميم هندسي راقٍ مصنوعة من النحاس المذهب ومرصعة بأحجار الأونيكس السوداء الطبيعية مع آلية إغلاق محكمة وسلسة.',
    },
  },
  'prod-pochette-soie-roulottee': {
    en: {
      title: 'Hand-Rolled Pure Silk Pocket Square',
      description:
        'Pure Italian silk pocket square featuring subtle paisley motif and meticulous hand-rolled edges, adding refined flourish to suit lapels.',
    },
    ar: {
      title: 'منديل جيب للبدلات من الحرير الخالص المبروم يدوياً',
      description:
        'منديل جيب فاخر من الحرير الإيطالي الخالص بنقوش البيزلي الهادئة وحواف مبرومة ومخيطة يدوياً لتزيين جيب سترة البدلة بأناقة بالغة.',
    },
  },
};

/**
 * Localizes a product object based on the active language.
 * When language is 'fr', returns the original product unmodified (preserving contract tests).
 * When language is 'en' or 'ar', overrides title, description, and available metadata with translated counterparts.
 */
export function getLocalizedProduct<
  T extends { id: string; title: string; description: string; [key: string]: any }
>(product: T, language: SupportedLanguage): T {
  if (language === 'fr' || !product) {
    return product;
  }

  const translations = PRODUCT_TRANSLATIONS[product.id]?.[language];
  if (!translations) {
    return product;
  }

  return {
    ...product,
    title: translations.title || product.title,
    description: translations.description || product.description,
  };
}

/**
 * Normalizes a category slug or ID into standard ID ('clothing', 'shoes', 'accessories').
 */
export function normalizeCategoryKey(key: string): string {
  if (!key) return '';
  const k = key.toLowerCase().trim();
  if (k === 'vetements' || k === 'clothing') return 'clothing';
  if (k === 'chaussures' || k === 'shoes') return 'shoes';
  if (k === 'accessoires' || k === 'accessories') return 'accessories';
  return k;
}

/**
 * Returns localized category name for a given category ID or slug and language.
 */
export function getLocalizedCategoryName(
  categoryId: string,
  language: SupportedLanguage
): string {
  const normalizedId = normalizeCategoryKey(categoryId);
  const meta = CATEGORY_TRANSLATIONS[normalizedId]?.[language];
  if (meta) {
    return meta.name;
  }
  return categoryId;
}

/**
 * Returns localized category metadata for a given category ID or slug and language.
 */
export function getLocalizedCategory(
  categoryId: string,
  language: SupportedLanguage
): CategoryTranslation | null {
  const normalizedId = normalizeCategoryKey(categoryId);
  return CATEGORY_TRANSLATIONS[normalizedId]?.[language] || null;
}

/**
 * Subcategory translation definitions across French, English, and Arabic.
 */
export const SUBCATEGORY_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Clothing
  costumes: {
    fr: 'Costumes',
    en: 'Suits',
    ar: 'بدلات',
  },
  blazers: {
    fr: 'Blazers',
    en: 'Blazers',
    ar: 'سترات بليزر',
  },
  chemises: {
    fr: 'Chemises',
    en: 'Shirts',
    ar: 'قمصان',
  },
  manteaux: {
    fr: 'Manteaux',
    en: 'Coats',
    ar: 'معاطف',
  },
  pantalons: {
    fr: 'Pantalons',
    en: 'Trousers',
    ar: 'سراويل',
  },
  // Shoes
  richelieu: {
    fr: 'Richelieu',
    en: 'Richelieu',
    ar: 'ريشليو',
  },
  oxfords: {
    fr: 'Oxfords',
    en: 'Oxfords',
    ar: 'أوكسفورد',
  },
  derbies: {
    fr: 'Derbies',
    en: 'Derbies',
    ar: 'ديربي',
  },
  mocassins: {
    fr: 'Mocassins',
    en: 'Loafers',
    ar: 'موكاسين',
  },
  bottines: {
    fr: 'Bottines',
    en: 'Ankle Boots',
    ar: 'أحذية كاحل بوتين',
  },
  // Accessories
  cravates: {
    fr: 'Cravates',
    en: 'Ties',
    ar: 'ربطات عنق',
  },
  ceintures: {
    fr: 'Ceintures',
    en: 'Belts',
    ar: 'أحزمة',
  },
  montres: {
    fr: 'Montres',
    en: 'Watches',
    ar: 'ساعات',
  },
  'boutons-manchette': {
    fr: 'Boutons de manchette',
    en: 'Cufflinks',
    ar: 'أزرار أكمام',
  },
  maroquinerie: {
    fr: 'Maroquinerie',
    en: 'Leather Goods',
    ar: 'مصنوعات جلدية',
  },
};

/**
 * Common color variant name translations across French, English, and Arabic.
 */
export const COLOR_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  'Noir Cérémonie': {
    fr: 'Noir Cérémonie',
    en: 'Ceremony Black',
    ar: 'أسود ملكي للمناسبات',
  },
  'Bleu Nuit': {
    fr: 'Bleu Nuit',
    en: 'Midnight Blue',
    ar: 'أزرق ليلي',
  },
  'Gris Anthracite': {
    fr: 'Gris Anthracite',
    en: 'Anthracite Grey',
    ar: 'رمادي فحمي',
  },
  'Bordeaux Royal': {
    fr: 'Bordeaux Royal',
    en: 'Royal Burgundy',
    ar: 'بورغندي ملكي',
  },
  'Havane': {
    fr: 'Havane',
    en: 'Havana Brown',
    ar: 'بني هافانا',
  },
  'Chocolat': {
    fr: 'Chocolat',
    en: 'Chocolate Brown',
    ar: 'بني شوكولاتة',
  },
  'Blanc Optique': {
    fr: 'Blanc Optique',
    en: 'Optic White',
    ar: 'أبيض ناصع',
  },
  'Or & Noir': {
    fr: 'Or & Noir',
    en: 'Gold & Black',
    ar: 'ذهبي وأسود',
  },
  'Bleu & Or': {
    fr: 'Bleu & Or',
    en: 'Blue & Gold',
    ar: 'أزرق وذهبي',
  },
  'Cognac': {
    fr: 'Cognac',
    en: 'Cognac Leather',
    ar: 'جلد كونياك',
  },
  'Noir': {
    fr: 'Noir',
    en: 'Black',
    ar: 'أسود',
  },
  'Bleu': {
    fr: 'Bleu',
    en: 'Blue',
    ar: 'أزرق',
  },
  'Gris': {
    fr: 'Gris',
    en: 'Grey',
    ar: 'رمادي',
  },
  'Bordeaux': {
    fr: 'Bordeaux',
    en: 'Burgundy',
    ar: 'بورغندي',
  },
  'Blanc': {
    fr: 'Blanc',
    en: 'White',
    ar: 'أبيض',
  },
};

/**
 * Size labels localization (e.g. 'Taille Unique' -> 'One Size' / 'مقاس موحد').
 */
export const SIZE_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  'Taille Unique': {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  'taille unique': {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  'One Size': {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  'one size': {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
};

/**
 * Returns localized subcategory label by subcategory ID or French label.
 */
export function getLocalizedSubcategory(
  subcategoryIdOrLabel: string,
  language: SupportedLanguage
): string {
  if (!subcategoryIdOrLabel || typeof subcategoryIdOrLabel !== 'string') return '';
  if (language === 'fr') return subcategoryIdOrLabel;

  const key = subcategoryIdOrLabel.toLowerCase().trim().replace(/\s+/g, '-');
  if (SUBCATEGORY_TRANSLATIONS[key]?.[language]) {
    return SUBCATEGORY_TRANSLATIONS[key][language];
  }
  for (const [id, trans] of Object.entries(SUBCATEGORY_TRANSLATIONS)) {
    if (
      id.toLowerCase() === key ||
      trans.fr.toLowerCase() === subcategoryIdOrLabel.toLowerCase() ||
      trans.en.toLowerCase() === subcategoryIdOrLabel.toLowerCase()
    ) {
      return trans[language] || subcategoryIdOrLabel;
    }
  }
  return subcategoryIdOrLabel;
}

/**
 * Returns localized color name.
 */
export function getLocalizedColor(
  colorName: string,
  language: SupportedLanguage
): string {
  if (!colorName || typeof colorName !== 'string') return '';
  if (language === 'fr') return colorName;

  const found = COLOR_TRANSLATIONS[colorName]?.[language];
  if (found) return found;

  for (const trans of Object.values(COLOR_TRANSLATIONS)) {
    if (
      trans.fr.toLowerCase() === colorName.toLowerCase() ||
      trans.en.toLowerCase() === colorName.toLowerCase()
    ) {
      return trans[language];
    }
  }
  return colorName;
}

/**
 * Returns localized size name (e.g. 'Taille Unique' -> 'One Size' / 'مقاس موحد').
 */
export function getLocalizedSize(
  size: string,
  language: SupportedLanguage
): string {
  if (!size || typeof size !== 'string') return '';
  const trimmed = size.trim();
  const lower = trimmed.toLowerCase();

  if (language === 'fr') {
    if (lower === 'one size' || lower === 'taille unique') {
      return SIZE_TRANSLATIONS['Taille Unique'].fr;
    }
    return size;
  }

  const found = SIZE_TRANSLATIONS[trimmed]?.[language];
  if (found) return found;

  const lowerFound = SIZE_TRANSLATIONS[lower]?.[language];
  if (lowerFound) return lowerFound;

  for (const trans of Object.values(SIZE_TRANSLATIONS)) {
    if (
      trans.fr.toLowerCase() === lower ||
      trans.en.toLowerCase() === lower ||
      trans.ar.toLowerCase() === lower
    ) {
      return trans[language] || size;
    }
  }

  return size;
}

/**
 * Re-export PRODUCT_TRANSLATIONS as CATALOG_TRANSLATIONS for backward compatibility.
 */
export const CATALOG_TRANSLATIONS = PRODUCT_TRANSLATIONS;
