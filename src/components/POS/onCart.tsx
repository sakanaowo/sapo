"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";

type Product = {
    id: string;
    image: string;
    name: string;
    SKU: string;
    unit: string[];
    quantity: number;
    price: number;
    amount: number;
}

interface OnCartProps {
    product: Product;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onUpdateUnit: (productId: string, unit: string) => void;
    onRemoveProduct: (productId: string) => void;
}

export default function OnCart({
    product,
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
        <Card className="mb-3">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    {/* Ảnh sản phẩm */}
                    <div className="w-16 h-16 flex-shrink-0">
                        <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                    No Image
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-12 gap-3 items-center">
                            {/* Mã SKU */}
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">SKU</p>
                                <p className="text-sm font-mono">{product.SKU}</p>
                            </div>

                            {/* Tên sản phẩm */}
                            <div className="col-span-3">
                                <p className="text-xs text-muted-foreground mb-1">Sản phẩm</p>
                                <p className="text-sm font-medium line-clamp-2" title={product.name}>
                                    {product.name}
                                </p>
                            </div>

                            {/* Đơn vị tính */}
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">Đơn vị</p>
                                <Select
                                    value={product.unit[0]}
                                    onValueChange={(value) => onUpdateUnit(product.id, value)}
                                >
                                    <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {product.unit.map((unit) => (
                                            <SelectItem key={unit} value={unit}>
                                                {unit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Số lượng */}
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">Số lượng</p>
                                <div className="flex items-center gap-0.5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
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
                                        className="h-8 w-16 text-sm text-center px-2"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => handleQuantityChange(product.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            {/* Đơn giá */}
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">Đơn giá</p>
                                <p className="text-sm font-medium">
                                    {product.price.toLocaleString('vi-VN')}₫
                                </p>
                            </div>

                            {/* Thành tiền */}
                            <div className="col-span-1">
                                <p className="text-xs text-muted-foreground mb-1">Thành tiền</p>
                                <p className="text-sm font-semibold text-primary">
                                    {(product.price * product.quantity).toLocaleString('vi-VN')}₫
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Nút xóa */}
                    <div className="flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemoveProduct(product.id)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}