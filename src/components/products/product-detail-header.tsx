'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Trash2, Edit, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface ProductDetailHeaderProps {
    product: {
        productId: string;
        name: string;
    };
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({ product }) => {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}" không?`)) {
            // Add your delete logic here, e.g., calling a server action
            console.log(`Deleting product ${product.productId}`);
            // await deleteProductAction(product.productId);
            // router.push('/products');
            alert('Chức năng xóa chưa được triển khai.');
        }
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(product.productId);
        alert('Đã sao chép mã sản phẩm vào clipboard!');
    };

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => router.push(`/products/${product.productId}/edit`)} className="md:hidden">
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Sửa sản phẩm</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCopyId}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Sao chép mã sản phẩm</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Xóa sản phẩm</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default ProductDetailHeader;