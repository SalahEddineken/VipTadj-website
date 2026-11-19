import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getDataStore } from '@/lib/data-provider';
import { ProductsManagementClient } from '@/components/admin/ProductsManagementClient';
import { LANGUAGE_COOKIE_NAME } from '@/lib/context/language-context';
import { getTranslation } from '@/lib/i18n/locales';
import { SupportedLanguage } from '@/lib/i18n/types';
import { Product } from '@/types';

function getServerLanguage(): SupportedLanguage {
  const rawLang = cookies().get(LANGUAGE_COOKIE_NAME)?.value;
  return rawLang === 'en' || rawLang === 'ar' || rawLang === 'fr' ? rawLang : 'ar';
}

export async function generateMetadata(): Promise<Metadata> {
  const lang = getServerLanguage();
  return {
    title: getTranslation(lang, 'admin.meta.products_title', 'Gestion du Catalogue | VIP TADJ Administration'),
    description: getTranslation(lang, 'admin.meta.products_desc', 'Gestion des produits, prix et inventaires par taille.'),
  };
}

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  let products: Product[] = [];
  try {
    const store = getDataStore();
    products = await store.getProducts();
  } catch (error) {
    console.error('[AdminProductsPage SSR] Non-fatal error loading products:', error);
  }

  return <ProductsManagementClient initialProducts={products} />;
}
