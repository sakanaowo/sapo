import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Image from 'next/image';
import { Variant } from '../../lib/type';

interface ProductVariantListProps {
    variants: Variant[];
    selectedVariantId: string;
    onSelectVariant: (variant: Variant) => void;
}

const formatPrice = (price: number | null | undefined) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};


const ProductVariantList: React.FC<ProductVariantListProps> = ({
    variants,
    selectedVariantId,
    onSelectVariant,
}) => {
    return (
        <Card className="h-full border shadow-sm">
            <CardHeader className="pb-3 border-b">
                <h3 className="text-base font-semibold text-foreground">Các phiên bản ({variants.length})</h3>
            </CardHeader>
            <CardContent className="p-0">
                <ul className="max-h-[500px] overflow-y-auto">
                    {variants.map((variant) => (
                        <li
                            key={variant.variantId}
                            onClick={() => onSelectVariant(variant)}
                            className={cn(
                                'flex items-center gap-3 p-3 cursor-pointer border-b last:border-b-0 transition-colors relative hover:bg-muted/70',
                                selectedVariantId === variant.variantId
                                    ? 'bg-primary/15'
                                    : ''
                            )}
                        >
                            <div className="relative w-12 h-12 rounded-md border bg-background overflow-hidden flex-shrink-0">
                                {variant.imageUrl ? (
                                    <Image
                                        src={variant.imageUrl}
                                        alt={variant.variantName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-medium">
                                        No img
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm truncate text-foreground">{variant.variantName}</p>
                                <p className="text-xs text-muted-foreground font-medium">SKU: {variant.sku}</p>
                                {variant.retailPrice !== undefined && (
                                    <p className="text-xs font-semibold text-foreground">{formatPrice(variant.retailPrice)}</p>
                                )}
                            </div>
                            {selectedVariantId === variant.variantId && (
                                <div className="absolute right-2 top-2">
                                    <Check className="h-4 w-4 text-primary" />
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};
export default ProductVariantList;