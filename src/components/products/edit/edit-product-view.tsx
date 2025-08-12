'use client';

import React, { useEffect } from 'react';
import { useEditProductStore } from '@/store/product/edit-product-store';
import EditProductHeader from './edit-product-header';
import EditProductVariantList from './edit-product-variant-list';
import EditProductVariantDetails from './edit-product-variant-details';
import EditProductUnsavedWarning from './edit-product-unsaved-warning';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Product } from '../../../lib/type/type';

interface EditProductViewProps {
    product: Product;
}

const EditProductView: React.FC<EditProductViewProps> = ({ product }) => {
    const {
        setProduct,
        selectedVariantId,
        formData,
        updateFormField,
    } = useEditProductStore();

    useEffect(() => {
        setProduct(product);
    }, [product, setProduct]);

    const selectedVariant = product.variants.find(v => v.variantId === selectedVariantId);

    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-6">
            <EditProductHeader />
            <EditProductUnsavedWarning />

            <Card className="overflow-hidden border shadow-md p-3">
                <CardContent className="p-6 md:p-8">
                    {/* Product header section */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => updateFormField('name', e.target.value)}
                                className="text-2xl font-bold tracking-tight text-foreground bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
                                placeholder="Tên sản phẩm"
                            />
                            {formData.brand && (
                                <Badge variant="outline" className="ml-2 font-medium border-primary/30">
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => updateFormField('brand', e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm"
                                        placeholder="Thương hiệu"
                                    />
                                </Badge>
                            )}
                            {formData.productType && (
                                <Badge variant="secondary" className="ml-1 font-medium">
                                    <input
                                        type="text"
                                        value={formData.productType}
                                        onChange={(e) => updateFormField('productType', e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm"
                                        placeholder="Loại sản phẩm"
                                    />
                                </Badge>
                            )}
                        </div>
                        <textarea
                            value={formData.description}
                            onChange={(e) => updateFormField('description', e.target.value)}
                            className="text-muted-foreground font-medium bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 py-1 resize-none"
                            placeholder="Mô tả sản phẩm"
                            rows={2}
                        />
                        {formData.tags && formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.tags.map((tag, index) => (
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
                                    <EditProductVariantList
                                        variants={product.variants}
                                        selectedVariantId={selectedVariantId || ''}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    {selectedVariant && (
                                        <EditProductVariantDetails />
                                    )}
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
                                                <div className="grid grid-cols-3 gap-4">
                                                    <dt className="font-medium text-muted-foreground">Thương hiệu</dt>
                                                    <dd className="col-span-2">
                                                        <input
                                                            type="text"
                                                            value={formData.brand}
                                                            onChange={(e) => updateFormField('brand', e.target.value)}
                                                            className="font-medium text-foreground bg-transparent border border-muted rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary/20"
                                                            placeholder="Thương hiệu"
                                                        />
                                                    </dd>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <dt className="font-medium text-muted-foreground">Loại sản phẩm</dt>
                                                    <dd className="col-span-2">
                                                        <input
                                                            type="text"
                                                            value={formData.productType}
                                                            onChange={(e) => updateFormField('productType', e.target.value)}
                                                            className="font-medium text-foreground bg-transparent border border-muted rounded px-2 py-1 w-full focus:ring-2 focus:ring-primary/20"
                                                            placeholder="Loại sản phẩm"
                                                        />
                                                    </dd>
                                                </div>
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

export default EditProductView;
