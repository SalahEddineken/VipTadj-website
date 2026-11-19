import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ProductForm } from '@/components/admin/ProductForm';
import { LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { getTranslation } from '@/lib/i18n/locales';
import { SupportedLanguage } from '@/lib/i18n/types';

function getServerLanguage(): SupportedLanguage {
  const rawLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'ar';
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLanguage();
  return {
    title: getTranslation(lang, 'admin.meta.product_new_title', 'Nouveau Produit | VIP TADJ Administration'),
    description: getTranslation(
      lang,
      'admin.meta.product_new_desc',
      "Création d'une nouvelle pièce dans le catalogue VIP TADJ."
    ),
  };
}

export default function NewProductPage() {
  return <ProductForm mode="create" />;
}
