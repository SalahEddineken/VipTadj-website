import { SupportedLanguage } from './types';
import type { Category } from '@/types';

export interface ProductTranslation {
  title: string;
  description: string;
  subtitle?: string;
  shortDescription?: string;
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
      subtitle: 'Vestes, Chemises & Prêt-à-Porter',
      description:
        "L'art du vestiaire masculin d'exception. Des matières nobles, des coupes contemporaines et des finitions soignées d'une distinction souveraine pour toutes vos occasions.",
    },
    en: {
      name: 'Clothing',
      subtitle: 'Jackets, Shirts & Fine Apparel',
      description:
        'The art of refined masculine clothing. Noble fabrics, contemporary silhouettes, and impeccable finishes for elevated everyday style.',
    },
    ar: {
      name: 'ملابس وأزياء',
      subtitle: 'سترات، قمصان، ومعاطف راقية',
      description:
        'فن الأزياء والملابس الرجالية الفاخرة. خامات عالية الجودة، قصات عصرية متقونة وتفاصيل تمنح هيبة وأناقة متكاملة.',
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
      title: 'Safari Jacket in Natural Cotton & Linen Blend',
      description:
        'A timeless staple blending ease and masculine character. Crafted from a refined Italian linen-cotton blend, this safari jacket features four flap pockets and a tailored profile perfect for effortless daily elegance.',
    },
    ar: {
      title: 'سترة سفاري أنيقة من الكتان والقطن الإيطالي الطبيعي',
      description:
        'قطعة أيقونية تجمع بين الراحة والجاذبية الرجالية. صُنعت من مزيج فاخر من الكتان والقطن الإيطالي الطبيعي، بأربعة جيوب أنيقة وقصة متوازنة تناسب الإطلالات اليومية والمناسبات الراقية.',
    },
  },
  'prod-smoking-ceremonie-noir': {
    en: {
      title: 'Minimalist Suede Leather Bomber Jacket',
      description:
        'Refined modern outerwear crafted from velvety soft suede leather, featuring tone-on-tone ribbed trims and a gilded two-way metal zipper.',
    },
    ar: {
      title: 'جاكيت بومبر فاخر من الجلد السويدي الناعم',
      description:
        'أناقة عصرية راقية. جاكيت بومبر خفيف مصنوع من جلد السويد فائق النعومة بملمس مخملي وسحاب معدني مذهب وتصميم عصري يواكب مختلف الإطلالات.',
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
        'حزام من جلد البقر الطبيعي بوجهين (أسود وكونياك) مع إبزيم دوار مطلي بالذهب المات، يتيح تنسيقاً مثالياً مع مختلف الملابس والأحذية.',
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
        'Pure Italian silk pocket square featuring subtle paisley motif and meticulous hand-rolled edges, adding refined flourish to jacket pockets.',
    },
    ar: {
      title: 'منديل جيب من الحرير الخالص المبروم يدوياً',
      description:
        'منديل جيب فاخر من الحرير الإيطالي الخالص بنقوش البيزلي الهادئة وحواف مبرومة ومخيطة يدوياً لتزيين جيب السترة بأناقة بالغة.',
    },
  },
  'prod-costume-trois-pieces-prince': {
    en: {
      title: 'Warm Wool & Cashmere Check Overshirt',
      description:
        'The ultimate mid-season layering piece. Woven in a soft wool-cashmere blend with subtle grey and charcoal patterns, dual chest pockets, and horn-effect buttons.',
    },
    ar: {
      title: 'قميص جاكيت (أوفر شيرت) من الصوف والكشمير بنقشة كاروهات هادئة',
      description:
        'القطعة المثالية لإطلالة شتوية وربيعية راقية. منسوجة من مزيج فاخر من الصوف والكشمير بنقوش هادئة وجيوب أمامية عملية تمنح مظهراً عصرياً وجذاباً.',
    },
  },
  'prod-blazer-bleu-cobalt': {
    en: {
      title: 'Neapolitan Unstructured Cobalt Blue Tailored Blazer',
      description:
        'Italian sprezzatura featuring spalla camicia shirt-shoulder construction, patch pockets, and vibrant cobalt blue luxury wool.',
    },
    ar: {
      title: 'سترة بليزر إيطالية أنيقة بلون أزرق كوبالت جذاب',
      description:
        'تصميم نابولي أصيل بكتف مريح وجيوب مميزة وقماش صوف راقٍ بلون أزرق مميز.',
    },
  },
  'prod-pardessus-laine-noire': {
    en: {
      title: 'Officer Winter Overcoat in Heavy Black Melton Wool',
      description:
        'Commanding tailored officer overcoat crafted in naturally water-resistant Melton wool with velvet-lined collar.',
    },
    ar: {
      title: 'معطف شتوي فاخر من الصوف الأسود الثقيل بقصة وقورة',
      description:
        'معطف شتوي أنيق ودافئ من الصوف الأسود الفاخر المقاوم للعوامل الجوية مع ياقة مبطنة وأزرار متقنة.',
    },
  },
  'prod-chemise-popeline-bleu-ciel': {
    en: {
      title: 'Sky Blue Poplin Dress Shirt with French Cuffs',
      description:
        'Sartorial business staple in smooth two-ply cotton poplin with cutaway collar and French cuffs for luxury cufflinks.',
    },
    ar: {
      title: 'قميص رسمي بلون أزرق سماوي وأكمام فرنسية فاخرة',
      description:
        'قميص أعمال راقٍ من قطن البوبلين الناعم المريح مع ياقة إيطالية وأكمام مهيأة لأزرار الأكمام الذهبية.',
    },
  },
  'prod-pull-cachemire-col-roule': {
    en: {
      title: 'Pure Mongolian Cashmere Turtleneck Sweater in Onyx Black',
      description:
        'Knitted in 4-ply Mongolian cashmere gauge 12, offering supreme warmth and refined silhouette beneath tailored blazers.',
    },
    ar: {
      title: 'كنزة بياقة عالية من الكشمير الخالص باللون الأسود الملكي',
      description:
        'حياكة راقية من كشمير منغوليا الخالص بأربعة خيوط تمنح الدفء والنعومة الفائقة تحت السترات والمعاطف الشتوية.',
    },
  },
  'prod-double-boucle-cognac': {
    en: {
      title: 'Double Monk Strap Shoes in Hand-Patinated Chestnut Leather',
      description:
        'Charismatic double monk strap shoes in hand-burnished Box-Calf leather with brushed golden hardware.',
    },
    ar: {
      title: 'حذاء كلاسيكي ذو إبزيم مزدوج من الجلد الطبيعي المصقول باللون البني',
      description:
        'تصميم مميز وأنيق بإبزيمين مطليين بالذهب مع جلد فاخر مصقول يدوياً ولمعان راقٍ.',
    },
  },
  'prod-derbies-marron-vintage': {
    en: {
      title: 'Wingtip Brogue Derbies in Hand-Burnished Vintage Brown Leather',
      description:
        'Traditional English perforated wingtip brogues on double leather sole with storm welt construction.',
    },
    ar: {
      title: 'حذاء ديربي بنقوش كلاسيكية مخرزة من الجلد البني الفاخر',
      description:
        'حذاء رسمي متميز بنقوش كلاسيكية دقيقة ونعل جلدي متين وخياطة يدوية متقنة.',
    },
  },
  'prod-mocassins-glands-bordeaux': {
    en: {
      title: 'Tassel Loafers in Deep Burgundy Glazed Calf Leather',
      description:
        'Iconic Italian tassel loafers finished in lustrous deep burgundy patina with hand-woven tassels.',
    },
    ar: {
      title: 'حذاء موكاسان بشرابات أنيقة من الجلد الفاخر بلون عنابي داكن',
      description:
        'موكاسان أيقوني مريح وبشرابات جلدية متقنة مع صباغة يدوية بلون عنابي غني.',
    },
  },
  'prod-sneakers-cuir-minimaliste': {
    en: {
      title: 'Luxury Minimalist Sneakers in Pure White Leather with Margom Sole',
      description:
        'Contemporary luxury sneakers in butter-soft Italian nappa leather on stitched Italian Margom rubber cupsole.',
    },
    ar: {
      title: 'حذاء رياضي أنيق ومينيمالي من الجلد الأبيض الطبيعي بنعل مارغوم',
      description:
        'حذاء رياضي مريح وفخم من جلد النابا الأبيض الخالص مع نعل مطاطي إيطالي مخيط بالكامل.',
    },
  },
  'prod-bottines-jodhpur-noir': {
    en: {
      title: 'Formal Jodhpur Boots in Black Box-Calf Leather with Gold Buckle',
      description:
        'Sleek ankle-strap Jodhpur boots crafted in French box-calf leather with polished brass buckle.',
    },
    ar: {
      title: 'حذاء كاحل جودبور رسمي من الجلد الأسود الأملس مع إبزيم ذهبي',
      description:
        'حذاء كاحل استثنائي وأنيق يلتف بحزام جلدي مع إبزيم ذهبي مصقول ونعل جلدي نحيف.',
    },
  },
  'prod-porte-documents-cuir': {
    en: {
      title: 'Executive Leather Briefcase in Deep Burgundy with Gold Lock',
      description:
        'Structured bridle leather briefcase with padded laptop compartment and gold-plated combination clasp.',
    },
    ar: {
      title: 'حقيبة وثائق أعمال فاخرة من الجلد الصلب باللون العنابي وقفل ذهبي',
      description:
        'حقيبة جلدية للمدراء ورجال الأعمال تتسع للحاسوب المحمول والملفات مع قفل أمان مطلي بالذهب.',
    },
  },
  'prod-portefeuille-nappa': {
    en: {
      title: 'Ultra-Slim Italian Nappa Leather Wallet with RFID Shield',
      description:
        'Sleek bifold pocket wallet designed to glide smoothly into jacket pockets with RFID blocking protection.',
    },
    ar: {
      title: 'محفظة جيب نحيفة جداً من جلد النابا الأسود مع حماية للبطاقات البنكية (RFID)',
      description:
        'محفظة جيب فائقة النحافة مصممة خصيصاً للجيب الداخلي للسترات والمعاطف مع حماية للبطاقات البنكية مدمجة.',
    },
  },
};

