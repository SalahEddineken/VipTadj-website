import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { ProductForm } from '@/components/admin/ProductForm';
import { LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { getTranslation, formatTranslation } from '@/lib/i18n/locales';
import { getLocalizedProduct } from '@/lib/i18n/catalog-translations';
import { SupportedLanguage } from '@/lib/i18n/types';
import { Product } from '@/types';

function getServerLanguage(): SupportedLanguage {
  const rawLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'ar';
}

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  const lang = getServerLanguage();
  let product: Product | null = null;
  try {
    const store = getDataStore();
    product = await store.getProductById(params.id);
  } catch {
    product = null;
  }

  if (!product) {
    return {
      title: getTranslation(
        lang,
        'admin.meta.product_not_found_title',
        'Produit introuvable | VIP TADJ Administration'
      ),
    };
  }

  const localizedTitle = getLocalizedProduct(product, lang).title;
  return {
    title: formatTranslation(
      getTranslation(lang, 'admin.meta.product_edit_title', 'Éditer {title} | VIP TADJ Administration'),
      { title: localizedTitle }
    ),
    description: formatTranslation(
      getTranslation(
        lang,
        'admin.meta.product_edit_desc',
        'Modification des informations, prix et stocks de {title}.'
      ),
      { title: localizedTitle }
    ),
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  let product: Product | null = null;
  try {
    const store = getDataStore();
    product = await store.getProductById(params.id);
  } catch (error) {
    console.error('[EditProductPage SSR] Non-fatal error loading product:', error);
  }

  if (!product) {
    notFound();
  }

  return <ProductForm mode="edit" initialData={product} />;
}
