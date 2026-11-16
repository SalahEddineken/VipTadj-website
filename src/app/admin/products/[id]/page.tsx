import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { ProductForm } from '@/components/admin/ProductForm';
import { Product } from '@/types';

interface EditProductPageProps {
  params: {
    id: string;
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