function nonEmpty(val: unknown): string | undefined {
  return typeof val === 'string' && val.trim().length > 0 ? val : undefined;
}

/**
 * Localizes a product object based on the active language.
 * When language is 'fr', returns the original product unmodified (preserving contract tests).
 * When language is 'en' or 'ar', checks product *Ar/*En fields before PRODUCT_TRANSLATIONS,
 * and handles partial CartItem/OrderItem shapes via productId lookup.
 */
export function getLocalizedProduct<
  T extends {
    id?: string;
    productId?: string;
    title: string;
    description?: string;
    [key: string]: any;
  }
>(product: T, language: SupportedLanguage): T {
  if (language === 'fr' || !product) {
    return product;
  }

  const lookupId =
    (product.id && PRODUCT_TRANSLATIONS[product.id] ? product.id : undefined) ??
    product.productId ??
    product.id;

  const dict = lookupId ? PRODUCT_TRANSLATIONS[lookupId]?.[language] : undefined;

  const localizedTitle =
    language === 'ar'
      ? nonEmpty(product.titleAr) || dict?.title
      : nonEmpty(product.titleEn) || dict?.title;

  const localizedDescription =
    language === 'ar'
      ? nonEmpty(product.descriptionAr) || dict?.description
      : nonEmpty(product.descriptionEn) || dict?.description;

  const localizedSubtitle =
    language === 'ar'
      ? nonEmpty(product.subtitleAr) || dict?.subtitle
      : nonEmpty(product.subtitleEn) || dict?.subtitle;

  const localizedShortDescription =
    language === 'ar'
      ? nonEmpty(product.shortDescriptionAr) || dict?.shortDescription
      : nonEmpty(product.shortDescriptionEn) || dict?.shortDescription;

  const localizedMaterials =
    language === 'ar'
      ? nonEmpty(product.materialsAr) || dict?.materials
      : nonEmpty(product.materialsEn) || dict?.materials;

  const localizedCare =
    language === 'ar'
      ? nonEmpty(product.careInstructionsAr) || dict?.careInstructions
      : nonEmpty(product.careInstructionsEn) || dict?.careInstructions;

  const localizedFit =
    typeof product.fit === 'string' && product.fit.trim()
      ? getLocalizedFit(product.fit, language)
      : undefined;
  const hasFitChange = Boolean(localizedFit && localizedFit !== product.fit);

  const hasAnyTranslation =
    localizedTitle ||
    localizedDescription ||
    localizedSubtitle ||
    localizedShortDescription ||
    localizedMaterials ||
    localizedCare ||
    hasFitChange;

  if (!hasAnyTranslation) {
    return product;
  }

  const result: Record<string, any> = {
    ...product,
    title: localizedTitle || product.title,
  };

  if (product.description !== undefined || localizedDescription) {
    result.description = localizedDescription || product.description;
  }
  if (product.subtitle !== undefined || localizedSubtitle) {
    result.subtitle = localizedSubtitle || product.subtitle;
  }
  if (product.shortDescription !== undefined || localizedShortDescription) {
    result.shortDescription = localizedShortDescription || product.shortDescription;
  }
  if (product.materials !== undefined || localizedMaterials) {
    result.materials = localizedMaterials || product.materials;
  }
  if (product.careInstructions !== undefined || localizedCare) {
    result.careInstructions = localizedCare || product.careInstructions;
  }
  if (product.fit !== undefined || localizedFit) {
    result.fit = localizedFit || product.fit;
  }

  return result as T;
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
 * Localizes a Category object using inline *Ar/*En fields before CATEGORY_TRANSLATIONS fallback.
 */
export function localizeCategory<T extends Category>(
  category: T,
  language: SupportedLanguage
): T {
  if (!category || language === 'fr') {
    return category;
  }

  const normalizedId = normalizeCategoryKey(category.id || category.slug);
  const dict = CATEGORY_TRANSLATIONS[normalizedId]?.[language];

  const localizedName =
    language === 'ar'
      ? nonEmpty(category.nameAr) || dict?.name
      : nonEmpty(category.nameEn) || dict?.name;

  const localizedSubtitle =
    language === 'ar'
      ? nonEmpty(category.subtitleAr) || dict?.subtitle
      : nonEmpty(category.subtitleEn) || dict?.subtitle;

  const localizedDescription =
    language === 'ar'
      ? nonEmpty(category.descriptionAr) || dict?.description
      : nonEmpty(category.descriptionEn) || dict?.description;

  return {
    ...category,
    name: localizedName || category.name,
    ...(category.subtitle !== undefined || localizedSubtitle
      ? { subtitle: localizedSubtitle || category.subtitle }
      : {}),
    description: localizedDescription || category.description,
  };
}

/**
 * Subcategory translation definitions across French, English, and Arabic.
 */
export const SUBCATEGORY_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Clothing
  vestes: {
    fr: 'Vestes & Blousons',
    en: 'Jackets & Outerwear',
    ar: 'سترات وجواكيت',
  },
  costumes: {
    fr: 'Vestes & Ensembles',
    en: 'Jackets & Sets',
    ar: 'سترات وملابس',
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
    ar: 'سراويل كلاسيكية',
  },
  tricots: {
    fr: 'Tricots & Maille',
    en: 'Knitwear',
    ar: 'كنزات وملابس صوفية',
  },
  // Shoes
  richelieu: {
    fr: 'Richelieu',
    en: 'Richelieu',
    ar: 'أحذية ريشليو',
  },
  richelieus: {
    fr: 'Richelieus',
    en: 'Richelieu',
    ar: 'أحذية ريشليو',
  },
  oxfords: {
    fr: 'Oxfords',
    en: 'Oxfords',
    ar: 'أحذية أكسفورد',
  },
  derbies: {
    fr: 'Derbies',
    en: 'Derbies',
    ar: 'أحذية ديربي',
  },
  mocassins: {
    fr: 'Mocassins',
    en: 'Loafers',
    ar: 'أحذية موكاسان',
  },
  bottines: {
    fr: 'Bottines',
    en: 'Ankle Boots',
    ar: 'أحذية بوت',
  },
  boucles: {
    fr: 'Double Boucle',
    en: 'Monk Strap',
    ar: 'أحذية بإبزيم مزدوج',
  },
  sneakers: {
    fr: 'Baskets de Luxe',
    en: 'Luxury Sneakers',
    ar: 'أحذية رياضية فاخرة',
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
    ar: 'أحزمة جلدية',
  },
  montres: {
    fr: 'Montres',
    en: 'Watches',
    ar: 'ساعات',
  },
  horlogerie: {
    fr: 'Horlogerie',
    en: 'Watches',
    ar: 'ساعات',
  },
  'boutons-manchette': {
    fr: 'Boutons de manchette',
    en: 'Cufflinks',
    ar: 'أزرار أكمام',
  },
  'boutons-de-manchette': {
    fr: 'Boutons de manchette',
    en: 'Cufflinks',
    ar: 'أزرار أكمام',
  },
  pochettes: {
    fr: 'Pochettes',
    en: 'Pocket Squares',
    ar: 'مناديل الجيب',
  },
  maroquinerie: {
    fr: 'Maroquinerie',
    en: 'Leather Goods',
    ar: 'مصنوعات جلدية',
  },
};

