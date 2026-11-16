import { getDataStore } from '@/lib/data-provider';
import { ProductsManagementClient } from '@/components/admin/ProductsManagementClient';
import { Product } from '@/types';

export const metadata = {
  title: 'Gestion du Catalogue | VIP TADJ Administration',
  description: 'Gestion des produits, prix et inventaires par taille.',
};

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
