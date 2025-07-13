'use client';

import React, { useState } from 'react';
import ProductDetailHeader from './product-detail-header';
import ProductVariantList from './product-variant-list';
import ProductVariantDetails from './product-variant-details';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Product, Variant } from '../../lib/type/type';


interface ProductDetailViewProps {
    product: Product;
}


const ProductDetailView: React.FC<ProductDetailViewProps> = ({ product }) => {
    const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0]);

    const handleSelectVariant = (variant: Variant): void => {
        setSelectedVariant(variant);
    };

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            <ProductDetailHeader product={product} />

            <Card className="overflow-hidden border shadow-md p-3">
                <CardContent className="p-6 md:p-8">
                    {/* Product header section */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
                            {product.brand && (
                                <Badge variant="outline" className="ml-2 font-medium border-primary/30">{product.brand}</Badge>
                            )}
                            {product.productType && (
                                <Badge variant="secondary" className="ml-1 font-medium">{product.productType}</Badge>
                            )}
                        </div>
                        {product.description && (
                            <p className="text-muted-foreground font-medium">{product.description}</p>
                        )}
                        {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {product.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="bg-primary/10 border-primary/30 text-primary-foreground">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Tabs defaultValue="variants" className="mt-6">
                        <TabsList className="mb-6 bg-muted/70">
                            <TabsTrigger value="variants" className="font-medium">Phiên bản sản phẩm</TabsTrigger>
                            <TabsTrigger value="details" className="font-medium">Thông tin chi tiết</TabsTrigger>
                        </TabsList>
                        <TabsContent value="variants">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <ProductVariantList
                                        variants={product.variants}
                                        selectedVariantId={selectedVariant.variantId}
                                        onSelectVariant={handleSelectVariant}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <ProductVariantDetails variant={selectedVariant} />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="details">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card className="border shadow-sm">
                                        <CardContent className="p-6">
                                            <h3 className="text-lg font-semibold mb-4 text-foreground">Thông tin sản phẩm</h3>
                                            <dl className="space-y-4">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <dt className="font-medium text-muted-foreground">Mã sản phẩm</dt>
                                                    <dd className="col-span-2 font-medium text-foreground">{product.productId}</dd>
                                                </div>
                                                {product.brand && (
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <dt className="font-medium text-muted-foreground">Thương hiệu</dt>
                                                        <dd className="col-span-2 font-medium text-foreground">{product.brand}</dd>
                                                    </div>
                                                )}
                                                {product.productType && (
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <dt className="font-medium text-muted-foreground">Loại sản phẩm</dt>
                                                        <dd className="col-span-2 font-medium text-foreground">{product.productType}</dd>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-3 gap-4">
                                                    <dt className="font-medium text-muted-foreground">Số phiên bản</dt>
                                                    <dd className="col-span-2 font-medium text-foreground">{product.variants.length}</dd>
                                                </div>
                                            </dl>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductDetailView;