import { getDataStore } from '@/lib/data-provider';
import { ProductsManagementClient } from '@/components/admin/ProductsManagementClient';

export const metadata = {
  title: 'Gestion du Catalogue | VIP TADJ Administration',
  description: 'Gestion des produits, prix et inventaires par taille.',
};

export default async function AdminProductsPage() {
  const store = getDataStore();
  const products = await store.getProducts();

  return <ProductsManagementClient initialProducts={products} />;
}
