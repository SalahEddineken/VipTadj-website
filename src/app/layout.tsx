import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/context/language-context';
import { CartProvider } from '@/lib/context/cart-context';
import { StoreSettingsProvider } from '@/lib/context/store-settings-context';
import { SupportedLanguage } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/locales';
import { getServerLanguage } from '@/app/_utils/server-lang';

const LOCALIZED_KEYWORDS: Record<SupportedLanguage, string[]> = {
  fr: [
    'VIP TADJ',
    'viptadj.store',
    'Mode Homme Algerie',
    'Vêtements Homme Algérie',
    'Prêt à porter homme Alger',
    'Blazer Luxe Homme',
    'Costumes et Vestes Algerie',
    'Souliers Cuir Homme',
    'Sneakers Tendance Algerie',
    'Boutique Homme Algerie',
    'Paiement a la livraison',
    '68 Wilayas',
  ],
  en: [
    'VIP TADJ',
    'viptadj.store',
    'Menswear Algeria',
    'Luxury Men Clothing Algeria',
    'Ready to wear men',
    'Luxury Blazer',
    'Leather Shoes Men',
    'Casual Sneakers',
    'Online Men Fashion Store Algeria',
    'Cash on Delivery',
    '68 Wilayas',
  ],
  ar: [
    'VIP TADJ',
    'viptadj.store',
    'أزياء رجالية الجزائر',
    'ملابس رجالية فاخرة الجزائر',
    'سترات كلاسيكية رجالية',
    'أحذية جلدية رجالية',
    'سنيكرز رجالي كاجوال',
    'متجر ألبسة رجالية بالجزائر',
    'الدفع عند الاستلام',
    '68 ولاية',
  ],
};

const LOCALIZED_AUTHORS: Record<SupportedLanguage, string> = {
  fr: "VIP TADJ Maison d'Élégance Masculine",
  en: 'VIP TADJ House of Masculine Elegance',
  ar: 'دار VIP TADJ للأناقة الرجالية',
};

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLanguage();
  const rawUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://viptadj.store';
  const siteUrl = rawUrl.trim().replace(/^\uFEFF/, '');

  return {
    metadataBase: new URL(siteUrl),
    title: getTranslation(lang, 'meta.site.title', 'VIP TADJ | Haute Élégance Masculine | Algérie'),
    description: getTranslation(
      lang,
      'meta.site.description',
      "Boutique de prêt-à-porter masculin de luxe en Algérie. Vêtements, souliers en cuir et accessoires. Livraison 68 Wilayas avec paiement à la livraison (COD)."
    ),
    keywords: LOCALIZED_KEYWORDS[lang] || LOCALIZED_KEYWORDS.ar,
    authors: [{ name: LOCALIZED_AUTHORS[lang] || LOCALIZED_AUTHORS.ar }],
    alternates: {
      canonical: '/',
      languages: {
        'ar-DZ': '/',
        'fr-DZ': '/',
        'en-US': '/',
      },
    },
    icons: {
      icon: '/images/logo.png',
      shortcut: '/images/logo.png',
      apple: '/images/logo.png',
    },
    openGraph: {
      title: getTranslation(lang, 'meta.og.title', 'VIP TADJ | Haute Élégance Masculine'),
      description: getTranslation(
        lang,
        'meta.og.description',
        "Boutique de prêt-à-porter masculin d'exception en Algérie."
      ),
      url: siteUrl,
      siteName: 'VIP TADJ',
      locale: lang === 'ar' ? 'ar_DZ' : lang === 'fr' ? 'fr_DZ' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/images/logo.png',
          width: 800,
          height: 800,
          alt: 'VIP TADJ | Haute Élégance Masculine',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: getTranslation(lang, 'meta.og.title', 'VIP TADJ | Haute Élégance Masculine'),
      description: getTranslation(
        lang,
        'meta.og.description',
        "Boutique de prêt-à-porter masculin d'exception en Algérie."
      ),
      images: ['/images/logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'shopping',
  };
}

export const viewport: Viewport = {
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialLanguage = getServerLanguage();
  const dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={initialLanguage}
      dir={dir}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/fonts/readex-pro/readex-pro-arabic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/readex-pro/readex-pro-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('vip_tadj_lang')||'${initialLanguage}';document.documentElement.lang=l;document.documentElement.dir=(l==='ar'?'rtl':'ltr');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://viptadj.store/#website',
                  url: 'https://viptadj.store',
                  name: 'VIP TADJ',
                  description: 'Haute Élégance Masculine en Algérie',
                  inLanguage: ['ar-DZ', 'fr-DZ', 'en-US'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://viptadj.store/catalog?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Store',
                  '@id': 'https://viptadj.store/#store',
                  name: 'VIP TADJ',
                  url: 'https://viptadj.store',
                  logo: 'https://viptadj.store/images/logo.png',
                  image: 'https://viptadj.store/images/logo.png',
                  description: 'Boutique de prêt-à-porter masculin de luxe en Algérie. Livraison 58 Wilayas avec paiement à la livraison (COD).',
                  priceRange: '$$',
                  currenciesAccepted: 'DZD',
                  paymentAccepted: 'Cash on Delivery',
                  areaServed: {
                    '@type': 'Country',
                    name: 'Algeria',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-ivory text-obsidian-900 font-sans antialiased flex flex-col selection:bg-gold-500 selection:text-obsidian-950">
        <LanguageProvider initialLanguage={initialLanguage}>
          <StoreSettingsProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </StoreSettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
