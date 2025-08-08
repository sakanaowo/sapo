'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DeleteProductButton from './DeleteProductButton';


interface ProductDetailHeaderProps {
    product: {
        productId: string;
        name: string;
    };
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({ product }) => {

    const router = useRouter();

    return (
        <div className="flex items-center justify-between bg-background py-2">
            <Button variant="ghost" onClick={() => router.push('/products')} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Quay lại danh sách sản phẩm</span>
                <span className="sm:hidden">Quay lại</span>
            </Button>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/products/${product.productId}/edit`)}
                    className="hidden md:flex"
                >
                    <Edit className="mr-2 h-4 w-4" />
                    Sửa sản phẩm
                </Button>
                <DeleteProductButton product={product} />
            </div>
        </div>
    );
};

export default ProductDetailHeader;