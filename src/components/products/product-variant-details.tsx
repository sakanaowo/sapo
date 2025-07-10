import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Variant = {
    variantId: string;
    variantName: string;
    sku: string;
    barcode: string | null;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string | null;
    retailPrice: number;
    wholesalePrice: number;
    importPrice: number;
    taxApplied: boolean;
    fromConversions: any[];
    toConversions: any[];
};

interface ProductVariantDetailsProps {
    variant: Variant;
}

const DetailRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-right">{value}</span>
    </div>
);

const ProductVariantDetails: React.FC<ProductVariantDetailsProps> = ({ variant }) => {
    const formatPrice = (price: number | null | undefined) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
    };

    return (
        <Tabs defaultValue="details" className="h-full">
            <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="details">Thông tin</TabsTrigger>
                <TabsTrigger value="pricing">Giá & Thuế</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="h-full">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-xl">{variant.variantName}</CardTitle>
                        <CardDescription>
                            SKU: {variant.sku} {variant.barcode && `• Barcode: ${variant.barcode}`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative w-full h-48 md:w-48 rounded-md border bg-muted overflow-hidden">
                                {variant.imageUrl ? (
                                    <Image
                                        src={variant.imageUrl}
                                        alt={variant.variantName}
                                        fill
                                        className="object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        Không có hình ảnh
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm">Thông số kỹ thuật</h4>
                                    <div className="space-y-1.5">
                                        <DetailRow label="Khối lượng" value={`${variant.weight} ${variant.weightUnit}`} />
                                        <DetailRow label="Đơn vị tính" value={<Badge variant="outline">{variant.unit}</Badge>} />
                                    </div>
                                </div>

                                {(variant.fromConversions.length > 0 || variant.toConversions.length > 0) && (
                                    <>
                                        <Separator />
                                        <div>
                                            <h4 className="font-semibold mb-2 text-sm">Quy đổi đơn vị</h4>
                                            <div className="space-y-1.5">
                                                {variant.toConversions
                                                    .filter(conv => conv.conversionRate >= 1)
                                                    .map(conv => (
                                                        <DetailRow
                                                            key={conv.conversionId}
                                                            label={`1 ${variant.unit} =`}
                                                            value={`${conv.conversionRate} ${conv.fromVariant.unit}`}
                                                        />
                                                    ))}
                                                {variant.fromConversions
                                                    .filter(conv => (1 / conv.conversionRate) >= 1)
                                                    .map(conv => (
                                                        <DetailRow
                                                            key={conv.conversionId}
                                                            label={`1 ${conv.toVariant.unit} =`}
                                                            value={`${1 / conv.conversionRate} ${variant.unit}`}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="taxApplied" checked={variant.taxApplied} disabled />
                                <Label htmlFor="taxApplied" className="text-sm">
                                    {(variant.taxApplied ? 'Đã áp dụng' : 'Chưa áp dụng') + ' thuế'}
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pricing" className="h-full">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Thông tin giá</CardTitle>
                        <CardDescription>
                            Chi tiết giá bán và giá nhập cho phiên bản này
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg bg-background">
                                    <div className="text-sm text-muted-foreground mb-1">Giá bán lẻ</div>
                                    <div className="text-xl font-bold">{formatPrice(variant.retailPrice)}</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-background">
                                    <div className="text-sm text-muted-foreground mb-1">Giá bán buôn</div>
                                    <div className="text-xl font-bold">{formatPrice(variant.wholesalePrice)}</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-background">
                                    <div className="text-sm text-muted-foreground mb-1">Giá nhập</div>
                                    <div className="text-xl font-bold">{formatPrice(variant.importPrice)}</div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-semibold mb-4 text-sm">Thông tin lợi nhuận</h4>
                                <div className="space-y-3">
                                    <DetailRow
                                        label="Lợi nhuận bán lẻ"
                                        value={formatPrice(variant.retailPrice - variant.importPrice)}
                                    />
                                    <DetailRow
                                        label="Tỷ suất lợi nhuận bán lẻ"
                                        value={`${Math.round((variant.retailPrice - variant.importPrice) / variant.retailPrice * 100)}%`}
                                    />
                                    <DetailRow
                                        label="Lợi nhuận bán buôn"
                                        value={formatPrice(variant.wholesalePrice - variant.importPrice)}
                                    />
                                    <DetailRow
                                        label="Tỷ suất lợi nhuận bán buôn"
                                        value={`${Math.round((variant.wholesalePrice - variant.importPrice) / variant.wholesalePrice * 100)}%`}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default ProductVariantDetails;