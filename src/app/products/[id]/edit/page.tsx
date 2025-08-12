import { getProductById } from '@/actions/product.action'
import EditProductView from '@/components/products/edit/edit-product-view';
import { notFound } from 'next/navigation';
import React from 'react'

async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    try {
        const product = await getProductById(id);
        if (!product) {
            notFound();
        }
        return <EditProductView product={product} />
    } catch (error) {
        console.error("Failed to fetch product:", error);
        notFound();
    }
}

export default EditProductPage