/**
 * Common color variant name translations across French, English, and Arabic.
 * Covers all 115 COLOR_PALETTE_BASE entries + 11 legacy/compound names (126 total).
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
    ar: 'عنابي ملكي',
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
    ar: 'كونياك',
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
    ar: 'عنابي',
  },
  'Blanc': {
    fr: 'Blanc',
    en: 'White',
    ar: 'أبيض',
  },
  'Noir Profond': {
    fr: 'Noir Profond',
    en: 'Deep Black',
    ar: 'أسود حالك',
  },
  'Noir Ébène': {
    fr: 'Noir Ébène',
    en: 'Ebony Black',
    ar: 'أسود أبنوسي',
  },
  'Jaune Moutarde': {
    fr: 'Jaune Moutarde',
    en: 'Mustard Yellow',
    ar: 'أصفر خردلي',
  },
  'Doré / Or': {
    fr: 'Doré / Or',
    en: 'Gold',
    ar: 'ذهبي فاخر',
  },
  'Or Impérial': {
    fr: 'Or Impérial',
    en: 'Imperial Gold',
    ar: 'ذهبي إمبراطوري',
  },
  'Jaune': {
    fr: 'Jaune',
    en: 'Yellow',
    ar: 'أصفر',
  },
  'Violet': {
    fr: 'Violet',
    en: 'Purple',
    ar: 'بنفسجي',
  },
  'Violet Impérial': {
    fr: 'Violet Impérial',
    en: 'Imperial Purple',
    ar: 'بنفسجي إمبراطوري',
  },
  'Améthyste': {
    fr: 'Améthyste',
    en: 'Amethyst',
    ar: 'بنفسجي أرجواني',
  },
  'Aubergine': {
    fr: 'Aubergine',
    en: 'Eggplant Purple',
    ar: 'باذنجاني داكن',
  },
  'Vert Kaki': {
    fr: 'Vert Kaki',
    en: 'Khaki Green',
    ar: 'أخضر كاكي',
  },
  'Vert Olive': {
    fr: 'Vert Olive',
    en: 'Olive Green',
    ar: 'أخضر زيتوني',
  },
  'Vert Bouteille': {
    fr: 'Vert Bouteille',
    en: 'Bottle Green',
    ar: 'أخضر غامق ملكي',
  },
  'Vert Émeraude': {
    fr: 'Vert Émeraude',
    en: 'Emerald Green',
    ar: 'أخضر زمردي',
  },
  'Vert': {
    fr: 'Vert',
    en: 'Green',
    ar: 'أخضر',
  },
  'Marron Cognac': {
    fr: 'Marron Cognac',
    en: 'Cognac Brown',
    ar: 'بني كونياك',
  },
  'Camel': {
    fr: 'Camel',
    en: 'Camel',
    ar: 'بيج كاميل',
  },
  'Beige Écru': {
    fr: 'Beige Écru',
    en: 'Ecru Beige',
    ar: 'بيج خام',
  },
  'Bleu Marine': {
    fr: 'Bleu Marine',
    en: 'Navy Blue',
    ar: 'أزرق كحلي',
  },
  'Bleu Royal': {
    fr: 'Bleu Royal',
    en: 'Royal Blue',
    ar: 'أزرق ملكي',
  },
  'Bleu Ciel': {
    fr: 'Bleu Ciel',
    en: 'Sky Blue',
    ar: 'أزرق سماوي',
  },
  'Rouge Rubis': {
    fr: 'Rouge Rubis',
    en: 'Ruby Red',
    ar: 'أحمر ياقوتي',
  },
  'Terracotta': {
    fr: 'Terracotta',
    en: 'Terracotta',
    ar: 'آجوري محروق',
  },
  'Rose Poudré': {
    fr: 'Rose Poudré',
    en: 'Powder Pink',
    ar: 'وردي هادئ',
  },
  // Additional 87 COLOR_PALETTE_BASE entries
  'Noir Satiné': { fr: 'Noir Satiné', en: 'Satin Black', ar: 'أسود ساتيني' },
  'Gris Anthracite Foncé': { fr: 'Gris Anthracite Foncé', en: 'Dark Anthracite Grey', ar: 'رمادي فحمي غامق' },
  'Gris Fumé': { fr: 'Gris Fumé', en: 'Smoked Grey', ar: 'رمادي مدخّن' },
  'Gris Acier': { fr: 'Gris Acier', en: 'Steel Grey', ar: 'رمادي فولاذي' },
  'Gris Ardoise': { fr: 'Gris Ardoise', en: 'Slate Grey', ar: 'رمادي أردوازي' },
  'Gris Perle': { fr: 'Gris Perle', en: 'Pearl Grey', ar: 'رمادي لؤلؤي' },
  'Gris Souris': { fr: 'Gris Souris', en: 'Mouse Grey', ar: 'رمادي متوسط' },
  'Gris Argent': { fr: 'Gris Argent', en: 'Silver Grey', ar: 'رمادي فضي' },
  'Gris Clair': { fr: 'Gris Clair', en: 'Light Grey', ar: 'رمادي فاتح' },
  'Gris Givré': { fr: 'Gris Givré', en: 'Frosted Grey', ar: 'رمادي ثلجي فاتح' },
  'Blanc Cassé': { fr: 'Blanc Cassé', en: 'Off-White', ar: 'أبيض مكسور (كريمي)' },
  'Crème': { fr: 'Crème', en: 'Cream', ar: 'كريمي' },
  'Ivoire': { fr: 'Ivoire', en: 'Ivory', ar: 'عاجي' },
  'Lin Naturel': { fr: 'Lin Naturel', en: 'Natural Linen', ar: 'بيج كتاني طبيعي' },
  'Sable': { fr: 'Sable', en: 'Sand', ar: 'بيج رملي' },
  'Beige Tan': { fr: 'Beige Tan', en: 'Tan Beige', ar: 'بيج تان' },
  'Chocolat Noir': { fr: 'Chocolat Noir', en: 'Dark Chocolate', ar: 'بني شوكولاتة غامق' },
  'Sienne Havane': { fr: 'Sienne Havane', en: 'Havana Sienna', ar: 'بني هافانا محمر' },
  'Marron Glacé': { fr: 'Marron Glacé', en: 'Chestnut Brown', ar: 'بني كستنائي' },
  'Ocre Doré': { fr: 'Ocre Doré', en: 'Golden Ochre', ar: 'أصفر ترابي ذهبي' },
  'Cuir Tabac': { fr: 'Cuir Tabac', en: 'Tobacco Leather', ar: 'بني تبغي' },
  'Caramel Doré': { fr: 'Caramel Doré', en: 'Golden Caramel', ar: 'كراميل ذهبي' },
  'Cuir Vintage': { fr: 'Cuir Vintage', en: 'Vintage Leather', ar: 'بني جلدي معتّق' },
  'Bleu Nuit Profond': { fr: 'Bleu Nuit Profond', en: 'Deep Midnight Blue', ar: 'أزرق ليلي غامق' },
  'Bleu Nuit Cérémonie': { fr: 'Bleu Nuit Cérémonie', en: 'Ceremony Midnight Blue', ar: 'أزرق ليلي ملكي' },
  'Bleu Marine Sombre': { fr: 'Bleu Marine Sombre', en: 'Dark Navy Blue', ar: 'أزرق كحلي غامق' },
  'Bleu Sombre': { fr: 'Bleu Sombre', en: 'Dark Blue', ar: 'أزرق غامق' },
  'Bleu Saphir': { fr: 'Bleu Saphir', en: 'Sapphire Blue', ar: 'أزرق ياقوتي' },
  'Bleu Impérial': { fr: 'Bleu Impérial', en: 'Imperial Blue', ar: 'أزرق إمبراطوري' },
  'Bleu Roi': { fr: 'Bleu Roi', en: 'King Blue', ar: 'أزرق زهري ملكي' },
  'Bleu Azur': { fr: 'Bleu Azur', en: 'Azure Blue', ar: 'أزرق سماوي زاهي' },
  'Bleu Céruléen': { fr: 'Bleu Céruléen', en: 'Cerulean Blue', ar: 'أزرق بحري' },
  'Bleu Pétrole': { fr: 'Bleu Pétrole', en: 'Petrol Blue', ar: 'أزرق بترولي' },
  'Bleu Canard': { fr: 'Bleu Canard', en: 'Duck Blue', ar: 'أزرق مخضر داكن' },
  'Sarcelle': { fr: 'Sarcelle', en: 'Teal', ar: 'أزرق تركوازي غامق' },
  'Turquoise': { fr: 'Turquoise', en: 'Turquoise', ar: 'تركوازي' },
  'Bleu Glacier': { fr: 'Bleu Glacier', en: 'Ice Blue', ar: 'أزرق جليدي فاتح' },
  'Bleu Pastel': { fr: 'Bleu Pastel', en: 'Pastel Blue', ar: 'أزرق باستيل فاتح' },
  'Vert Forêt Profond': { fr: 'Vert Forêt Profond', en: 'Deep Forest Green', ar: 'أخضر غابي غامق' },
  'Vert Émeraude Sombre': { fr: 'Vert Émeraude Sombre', en: 'Dark Emerald Green', ar: 'أخضر زمردي غامق' },
  'Vert Sapin': { fr: 'Vert Sapin', en: 'Pine Green', ar: 'أخضر صنوبري غامق' },
  'Vert Anglais': { fr: 'Vert Anglais', en: 'British Racing Green', ar: 'أخضر إنجليزي' },
  'Vert Vif': { fr: 'Vert Vif', en: 'Bright Green', ar: 'أخضر زاهي' },
  'Vert Kaki Foncé': { fr: 'Vert Kaki Foncé', en: 'Dark Khaki Green', ar: 'أخضر كاكي غامق' },
  'Vert Bronze': { fr: 'Vert Bronze', en: 'Bronze Green', ar: 'أخضر برونزي' },
  'Vert Mousse': { fr: 'Vert Mousse', en: 'Moss Green', ar: 'أخضر عشبي' },
  'Vert Marin': { fr: 'Vert Marin', en: 'Sea Green', ar: 'أخضر بحري' },
  'Vert Sauge': { fr: 'Vert Sauge', en: 'Sage Green', ar: 'أخضر رمادي هادئ' },
  'Vert Pistache': { fr: 'Vert Pistache', en: 'Pistachio Green', ar: 'أخضر فستقي' },
  'Vert Menthe': { fr: 'Vert Menthe', en: 'Mint Green', ar: 'أخضر نعناعي فاتح' },
  'Ocre Jaune': { fr: 'Ocre Jaune', en: 'Yellow Ochre', ar: 'أصفر ترابي' },
  'Jaune Safran': { fr: 'Jaune Safran', en: 'Saffron Yellow', ar: 'أصفر زعفراني' },
  'Jaune Soleil': { fr: 'Jaune Soleil', en: 'Sun Yellow', ar: 'أصفر مشرق' },
  'Jaune Vif': { fr: 'Jaune Vif', en: 'Bright Yellow', ar: 'أصفر فاقع' },
  'Jaune Pâle': { fr: 'Jaune Pâle', en: 'Pale Yellow', ar: 'أصفر فاتح' },
  'Rouille': { fr: 'Rouille', en: 'Rust', ar: 'بني صدئ' },
  'Brique Cuite': { fr: 'Brique Cuite', en: 'Burnt Brick', ar: 'أحمر آجوري' },
  'Orange Sanguine': { fr: 'Orange Sanguine', en: 'Blood Orange', ar: 'برتقالي غامق' },
  'Orange': { fr: 'Orange', en: 'Orange', ar: 'برتقالي' },
  'Corail': { fr: 'Corail', en: 'Coral', ar: 'مرجاني' },
  'Bordeaux Profond': { fr: 'Bordeaux Profond', en: 'Deep Burgundy', ar: 'عنابي غامق' },
  'Lie de Vin': { fr: 'Lie de Vin', en: 'Wine Red', ar: 'عنابي داكن' },
  'Rouge Grenat': { fr: 'Rouge Grenat', en: 'Garnet Red', ar: 'أحمر رماني غامق' },
  'Rouge Carmin': { fr: 'Rouge Carmin', en: 'Crimson Red', ar: 'أحمر قرمزي' },
  'Rouge Vif': { fr: 'Rouge Vif', en: 'Bright Red', ar: 'أحمر زاهي' },
  'Rouge Écarlate': { fr: 'Rouge Écarlate', en: 'Scarlet Red', ar: 'أحمر قاني' },
  'Aubergine Sombre': { fr: 'Aubergine Sombre', en: 'Dark Eggplant', ar: 'باذنجاني غامق' },
  'Indigo': { fr: 'Indigo', en: 'Indigo', ar: 'نيلي غامق' },
  'Violet Nuit': { fr: 'Violet Nuit', en: 'Midnight Purple', ar: 'بنفسجي ليلي' },
  'Violet Évêque': { fr: 'Violet Évêque', en: 'Bishop Purple', ar: 'بنفسجي غامق' },
  'Violet Vif': { fr: 'Violet Vif', en: 'Bright Purple', ar: 'بنفسجي زاهي' },
  'Bleu Violet': { fr: 'Bleu Violet', en: 'Blue Violet', ar: 'بنفسجي مائل للأزرق' },
  'Pourpre Royal': { fr: 'Pourpre Royal', en: 'Royal Purple', ar: 'أرجواني ملكي' },
  'Mauve Orchidée': { fr: 'Mauve Orchidée', en: 'Orchid Mauve', ar: 'موف أرجواني' },
  'Mauve Clair': { fr: 'Mauve Clair', en: 'Light Mauve', ar: 'بنفسجي فاتح' },
  'Chardon': { fr: 'Chardon', en: 'Thistle', ar: 'موف رمادي فاتح' },
  'Lavande': { fr: 'Lavande', en: 'Lavender', ar: 'خزامي فاتح' },
  'Lilas': { fr: 'Lilas', en: 'Lilac', ar: 'ليلكي فاتح' },
  'Prune Sauvage': { fr: 'Prune Sauvage', en: 'Wild Plum', ar: 'برقوقي غامق' },
  'Framboise': { fr: 'Framboise', en: 'Raspberry', ar: 'توتي غامق' },
  'Fuchsia': { fr: 'Fuchsia', en: 'Fuchsia', ar: 'فوشيا' },
  'Rose Cerise': { fr: 'Rose Cerise', en: 'Cherry Pink', ar: 'وردي كرزي' },
  'Rose Velours': { fr: 'Rose Velours', en: 'Velvet Rose', ar: 'وردي مخملي' },
  'Rose Corail': { fr: 'Rose Corail', en: 'Coral Pink', ar: 'وردي مرجاني' },
  'Rose Saumon': { fr: 'Rose Saumon', en: 'Salmon Pink', ar: 'وردي سلموني' },
  'Rose Bonbon': { fr: 'Rose Bonbon', en: 'Candy Pink', ar: 'وردي زاهي' },
  'Vieux Rose': { fr: 'Vieux Rose', en: 'Dusty Rose', ar: 'وردي معتّق' },
};

function foldColorKey(val: string): string {
  return val
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const COLOR_LOOKUP_EXACT = new Map<string, Record<SupportedLanguage, string>>();
const COLOR_LOOKUP_FOLDED = new Map<string, Record<SupportedLanguage, string>>();

const COLOR_PART_ALIASES: Record<string, Record<SupportedLanguage, string>> = {
  Or: { fr: 'Or', en: 'Gold', ar: 'ذهبي' },
  Doré: { fr: 'Doré', en: 'Gold', ar: 'ذهبي' },
  Argent: { fr: 'Argent', en: 'Silver', ar: 'فضي' },
  Marron: { fr: 'Marron', en: 'Brown', ar: 'بني' },
  Beige: { fr: 'Beige', en: 'Beige', ar: 'بيج' },
  Rouge: { fr: 'Rouge', en: 'Red', ar: 'أحمر' },
  Rose: { fr: 'Rose', en: 'Pink', ar: 'وردي' },
};

for (const [key, trans] of Object.entries({ ...COLOR_PART_ALIASES, ...COLOR_TRANSLATIONS })) {
  const lowerKey = key.trim().replace(/\s+/g, ' ').toLowerCase();
  COLOR_LOOKUP_EXACT.set(lowerKey, trans);
  COLOR_LOOKUP_FOLDED.set(foldColorKey(key), trans);
  COLOR_LOOKUP_FOLDED.set(foldColorKey(trans.fr), trans);
  COLOR_LOOKUP_FOLDED.set(foldColorKey(trans.en), trans);
  COLOR_LOOKUP_FOLDED.set(foldColorKey(trans.ar), trans);
}

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
  'مقاس موحد': {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  Unique: {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  unique: {
    fr: 'Taille Unique',
    en: 'One Size',
    ar: 'مقاس موحد',
  },
  Standard: {
    fr: 'Standard',
    en: 'Standard',
    ar: 'مقاس قياسي',
  },
  standard: {
    fr: 'Standard',
    en: 'Standard',
    ar: 'مقاس قياسي',
  },
  'مقاس قياسي': {
    fr: 'Standard',
    en: 'Standard',
    ar: 'مقاس قياسي',
  },
};

/**
 * Returns localized subcategory label by subcategory ID or French/English/Arabic label.
 */
