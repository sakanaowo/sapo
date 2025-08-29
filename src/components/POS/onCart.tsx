"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";

type Product = {
    id: string;
    productId: string;
    image: string;
    name: string;
    SKU: string;
    unit: string[];
    quantity: number;
    price: number;
    amount: number;
}

type Variant = {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode?: string;
    SKU: string;
    image?: string | null;
}

interface OnCartProps {
    product: Product;
    index: number;
    availableVariants?: Variant[]; // Các variant có sẵn của sản phẩm này
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdateUnit: (currentVariantId: string, newVariantId: string) => void;
    onRemoveProduct: (productId: string) => void;
}

export default function OnCart({
    product,
    index,
    availableVariants = [],
    onUpdateQuantity,
    onUpdateUnit,
    onRemoveProduct
}: OnCartProps) {
    const [inputQuantity, setInputQuantity] = useState(product.quantity.toString());

    useEffect(() => {
        setInputQuantity(product.quantity.toString());
    }, [product.quantity]);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity < 1) return;
        setInputQuantity(newQuantity.toString());
        onUpdateQuantity(product.id, newQuantity);
    };

    const handleInputChange = (value: string) => {
        setInputQuantity(value);
        const num = parseInt(value);
        if (!isNaN(num) && num > 0) {
            onUpdateQuantity(product.id, num);
        }
    };

    const handleInputBlur = () => {
        const num = parseInt(inputQuantity);
        if (isNaN(num) || num < 1) {
            setInputQuantity(product.quantity.toString());
        }
    };

    return (
        <TableRow className="hover:bg-muted/50 border-b">
            {/* STT */}
            <TableCell className="text-center font-medium py-4">
                {index}
            </TableCell>

            {/* Ảnh sản phẩm */}
            <TableCell className="py-4">
                <div className="flex justify-center">
                    <div className="w-12 h-12 flex-shrink-0">
                        <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* SKU */}
            <TableCell className="py-4">
                <p className="text-sm font-mono text-muted-foreground">{product.SKU}</p>
            </TableCell>

            {/* Tên sản phẩm */}
            <TableCell className="py-4">
                <p className="text-sm font-medium line-clamp-2 leading-5" title={product.name}>
                    {product.name}
                </p>
            </TableCell>

            {/* Variant/Đơn vị tính */}
            <TableCell className="py-4">
                <div className="flex justify-center">
                    {availableVariants.length > 1 ? (
                        // Nếu có nhiều variant, hiển thị dropdown để chọn variant
                        <Select
                            value={product.id}
                            onValueChange={(variantId) => onUpdateUnit(product.id, variantId)}
                        >
                            <SelectTrigger className="h-9 min-w-24 text-sm">
                                <SelectValue>
                                    <span className="truncate">
                                        {availableVariants.find(v => v.variantId === product.id)?.unit || product.unit[0]}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {availableVariants.map((variant) => (
                                    <SelectItem key={variant.variantId} value={variant.variantId}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{variant.unit}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        // Nếu chỉ có 1 variant, hiển thị đơn vị cố định (không thể thay đổi)
                        <div className="h-9 px-3 py-2 bg-muted rounded-md flex items-center">
                            <span className="text-sm text-muted-foreground">
                                {product.unit[0]}
                            </span>
                        </div>
                    )}
                </div>
            </TableCell>

            {/* Số lượng */}
            <TableCell className="py-4">
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md"
                        onClick={() => handleQuantityChange(product.quantity - 1)}
                        disabled={product.quantity <= 1}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                        type="text"
                        value={inputQuantity}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onBlur={handleInputBlur}
                        className="h-8 w-16 text-sm text-center px-2 mx-1"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-md"
                        onClick={() => handleQuantityChange(product.quantity + 1)}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </TableCell>

            {/* Đơn giá */}
            <TableCell className="py-4 text-right">
                <p className="text-sm font-medium">
                    {product.price.toLocaleString('vi-VN')}₫
                </p>
            </TableCell>

            {/* Thành tiền */}
            <TableCell className="py-4 text-right">
                <p className="text-sm font-semibold text-primary">
                    {(product.price * product.quantity).toLocaleString('vi-VN')}₫
                </p>
            </TableCell>

            {/* Nút xóa */}
            <TableCell className="py-4">
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => onRemoveProduct(product.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}