'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, X } from 'lucide-react';
import { useEditProductStore } from '@/store/product/edit-product-store';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from 'sonner';

const EditFieldRow: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-sm font-medium text-right max-w-[200px]">
            {children}
        </div>
    </div>
);

const EditProductVariantDetails: React.FC = () => {
    const { formData, updateFormField } = useEditProductStore();
    const [isUploading, setIsUploading] = useState(false);

    const { startUpload } = useUploadThing("postImage", {
        onClientUploadComplete: (res) => {
            setIsUploading(false);
            if (res && res[0]) {
                updateFormField('imageUrl', res[0].url);
                toast.success('Ảnh đã được tải lên thành công!');
            }
        },
        onUploadError: (error: Error) => {
            setIsUploading(false);
            console.error("Error occurred while uploading", error);
            toast.error('Tải ảnh lên thất bại. Vui lòng thử lại.');
        },
        onUploadBegin: () => {
            setIsUploading(true);
        },
    });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            startUpload([file]);
        }
    };

    const handleRemoveImage = () => {
        updateFormField('imageUrl', '');
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
                        <CardTitle className="text-xl">
                            <Input
                                value={formData.variantName}
                                onChange={(e) => updateFormField('variantName', e.target.value)}
                                className="text-xl font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                                placeholder="Tên phiên bản"
                            />
                        </CardTitle>
                        <CardDescription className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span>SKU:</span>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => updateFormField('sku', e.target.value)}
                                    className="h-6 text-sm border-none shadow-none p-1 focus-visible:ring-1"
                                    placeholder="SKU"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Barcode:</span>
                                <Input
                                    value={formData.barcode}
                                    onChange={(e) => updateFormField('barcode', e.target.value)}
                                    className="h-6 text-sm border-none shadow-none p-1 focus-visible:ring-1"
                                    placeholder="Barcode (tùy chọn)"
                                />
                            </div>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="relative w-full h-48 md:w-48 rounded-md border bg-muted overflow-hidden">
                                {formData.imageUrl ? (
                                    <>
                                        <Image
                                            src={formData.imageUrl}
                                            alt={formData.variantName}
                                            fill
                                            className="object-contain"
                                        />
                                        <Button
                                            onClick={handleRemoveImage}
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 w-6 h-6 p-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </>
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
                                        <EditFieldRow label="Khối lượng">
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    value={formData.weight}
                                                    onChange={(e) => updateFormField('weight', Number(e.target.value))}
                                                    className="w-20 h-8 text-sm"
                                                />
                                                <Input
                                                    value={formData.weightUnit}
                                                    onChange={(e) => updateFormField('weightUnit', e.target.value)}
                                                    className="w-16 h-8 text-sm"
                                                    placeholder="kg"
                                                />
                                            </div>
                                        </EditFieldRow>
                                        <EditFieldRow label="Đơn vị tính">
                                            <Input
                                                value={formData.unit}
                                                onChange={(e) => updateFormField('unit', e.target.value)}
                                                className="w-24 h-8 text-sm"
                                                placeholder="cái, kg, ..."
                                            />
                                        </EditFieldRow>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image upload button */}
                        <div className="pt-2">
                            <Label htmlFor="image-upload">
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    disabled={isUploading}
                                    asChild
                                >
                                    <span>
                                        <Upload className="h-4 w-4" />
                                        {isUploading ? 'Đang tải lên...' : 'Đổi ảnh'}
                                    </span>
                                </Button>
                            </Label>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="tax-applied"
                                    checked={formData.taxApplied}
                                    onCheckedChange={(checked) => updateFormField('taxApplied', !!checked)}
                                />
                                <Label htmlFor="tax-applied" className="text-sm font-medium">
                                    Áp dụng thuế
                                </Label>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="pricing" className="h-full">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-lg">Thông tin giá & thuế</CardTitle>
                        <CardDescription>
                            Cập nhật giá bán lẻ, giá bán sỉ và giá nhập
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <EditFieldRow label="Giá bán lẻ">
                                    <Input
                                        type="number"
                                        value={formData.retailPrice || ''}
                                        onChange={(e) => updateFormField('retailPrice', Number(e.target.value) || 0)}
                                        className="w-32 h-8 text-sm text-right"
                                        placeholder="0"
                                    />
                                </EditFieldRow>
                                <EditFieldRow label="Giá bán sỉ">
                                    <Input
                                        type="number"
                                        value={formData.wholesalePrice || ''}
                                        onChange={(e) => updateFormField('wholesalePrice', Number(e.target.value) || 0)}
                                        className="w-32 h-8 text-sm text-right"
                                        placeholder="0"
                                    />
                                </EditFieldRow>
                                <EditFieldRow label="Giá nhập">
                                    <Input
                                        type="number"
                                        value={formData.importPrice || ''}
                                        onChange={(e) => updateFormField('importPrice', Number(e.target.value) || 0)}
                                        className="w-32 h-8 text-sm text-right"
                                        placeholder="0"
                                    />
                                </EditFieldRow>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm">Tính năng</h4>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="tax-applied-pricing"
                                        checked={formData.taxApplied}
                                        onCheckedChange={(checked) => updateFormField('taxApplied', !!checked)}
                                    />
                                    <Label htmlFor="tax-applied-pricing" className="text-sm">
                                        Áp dụng thuế cho sản phẩm này
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

export default EditProductVariantDetails;