export function getLocalizedSubcategory(
  subcategoryIdOrLabel: string,
  language: SupportedLanguage
): string {
  if (!subcategoryIdOrLabel || typeof subcategoryIdOrLabel !== 'string') return '';

  const trimmed = subcategoryIdOrLabel.trim();
  const key = trimmed.toLowerCase().replace(/\s+/g, '-');

  if (SUBCATEGORY_TRANSLATIONS[key]?.[language]) {
    return SUBCATEGORY_TRANSLATIONS[key][language];
  }

  const lower = trimmed.toLowerCase();
  for (const [id, trans] of Object.entries(SUBCATEGORY_TRANSLATIONS)) {
    if (
      id.toLowerCase() === key ||
      trans.fr.toLowerCase() === lower ||
      trans.en.toLowerCase() === lower ||
      trans.ar.toLowerCase() === lower
    ) {
      return trans[language] || subcategoryIdOrLabel;
    }
  }
  return subcategoryIdOrLabel;
}

/**
 * Returns localized color name with whitespace normalization, accent folding, and compound splitting.
 */
export function getLocalizedColor(
  colorName: string,
  language: SupportedLanguage
): string {
  if (!colorName || typeof colorName !== 'string') return '';
  const trimmed = colorName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const direct =
    COLOR_TRANSLATIONS[trimmed] ||
    COLOR_LOOKUP_EXACT.get(trimmed.toLowerCase()) ||
    COLOR_LOOKUP_FOLDED.get(foldColorKey(trimmed));

  if (direct) {
    return direct[language] || trimmed;
  }

  if (language === 'fr') {
    return colorName;
  }

  // Compound color splitting (e.g. "Bleu Marine & Or", "Noir / Camel")
  const tokens = trimmed.split(/\s*(&|\/|\+|,|;|\s-\s|\set\s|\sand\s)\s*/i);
  if (tokens.length > 1) {
    let anyChanged = false;
    const translatedParts: string[] = [];

    for (let i = 0; i < tokens.length; i++) {
      const part = tokens[i];
      if (!part) continue;
      if (i % 2 === 1) {
        const sep = part.trim().toLowerCase();
        if (sep === '&' || sep === '+' || sep === 'et' || sep === 'and') {
          translatedParts.push(language === 'ar' ? ' و' : ' & ');
        } else if (sep === '/') {
          translatedParts.push(' / ');
        } else if (sep === ',') {
          translatedParts.push(language === 'ar' ? '، ' : ', ');
        } else if (sep === ';') {
          translatedParts.push(language === 'ar' ? '؛ ' : '; ');
        } else {
          translatedParts.push(` ${part.trim()} `);
        }
      } else {
        const translatedPart = getLocalizedColor(part, language);
        if (translatedPart !== part.trim()) {
          anyChanged = true;
        }
        translatedParts.push(translatedPart);
      }
    }

    if (anyChanged) {
      return translatedParts.join('').replace(/\s+/g, ' ').trim();
    }
  }

  return colorName;
}

