import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface UnitConversion {
    unit: string;
    conversionRate: number;
}

export interface ProductFormData {
    // Thông tin Product
    name: string;
    description: string;
    brand: string;
    productType: string;
    tags: string[];

    // Thông tin ProductVariant
    sku: string;
    barcode: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string; // UploadThing URL

    // Giá sản phẩm
    retailPrice: number;
    importPrice: number;
    wholesalePrice: number;

    // Inventory settings (không có initialStock/currentStock)
    minStock: number;
    maxStock: number;
    warehouseLocation: string;

    // Đơn vị quy đổi
    unitConversions: UnitConversion[];

    // Trạng thái
    allowSale: boolean;
    taxApplied: boolean;
    inputTax: number;
    outputTax: number;

    // Purchase Order - bắt buộc
    supplierCode: string;         // Mã nhà cung cấp - bắt buộc
    importQuantity: number;       // Số lượng nhập lần đầu
    note: string;                // Ghi chú cho đơn nhập
}

export interface CreateProductStore {
    // State
    formData: ProductFormData;
    isSubmitting: boolean;

    // Actions
    updateFormData: (field: keyof ProductFormData, value: unknown) => void;
    updateFormDataBatch: (updates: Partial<ProductFormData>) => void;

    // Unit conversion actions
    addUnitConversion: () => void;
    updateUnitConversion: (index: number, field: keyof UnitConversion, value: string | number) => void;
    removeUnitConversion: (index: number) => void;

    // Tag actions
    addTag: (tag: string) => void;
    removeTag: (index: number) => void;

    // Form actions
    setSubmitting: (isSubmitting: boolean) => void;
    resetForm: () => void;
}

const initialFormData: ProductFormData = {
    name: "",
    description: "",
    brand: "",
    productType: "standard",
    tags: [],
    sku: "",
    barcode: "",
    weight: 0,
    weightUnit: "g",
    unit: "",
    imageUrl: "", // UploadThing URL sẽ được set từ component
    retailPrice: 0,
    importPrice: 0,
    wholesalePrice: 0,
    minStock: 0,
    maxStock: 0,
    warehouseLocation: "",
    unitConversions: [],
    allowSale: true,
    taxApplied: false,
    inputTax: 0,
    outputTax: 0,
    supplierCode: "",
    importQuantity: 0,
    note: "",
};

export const useCreateProductStore = create<CreateProductStore>()(
    devtools(
        (set) => ({
            // Initial state
            formData: initialFormData,
            isSubmitting: false,

            // Form data actions
            updateFormData: (field, value) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            [field]: value,
                        },
                    }),
                    false,
                    `updateFormData/${field}`
                ),

            updateFormDataBatch: (updates) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            ...updates,
                        },
                    }),
                    false,
                    'updateFormDataBatch'
                ),

            // Unit conversion actions
            addUnitConversion: () =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            unitConversions: [
                                ...state.formData.unitConversions,
                                { unit: "", conversionRate: 1 }
                            ],
                        },
                    }),
                    false,
                    'addUnitConversion'
                ),

            updateUnitConversion: (index, field, value) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            unitConversions: state.formData.unitConversions.map((item, i) =>
                                i === index ? { ...item, [field]: value } : item
                            ),
                        },
                    }),
                    false,
                    `updateUnitConversion/${index}/${field}`
                ),

            removeUnitConversion: (index) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            unitConversions: state.formData.unitConversions.filter((_, i) => i !== index),
                        },
                    }),
                    false,
                    'removeUnitConversion'
                ),

            // Tag actions
            addTag: (tag) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            tags: [...state.formData.tags, tag.trim()],
                        },
                    }),
                    false,
                    'addTag'
                ),

            removeTag: (index) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            tags: state.formData.tags.filter((_, i) => i !== index),
                        },
                    }),
                    false,
                    'removeTag'
                ),

            // Form actions
            setSubmitting: (isSubmitting) =>
                set({ isSubmitting }, false, 'setSubmitting'),

            resetForm: () =>
                set(
                    {
                        formData: initialFormData,
                        isSubmitting: false,
                    },
                    false,
                    'resetForm'
                ),
        }),
        {
            name: 'create-product-store',
        }
    )
);