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
    'Mode Homme Algerie',
    'Vêtements Homme Algérie',
    'Prêt à porter homme',
    'Blazer Luxe',
    'Souliers Cuir',
    'Paiement a la livraison',
    '68 Wilayas',
  ],
  en: [
    'VIP TADJ',
    'Menswear Algeria',
    'Luxury Men Clothing',
    'Ready to wear men',
    'Luxury Blazer',
    'Leather Shoes',
    'Cash on Delivery',
    '68 Wilayas',
  ],
  ar: [
    'VIP TADJ',
    'أزياء رجالية الجزائر',
    'ملابس رجالية فاخرة',
    'سترات كلاسيكية',
    'أحذية جلدية',
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

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://viptadj-dz.vercel.app'),
    title: getTranslation(lang, 'meta.site.title', 'VIP TADJ | Haute Élégance Masculine | Algérie'),
    description: getTranslation(
      lang,
      'meta.site.description',
      "Boutique de prêt-à-porter masculin de luxe en Algérie. Vêtements, souliers en cuir et accessoires. Livraison 68 Wilayas avec paiement à la livraison (COD)."
    ),
    keywords: LOCALIZED_KEYWORDS[lang] || LOCALIZED_KEYWORDS.ar,
    authors: [{ name: LOCALIZED_AUTHORS[lang] || LOCALIZED_AUTHORS.ar }],
    openGraph: {
      title: getTranslation(lang, 'meta.og.title', 'VIP TADJ | Haute Élégance Masculine'),
      description: getTranslation(
        lang,
        'meta.og.description',
        "Boutique de prêt-à-porter masculin d'exception en Algérie."
      ),
      url: 'https://viptadj-dz.vercel.app',
      siteName: 'VIP TADJ',
      locale: lang === 'ar' ? 'ar_DZ' : lang === 'fr' ? 'fr_DZ' : 'en_US',
      type: 'website',
    },
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
