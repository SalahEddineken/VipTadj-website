import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Tajawal, Amiri } from 'next/font/google';
import './globals.css';
import { LanguageProvider, LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { SupportedLanguage } from '@/lib/i18n/types';

const playfair = { variable: 'font-serif' };
const jakarta = { variable: 'font-sans' };
const cinzel = { variable: 'font-cinzel' };

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-arabic-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VIP TADJ | Haute Élégance Masculine | Alger',
  description:
    "Maison de couture et boutique de prêt-à-porter masculin de luxe en Algérie. Costumes sur-mesure, blazers raffinés, souliers en cuir artisanal et accessoires d'exception. Livraison express 58 Wilayas avec paiement à la livraison (COD).",
  keywords: [
    'VIP TADJ',
    'Mode Homme Algerie',
    'Costume Homme Alger',
    'Blazer Luxe',
    'Souliers Cuir',
    'Kiabi dz',
    'Zara Homme',
    'Paiement a la livraison',
    '58 Wilayas',
  ],
  authors: [{ name: 'VIP TADJ Maison de Couture' }],
  openGraph: {
    title: 'VIP TADJ | Haute Élégance Masculine',
    description: "Boutique de prêt-à-porter masculin d'exception en Algérie.",
    url: 'https://viptadj.dz',
    siteName: 'VIP TADJ',
    locale: 'fr_DZ',
    type: 'website',
  },
};

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
  const cookieStore = cookies();
  const rawLang = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value;
  const initialLanguage: SupportedLanguage =
    rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'fr';
  const dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={initialLanguage}
      dir={dir}
      suppressHydrationWarning
      className={`${jakarta.variable} ${playfair.variable} ${cinzel.variable} ${tajawal.variable} ${amiri.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var l=localStorage.getItem('vip_tadj_lang')||'${initialLanguage}';document.documentElement.lang=l;document.documentElement.dir=(l==='ar'?'rtl':'ltr');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-ivory text-obsidian-900 font-sans antialiased flex flex-col selection:bg-gold-500 selection:text-obsidian-950">
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
