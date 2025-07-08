import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, Package, Calendar, DollarSign, Weight, Barcode } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface Inventory {
    inventoryId: string;
    variantId: string;
    initialStock: number;
    currentStock: number;
    minStock: number;
    maxStock: number;
    warehouseLocation: string | null;
    updatedAt: string;
}

interface Variant {
    variantId: string;
    productId: string;
    sku: string;
    barcode: string;
    variantName: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string | null;
    retailPrice: number;
    wholesalePrice: number;
    importPrice: number;
    taxApplied: boolean;
    inputTax: number;
    outputTax: number;
    createdAt: string;
    inventory: Inventory;
}

interface Product {
    productId: string;
    name: string;
    description: string | null;
    brand: string | null;
    productType: string;
    tags: string | null;
    createdAt: string;
    variants: Variant[];
}

interface ProductCardProps {
    product: Product;
    onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString("vi-VN") + " VNĐ";
    };

    const getStockStatus = (stock: number) => {
        if (stock === -1) return { label: "Không giới hạn", variant: "default" as const };
        if (stock === 0) return { label: "Hết hàng", variant: "destructive" as const };
        if (stock < 10) return { label: "Sắp hết", variant: "secondary" as const };
        return { label: "Còn hàng", variant: "default" as const };
    };

    const formatStock = (stock: number) => {
        if (stock === -1) return "Không giới hạn";
        return `${stock} sản phẩm`;
    };

    const handleExpandClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <Card
            className={`w-full transition-all duration-200 ${onClick
                ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                : 'hover:shadow-md'
                }`}
            onClick={onClick}
        >
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl font-semibold">{product.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                                {product.productType}
                            </Badge>
                            {product.brand && (
                                <Badge variant="outline" className="text-xs">
                                    {product.brand}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                        {product.variants.length} phiên bản
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {product.variants.slice(0, isExpanded ? product.variants.length : 1).map((variant, index) => (
                    <div key={variant.variantId}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex gap-6">
                            {/* Product Image */}
                            <div className="flex-shrink-0">
                                <Image
                                    src={variant.imageUrl || "/not-found.png"}
                                    alt={variant.variantName || "Product Image"}
                                    width={120}
                                    height={120}
                                    className="rounded-lg border object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = "/not-found.png";
                                    }}
                                />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-lg">{variant.variantName}</h4>
                                            <Badge {...getStockStatus(variant.inventory.currentStock)} />
                                        </div>

                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4" />
                                                <span>SKU: {variant.sku}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Barcode className="h-4 w-4" />
                                                <span>Barcode: {variant.barcode}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Weight className="h-4 w-4" />
                                                <span>Trọng lượng: {variant.weight}{variant.weightUnit}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>Ngày tạo: {formatDate(variant.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            <span className="text-lg font-semibold text-green-600">
                                                {formatPrice(variant.retailPrice)}
                                            </span>
                                        </div>

                                        <div className="text-sm space-y-1">
                                            <div>
                                                <span className="text-muted-foreground">Tồn kho: </span>
                                                <span className="font-medium">
                                                    {formatStock(variant.inventory.currentStock)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Đơn vị: </span>
                                                <span className="font-medium">{variant.unit}</span>
                                            </div>
                                            {variant.wholesalePrice > 0 && (
                                                <div>
                                                    <span className="text-muted-foreground">Giá sỉ: </span>
                                                    <span className="font-medium">{formatPrice(variant.wholesalePrice)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {product.variants.length > 1 && (
                    <div className="pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={handleExpandClick}
                            className="w-full justify-center gap-2"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="h-4 w-4" />
                                    Thu gọn
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="h-4 w-4" />
                                    Xem thêm {product.variants.length - 1} phiên bản
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}