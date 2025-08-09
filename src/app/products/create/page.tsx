"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { useCreateProductStore } from "@/store/product/create-product-store";
import { useEffect, useState } from "react";
import { addOneProduct } from "@/actions/product.action";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

export default function CreateProductPage() {
    const router = useRouter();

    const {
        formData,
        isSubmitting,
        updateFormData,
        addUnitConversion,
        updateUnitConversion,
        removeUnitConversion,
        addTag,
        removeTag,
        setSubmitting,
        resetForm,
        syncInitialAndCurrentStock,
    } = useCreateProductStore();

    // Reset form when component unmounts
    useEffect(() => {
        return () => {
            resetForm();
        };
    }, [resetForm]);

    const [imageUrl, setImageUrl] = useState("");
    const [newTag, setNewTag] = useState("");

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            addTag(newTag.trim());
            setNewTag("");
        }
    };

    const handleTagKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation trước khi submit
        const requiredFields = [
            { field: 'name', message: 'Tên sản phẩm không được để trống' },
            { field: 'sku', message: 'Mã SKU không được để trống' },
        ];

        for (const { field, message } of requiredFields) {
            if (!formData[field as keyof typeof formData] ||
                String(formData[field as keyof typeof formData]).trim() === '') {
                toast.error(message);
                return;
            }
        }

        if (formData.retailPrice <= 0) {
            toast.error('Giá bán lẻ phải lớn hơn 0');
            return;
        }

        // Validate unit conversions
        const invalidConversions = formData.unitConversions.some(conv =>
            !conv.unit.trim() || conv.conversionRate <= 0
        );
        if (invalidConversions) {
            toast.error("Đơn vị quy đổi không hợp lệ");
            return;
        }

        setSubmitting(true);

        try {
            // Prepare data for submission
            const submitData = {
                ...formData,
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                barcode: formData.barcode?.trim() || undefined,
                brand: formData.brand?.trim() || '',
                unit: formData.unit?.trim() || '',
                warehouseLocation: formData.warehouseLocation?.trim() || '',
                // Filter out empty conversions
                unitConversions: formData.unitConversions.filter(conv =>
                    conv.unit.trim() && conv.conversionRate > 0
                ),
            };

            const res = await addOneProduct(submitData);
            console.log("Product created successfully:", res);
            toast.success("Tạo sản phẩm thành công!");
            resetForm();
            router.push("/products");
        } catch (error) {
            console.error("Error creating product:", error);
            const errorMessage = error instanceof Error ? error.message : "Tạo sản phẩm thất bại";
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/products">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-semibold">Thêm sản phẩm</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/products">
                            <Button
                                variant="outline"
                                size="sm"
                            >
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                "Thêm sản phẩm"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-4">
                <div className="container mx-auto p-4 max-w-6xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Left Column - Main Info */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Thông tin chung & Variant */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-white border-b border-blue-100">
                                    <CardTitle className="text-lg text-gray-900">Thông tin sản phẩm</CardTitle>
                                </CardHeader>
                                <CardContent className="bg-white">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Tên sản phẩm *</Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => updateFormData('name', e.target.value)}
                                                placeholder="Nhập tên sản phẩm"
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-sm font-medium text-gray-700">Tags</Label>
                                            <div className="mt-1 space-y-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newTag}
                                                        onChange={(e) => setNewTag(e.target.value)}
                                                        onKeyPress={handleTagKeyPress}
                                                        placeholder="Nhập tag và nhấn Enter"
                                                        className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleAddTag}
                                                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                {formData.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.tags.map((tag, index) => (
                                                            <div
                                                                key={index}
                                                                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                                                            >
                                                                {tag}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeTag(index)}
                                                                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="sku" className="text-sm font-medium text-gray-700">Mã SKU *</Label>
                                            <Input
                                                id="sku"
                                                value={formData.sku}
                                                onChange={(e) => updateFormData('sku', e.target.value)}
                                                placeholder="Nhập mã SKU"
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="barcode" className="text-sm font-medium text-gray-700">Barcode</Label>
                                            <Input
                                                id="barcode"
                                                value={formData.barcode}
                                                onChange={(e) => updateFormData('barcode', e.target.value)}
                                                placeholder="Nhập barcode"
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="unit" className="text-sm font-medium text-gray-700">Đơn vị tính</Label>
                                            <Input
                                                id="unit"
                                                value={formData.unit}
                                                onChange={(e) => updateFormData('unit', e.target.value)}
                                                placeholder="VD: cái, hộp, kg..."
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="weight" className="text-sm font-medium text-gray-700">Trọng lượng</Label>
                                            <div className="flex gap-2 mt-1">
                                                <Input
                                                    id="weight"
                                                    type="number"
                                                    value={formData.weight}
                                                    onChange={(e) => updateFormData('weight', parseFloat(e.target.value) || 0)}
                                                    placeholder="0"
                                                    className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                                />
                                                <select
                                                    value={formData.weightUnit}
                                                    onChange={(e) => updateFormData('weightUnit', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500/20"
                                                >
                                                    <option value="g">g</option>
                                                    <option value="kg">kg</option>
                                                    <option value="ml">ml</option>
                                                    <option value="l">l</option>
                                                    <option value="oz">oz</option>
                                                    <option value="lb">lb</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="productType" className="text-sm font-medium text-gray-700">Loại sản phẩm</Label>
                                            <select
                                                id="productType"
                                                value={formData.productType}
                                                onChange={(e) => updateFormData('productType', e.target.value)}
                                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500/20"
                                            >
                                                <option value="standard">Sản phẩm thường</option>
                                                <option value="service">Dịch vụ</option>
                                                <option value="combo">Combo</option>
                                                <option value="digital">Sản phẩm số</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <Label htmlFor="description" className="text-sm font-medium text-gray-700">Mô tả</Label>
                                            <Textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => updateFormData('description', e.target.value)}
                                                placeholder="Nhập mô tả sản phẩm"
                                                rows={2}
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Giá sản phẩm */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-white border-b border-green-100">
                                    <CardTitle className="text-lg text-gray-900">Giá sản phẩm</CardTitle>
                                </CardHeader>
                                <CardContent className="bg-white">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="retailPrice" className="text-sm font-medium text-gray-700">Giá bán lẻ *</Label>
                                            <Input
                                                id="retailPrice"
                                                type="number"
                                                value={formData.retailPrice}
                                                onChange={(e) => updateFormData('retailPrice', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="importPrice" className="text-sm font-medium text-gray-700">Giá nhập</Label>
                                            <Input
                                                id="importPrice"
                                                type="number"
                                                value={formData.importPrice}
                                                onChange={(e) => updateFormData('importPrice', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="wholesalePrice" className="text-sm font-medium text-gray-700">Giá buôn</Label>
                                            <Input
                                                id="wholesalePrice"
                                                type="number"
                                                value={formData.wholesalePrice}
                                                onChange={(e) => updateFormData('wholesalePrice', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Đơn vị quy đổi */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-purple-50/50 to-white border-b border-purple-100">
                                    <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
                                        Đơn vị quy đổi
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addUnitConversion}
                                            className="h-8 border-purple-300 text-purple-700 hover:bg-purple-50"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Thêm
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="bg-white">
                                    {formData.unitConversions.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p className="text-sm">Chưa có đơn vị quy đổi nào</p>
                                            <p className="text-xs text-gray-400 mt-1">Nhấn &quot;Thêm&quot; để tạo đơn vị quy đổi</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {formData.unitConversions.map((conversion, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50/80 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex-1">
                                                        <Input
                                                            type="text"
                                                            value={conversion.unit}
                                                            onChange={(e) => updateUnitConversion(index, 'unit', e.target.value)}
                                                            placeholder="VD: thùng, lốc..."
                                                            className="h-8 border-gray-300 bg-white"
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-500 mx-2">=</span>
                                                    <div className="w-24">
                                                        <Input
                                                            type="number"
                                                            value={conversion.conversionRate}
                                                            onChange={(e) => updateUnitConversion(index, 'conversionRate', parseFloat(e.target.value) || 1)}
                                                            placeholder="1"
                                                            className="h-8 border-gray-300 bg-white"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeUnitConversion(index)}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Additional Info */}
                        <div className="space-y-4">
                            {/* Ảnh sản phẩm với UploadThing */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50/50 to-white border-b border-blue-100">
                                    <CardTitle className="text-lg text-gray-900">Ảnh sản phẩm</CardTitle>
                                </CardHeader>
                                <CardContent className="bg-white p-4">
                                    <ImageUpload
                                        value={imageUrl}
                                        onChange={(url) => {
                                            setImageUrl(url);
                                            updateFormData('imageUrl', url);
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {/* Purchase Order Options */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-green-50/50 to-white border-b border-green-100">
                                    <CardTitle className="text-lg text-gray-900">Đơn nhập hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 bg-white">
                                    <div className="flex items-center justify-between p-3 bg-gray-50/80 border border-gray-200 rounded-lg">
                                        <div>
                                            <Label className="text-sm font-medium text-gray-900">Tạo đơn nhập hàng</Label>
                                            <p className="text-xs text-gray-600">Tự động tạo đơn nhập khi có tồn kho ban đầu</p>
                                        </div>
                                        <Switch
                                            checked={formData.createPurchaseOrder}
                                            onCheckedChange={(checked) => updateFormData('createPurchaseOrder', checked)}
                                        />
                                    </div>

                                    {formData.createPurchaseOrder && (
                                        <div>
                                            <Label htmlFor="supplierId" className="text-sm font-medium text-gray-700">Nhà cung cấp</Label>
                                            <Input
                                                id="supplierId"
                                                value={formData.supplierId || ''}
                                                onChange={(e) => updateFormData('supplierId', e.target.value)}
                                                placeholder="ID nhà cung cấp"
                                                className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                                            />
                                            {/* TODO: show list of supplier or create new if not exist */}
                                            <p className="text-xs text-gray-500 mt-1">
                                                Nhập ID nhà cung cấp để tạo đơn nhập hàng tự động
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Kho hàng */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-orange-50/50 to-white border-b border-orange-100">
                                    <CardTitle className="text-lg text-gray-900">Kho hàng</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 bg-white">
                                    <div>
                                        <Label htmlFor="initialStock" className="text-sm font-medium text-gray-700">Tồn kho ban đầu</Label>
                                        <Input
                                            id="initialStock"
                                            type="number"
                                            value={formData.initialStock}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value) || 0;
                                                syncInitialAndCurrentStock(value);
                                            }}
                                            placeholder="0"
                                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label htmlFor="minStock" className="text-sm font-medium text-gray-700">Tối thiểu</Label>
                                            <Input
                                                id="minStock"
                                                type="number"
                                                value={formData.minStock}
                                                onChange={(e) => updateFormData('minStock', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="maxStock" className="text-sm font-medium text-gray-700">Tối đa</Label>
                                            <Input
                                                id="maxStock"
                                                type="number"
                                                value={formData.maxStock}
                                                onChange={(e) => updateFormData('maxStock', parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="warehouseLocation" className="text-sm font-medium text-gray-700">Vị trí trong kho</Label>
                                        <Input
                                            id="warehouseLocation"
                                            value={formData.warehouseLocation}
                                            onChange={(e) => updateFormData('warehouseLocation', e.target.value)}
                                            placeholder="VD: Kho A - Kệ 1"
                                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500/20"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Thông tin bổ sung & Trạng thái */}
                            <Card className="bg-white shadow-sm border border-gray-200/80 hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50/50 to-white border-b border-indigo-100">
                                    <CardTitle className="text-lg text-gray-900">Cài đặt</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 bg-white">
                                    <div>
                                        <Label htmlFor="brand" className="text-sm font-medium text-gray-700">Nhãn hiệu</Label>
                                        <Input
                                            id="brand"
                                            value={formData.brand}
                                            onChange={(e) => updateFormData('brand', e.target.value)}
                                            placeholder="Tên nhãn hiệu"
                                            className="mt-1 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-gray-50/80 border border-gray-200 rounded-lg">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-900">Cho phép bán</Label>
                                                <p className="text-xs text-gray-600">Bật để cho phép bán</p>
                                            </div>
                                            <Switch
                                                checked={formData.allowSale}
                                                onCheckedChange={(checked) => updateFormData('allowSale', checked)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-gray-50/80 border border-gray-200 rounded-lg">
                                            <div>
                                                <Label className="text-sm font-medium text-gray-900">Áp thuế</Label>
                                                <p className="text-xs text-gray-600">Bật để áp thuế</p>
                                            </div>
                                            <Switch
                                                checked={formData.taxApplied}
                                                onCheckedChange={(checked) => updateFormData('taxApplied', checked)}
                                            />
                                        </div>

                                        {formData.taxApplied && (
                                            <div className="grid grid-cols-2 gap-2 pt-2 p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
                                                <div>
                                                    <Label htmlFor="inputTax" className="text-xs font-medium text-gray-700">Thuế đầu vào (%)</Label>
                                                    <Input
                                                        id="inputTax"
                                                        type="number"
                                                        value={formData.inputTax}
                                                        onChange={(e) => updateFormData('inputTax', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                        className="mt-1 h-8 text-xs border-gray-300"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="outputTax" className="text-xs font-medium text-gray-700">Thuế đầu ra (%)</Label>
                                                    <Input
                                                        id="outputTax"
                                                        type="number"
                                                        value={formData.outputTax}
                                                        onChange={(e) => updateFormData('outputTax', parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                        className="mt-1 h-8 text-xs border-gray-300"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}