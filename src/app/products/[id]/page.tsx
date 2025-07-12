import { getProductById } from '@/actions/product.action'
import ProductDetailView from '@/components/products/product-detail-view';
import { notFound } from 'next/navigation';
import React from 'react'

async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id) {
        notFound();
    }

    try {
        const product = await getProductById(id);
        if (!product) {
            notFound();
        }
        return <ProductDetailView product={product} />
    } catch (error) {
        console.error("Failed to fetch product:", error);
        notFound();
    }
}

export default ProductDetailPage