export const FIT_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  'Tailored Fit': {
    fr: 'Tailored Fit',
    en: 'Tailored Fit',
    ar: 'قصة عصرية مضبوطة',
  },
  'Slim Fit': {
    fr: 'Slim Fit',
    en: 'Slim Fit',
    ar: 'قصة ضيقة',
  },
  'Classic Fit': {
    fr: 'Classic Fit',
    en: 'Classic Fit',
    ar: 'قصة كلاسيكية مريحة',
  },
  'Relaxed Fit': {
    fr: 'Relaxed Fit',
    en: 'Relaxed Fit',
    ar: 'قصة واسعة ومريحة',
  },
};

/**
 * Returns localized garment fit label (e.g. 'Slim Fit' -> 'قصة ضيقة').
 */
export function getLocalizedFit(
  fit: string,
  language: SupportedLanguage
): string {
  if (!fit || typeof fit !== 'string') return '';
  const trimmed = fit.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();

  for (const [key, trans] of Object.entries(FIT_TRANSLATIONS)) {
    if (
      key.toLowerCase() === lower ||
      trans.fr.toLowerCase() === lower ||
      trans.en.toLowerCase() === lower ||
      trans.ar.toLowerCase() === lower
    ) {
      return trans[language] || fit;
    }
  }

  return fit;
}

/**
 * Returns localized size name (e.g. 'Taille Unique' -> 'One Size' / 'مقاس موحد', '85 cm' -> '85 سم').
 */
export function getLocalizedSize(
  size: string,
  language: SupportedLanguage
): string {
  if (!size || typeof size !== 'string') return '';
  const trimmed = size.trim();
  const lower = trimmed.toLowerCase();

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

  const cmMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(?:cm|سم)$/iu);
  if (cmMatch) {
    return language === 'ar' ? `${cmMatch[1]} سم` : `${cmMatch[1]} cm`;
  }

  return size;
}

/**
 * Re-export PRODUCT_TRANSLATIONS as CATALOG_TRANSLATIONS for backward compatibility.
 */
export const CATALOG_TRANSLATIONS = PRODUCT_TRANSLATIONS;
