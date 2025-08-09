"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Building2, MapPin, Phone, Mail, Globe, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupplierStore, PROVINCES } from "@/store/product/supplier-store";


export default function CreateSupplierPage() {
    const router = useRouter();
    const {
        formData,
        isSubmitting,
        updateFormData,
        handleProvinceChange,
        handleDistrictChange,
        handleSubmit,
        availableDistricts,
        availableWards
    } = useSupplierStore();

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/products/suppliers">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                            </Button>
                        </Link>
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h1 className="text-xl font-semibold">Thêm nhà cung cấp</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push("/products/suppliers")}>
                            Hủy
                        </Button>
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
                                "Tạo nhà cung cấp"
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-6">
                <div className="container mx-auto p-6 max-w-4xl">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Thông tin cơ bản */}
                        <div className="space-y-6">
                            {/* Thông tin nhà cung cấp */}
                            <Card className="bg-white shadow-sm border border-gray-200/80">
                                <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-white border-b border-blue-100">
                                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        Thông tin nhà cung cấp
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                            Tên nhà cung cấp *
                                        </Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => updateFormData('name', e.target.value)}
                                            placeholder="Nhập tên nhà cung cấp"
                                            className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="supplierCode" className="text-sm font-medium text-gray-700">
                                            Mã nhà cung cấp *
                                        </Label>
                                        <Input
                                            id="supplierCode"
                                            value={formData.supplierCode}
                                            onChange={(e) => updateFormData('supplierCode', e.target.value)}
                                            placeholder="VD: SUP001, NCC-ABC"
                                            className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                                <Phone className="h-4 w-4 inline mr-1" />
                                                Số điện thoại
                                            </Label>
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => updateFormData('phone', e.target.value)}
                                                placeholder="0123456789"
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                <Mail className="h-4 w-4 inline mr-1" />
                                                Email
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateFormData('email', e.target.value)}
                                                placeholder="example@company.com"
                                                className="mt-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                                            Trạng thái
                                        </Label>
                                        <Select value={formData.status} onValueChange={(value) => updateFormData('status', value)}>
                                            <SelectTrigger className="mt-1 border-gray-300 focus:border-blue-500">
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                                                <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                                                <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Thông tin bổ sung */}
                            <Card className="bg-white shadow-sm border border-gray-200/80">
                                <CardHeader className="pb-4 bg-gradient-to-r from-purple-50/50 to-white border-b border-purple-100">
                                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                        <Receipt className="h-5 w-5 text-purple-600" />
                                        Thông tin bổ sung
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <Label htmlFor="taxCode" className="text-sm font-medium text-gray-700">
                                            Mã số thuế
                                        </Label>
                                        <Input
                                            id="taxCode"
                                            value={formData.taxCode}
                                            onChange={(e) => updateFormData('taxCode', e.target.value)}
                                            placeholder="0123456789"
                                            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                                            <Globe className="h-4 w-4 inline mr-1" />
                                            Website
                                        </Label>
                                        <Input
                                            id="website"
                                            value={formData.website}
                                            onChange={(e) => updateFormData('website', e.target.value)}
                                            placeholder="https://company.com"
                                            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                            Mô tả
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => updateFormData('description', e.target.value)}
                                            placeholder="Mô tả về nhà cung cấp..."
                                            rows={3}
                                            className="mt-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500/20"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Địa chỉ */}
                        <div className="space-y-6">
                            <Card className="bg-white shadow-sm border border-gray-200/80">
                                <CardHeader className="pb-4 bg-gradient-to-r from-green-50/50 to-white border-b border-green-100">
                                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-green-600" />
                                        Địa chỉ
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                                            Địa chỉ cụ thể *
                                        </Label>
                                        <Input
                                            id="street"
                                            value={formData.street}
                                            onChange={(e) => updateFormData('street', e.target.value)}
                                            placeholder="Số nhà, tên đường..."
                                            className="mt-1 border-gray-300 focus:border-green-500 focus:ring-green-500/20"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="province" className="text-sm font-medium text-gray-700">
                                            Tỉnh/Thành phố *
                                        </Label>
                                        <Select value={formData.province} onValueChange={handleProvinceChange}>
                                            <SelectTrigger className="mt-1 border-gray-300 focus:border-green-500">
                                                <SelectValue placeholder="Chọn tỉnh/thành phố" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROVINCES.map((province) => (
                                                    <SelectItem key={province.code} value={province.code}>
                                                        {province.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="district" className="text-sm font-medium text-gray-700">
                                            Quận/Huyện
                                        </Label>
                                        <Select
                                            value={formData.district}
                                            onValueChange={handleDistrictChange}
                                            disabled={!formData.province}
                                        >
                                            <SelectTrigger className="mt-1 border-gray-300 focus:border-green-500">
                                                <SelectValue placeholder="Chọn quận/huyện" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableDistricts.map((district) => (
                                                    <SelectItem key={district.code} value={district.code}>
                                                        {district.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="ward" className="text-sm font-medium text-gray-700">
                                            Phường/Xã
                                        </Label>
                                        <Select
                                            value={formData.ward}
                                            onValueChange={(value) => updateFormData('ward', value)}
                                            disabled={!formData.district}
                                        >
                                            <SelectTrigger className="mt-1 border-gray-300 focus:border-green-500">
                                                <SelectValue placeholder="Chọn phường/xã" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableWards.map((ward) => (
                                                    <SelectItem key={ward.code} value={ward.code}>
                                                        {ward.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Preview địa chỉ đầy đủ */}
                                    {(formData.street || formData.province) && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                                            <Label className="text-sm font-medium text-gray-700">Địa chỉ đầy đủ:</Label>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {[
                                                    formData.street,
                                                    formData.ward && availableWards.find(w => w.code === formData.ward)?.name,
                                                    formData.district && availableDistricts.find(d => d.code === formData.district)?.name,
                                                    formData.province && PROVINCES.find(p => p.code === formData.province)?.name,
                                                ].filter(Boolean).join(', ') || 'Chưa đầy đủ thông tin'}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
