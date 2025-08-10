import { createSupplier } from '@/actions/supplier.action';
import router from 'next/router';
import { useState } from 'react';
import { toast } from 'sonner';

export const PROVINCES = [
    { code: "HCM", name: "TP. Hồ Chí Minh" },
    { code: "HN", name: "Hà Nội" },
    { code: "DN", name: "Đà Nẵng" },
    { code: "CT", name: "Cần Thơ" },
    { code: "HP", name: "Hải Phòng" },
    { code: "BD", name: "Bình Dương" },
    { code: "DNA", name: "Đồng Nai" },
    { code: "KH", name: "Khánh Hòa" },
    { code: "LDong", name: "Lâm Đồng" },
    { code: "TH", name: "Thanh Hóa" },
];

const DISTRICTS = {
    "HCM": [
        { code: "Q1", name: "Quận 1" },
        { code: "Q3", name: "Quận 3" },
        { code: "Q5", name: "Quận 5" },
        { code: "Q7", name: "Quận 7" },
        { code: "Q10", name: "Quận 10" },
        { code: "TB", name: "Quận Tân Bình" },
        { code: "BT", name: "Quận Bình Thạnh" },
        { code: "PN", name: "Quận Phú Nhuận" },
        { code: "TD", name: "Quận Thủ Đức" },
    ],
    "HN": [
        { code: "HK", name: "Quận Hoàn Kiếm" },
        { code: "BD", name: "Quận Ba Đình" },
        { code: "CG", name: "Quận Cầu Giấy" },
        { code: "DDong", name: "Quận Đống Đa" },
        { code: "HM", name: "Quận Hai Bà Trưng" },
        { code: "TB", name: "Quận Thanh Xuân" },
    ],
    "DN": [
        { code: "HC", name: "Quận Hải Châu" },
        { code: "TK", name: "Quận Thanh Khê" },
        { code: "SK", name: "Quận Sơn Trà" },
        { code: "LC", name: "Quận Liên Chiểu" },
        { code: "NHa", name: "Quận Ngũ Hành Sơn" },
    ],
};

const WARDS = {
    "Q1": [
        { code: "BNghe", name: "Phường Bến Nghé" },
        { code: "BT", name: "Phường Bến Thành" },
        { code: "CML", name: "Phường Cầu Mỗi Lao" },
        { code: "CKL", name: "Phường Cầu Kho" },
        { code: "DK", name: "Phường Đa Kao" },
        { code: "NTB", name: "Phường Nguyễn Thái Bình" },
        { code: "NT", name: "Phường Nguyễn Cư Trinh" },
        { code: "PS", name: "Phường Phạm Ngũ Lão" },
        { code: "TC", name: "Phường Tân Định" },
    ],
    "Q3": [
        { code: "P1", name: "Phường 1" },
        { code: "P2", name: "Phường 2" },
        { code: "P3", name: "Phường 3" },
        { code: "P4", name: "Phường 4" },
        { code: "P5", name: "Phường 5" },
        { code: "P6", name: "Phường 6" },
        { code: "P9", name: "Phường 9" },
        { code: "P10", name: "Phường 10" },
        { code: "P11", name: "Phường 11" },
        { code: "P12", name: "Phường 12" },
        { code: "P13", name: "Phường 13" },
        { code: "P14", name: "Phường 14" },
    ],
    // Có thể thêm các phường/xã khác theo nhu cầu
};

interface SupplierFormData {
    // Thông tin cơ bản
    name: string;
    supplierCode: string;
    phone: string;
    email: string;

    // Địa chỉ chi tiết
    street: string;
    ward: string;
    district: string;
    province: string;

    // Thông tin bổ sung
    taxCode: string;
    website: string;
    description: string;
    status: string;
}

export function useSupplierStore() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<SupplierFormData>({
        name: "",
        supplierCode: "",
        phone: "",
        email: "",
        street: "",
        ward: "",
        district: "",
        province: "",
        taxCode: "",
        website: "",
        description: "",
        status: "ACTIVE",
    });

    const updateFormData = (field: keyof SupplierFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Reset district and ward when province changes
    const handleProvinceChange = (value: string) => {
        updateFormData('province', value);
        updateFormData('district', '');
        updateFormData('ward', '');
    };

    // Reset ward when district changes
    const handleDistrictChange = (value: string) => {
        updateFormData('district', value);
        updateFormData('ward', '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const requiredFields = [
            { field: 'name', message: 'Tên nhà cung cấp không được để trống' },
            { field: 'supplierCode', message: 'Mã nhà cung cấp không được để trống' },
            { field: 'street', message: 'Địa chỉ không được để trống' },
            { field: 'province', message: 'Tỉnh/Thành phố không được để trống' },
        ];

        for (const { field, message } of requiredFields) {
            if (!formData[field as keyof SupplierFormData]?.trim()) {
                toast.error(message);
                return;
            }
        }

        // Email validation
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            toast.error('Định dạng email không hợp lệ');
            return;
        }

        // Phone validation
        if (formData.phone && !/^[\+]?[\d\s\-\(\)]{10,15}$/.test(formData.phone)) {
            toast.error('Định dạng số điện thoại không hợp lệ');
            return;
        }

        setIsSubmitting(true);

        try {
            // Build full address
            const addressParts = [
                formData.street,
                formData.ward && WARDS[formData.district as keyof typeof WARDS]?.find(w => w.code === formData.ward)?.name,
                formData.district && DISTRICTS[formData.province as keyof typeof DISTRICTS]?.find(d => d.code === formData.district)?.name,
                formData.province && PROVINCES.find(p => p.code === formData.province)?.name,
            ].filter(Boolean);

            const fullAddress = addressParts.join(', ');

            const submitData = {
                name: formData.name.trim(),
                supplierCode: formData.supplierCode.trim(),
                phone: formData.phone?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                address: fullAddress,
                taxCode: formData.taxCode?.trim() || undefined,
                website: formData.website?.trim() || undefined,
                status: formData.status as 'ACTIVE' | 'INACTIVE' | 'PENDING',
            };

            const result = await createSupplier(submitData);
            console.log("Supplier created successfully:", result);
            toast.success("Nhà cung cấp đã được tạo thành công!");
            router.push("/products/suppliers");
        } catch (error) {
            console.error("Error creating supplier:", error);
            const errorMessage = error instanceof Error ? error.message : "Tạo nhà cung cấp thất bại";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const availableDistricts = formData.province ? DISTRICTS[formData.province as keyof typeof DISTRICTS] || [] : [];
    const availableWards = formData.district ? WARDS[formData.district as keyof typeof WARDS] || [] : [];


    return {
        formData,
        isSubmitting,
        updateFormData,
        handleProvinceChange,
        handleDistrictChange,
        handleSubmit,
        availableDistricts,
        availableWards
    };
}