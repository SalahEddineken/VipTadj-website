import { notFound } from 'next/navigation';
import { getDataStore } from '@/lib/data-provider';
import { ProductForm } from '@/components/admin/ProductForm';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const store = getDataStore();
  const product = await store.getProductById(params.id);

  if (!product) {
    notFound();
  }

  return <ProductForm mode="edit" initialData={product} />;
}
