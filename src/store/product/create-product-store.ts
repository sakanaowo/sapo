import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UnitConversion {
    fromVariantId?: string;
    toVariantId?: string;
    unit: string;
    conversionRate: number;
}

interface ProductFormData {
    // Thông tin Product
    name: string;
    description: string;
    brand: string;
    productType: string;
    tags: string[];

    // Thông tin ProductVariant
    sku: string;
    barcode: string;
    variantName: string;
    weight: number;
    weightUnit: string;
    unit: string;

    // Giá sản phẩm
    retailPrice: number;
    importPrice: number;
    wholesalePrice: number;

    // Inventory
    initialStock: number;
    currentStock: number;
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
}

interface CreateProductStore {
    // State
    formData: ProductFormData;
    images: File[];
    imagePreviews: string[];
    isSubmitting: boolean;

    // Actions
    updateFormData: (field: keyof ProductFormData, value: unknown) => void;
    updateFormDataBatch: (updates: Partial<ProductFormData>) => void;

    // Image actions
    addImages: (files: File[]) => void;
    removeImage: (index: number) => void;
    clearImages: () => void;

    // Unit conversion actions
    addUnitConversion: () => void;
    updateUnitConversion: (index: number, field: keyof UnitConversion, value: string | number) => void;
    removeUnitConversion: (index: number) => void;

    // Form actions
    setSubmitting: (isSubmitting: boolean) => void;
    resetForm: () => void;

    // Utility actions
    syncInitialAndCurrentStock: (value: number) => void;
}

const initialFormData: ProductFormData = {
    name: "",
    description: "",
    brand: "",
    productType: "standard",
    tags: [],
    sku: "",
    barcode: "",
    variantName: "",
    weight: 0,
    weightUnit: "g",
    unit: "",
    retailPrice: 0,
    importPrice: 0,
    wholesalePrice: 0,
    initialStock: 0,
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    warehouseLocation: "",
    unitConversions: [],
    allowSale: true,
    taxApplied: false,
    inputTax: 0,
    outputTax: 0,
};

export const useCreateProductStore = create<CreateProductStore>()(
    devtools(
        (set) => ({
            // Initial state
            formData: initialFormData,
            images: [],
            imagePreviews: [],
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

            // Image actions
            addImages: (files) =>
                set(
                    (state) => {
                        // const newPreviews: string[] = [];

                        files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const result = e.target?.result as string;
                                set((currentState) => ({
                                    imagePreviews: [...currentState.imagePreviews, result]
                                }), false, 'addImagePreview');
                            };
                            reader.readAsDataURL(file);
                        });

                        return {
                            images: [...state.images, ...files],
                        };
                    },
                    false,
                    'addImages'
                ),

            removeImage: (index) =>
                set(
                    (state) => ({
                        images: state.images.filter((_, i) => i !== index),
                        imagePreviews: state.imagePreviews.filter((_, i) => i !== index),
                    }),
                    false,
                    'removeImage'
                ),

            clearImages: () =>
                set(
                    {
                        images: [],
                        imagePreviews: [],
                    },
                    false,
                    'clearImages'
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

            // Form actions
            setSubmitting: (isSubmitting) =>
                set(
                    { isSubmitting },
                    false,
                    'setSubmitting'
                ),

            resetForm: () =>
                set(
                    {
                        formData: initialFormData,
                        images: [],
                        imagePreviews: [],
                        isSubmitting: false,
                    },
                    false,
                    'resetForm'
                ),

            // Utility actions
            syncInitialAndCurrentStock: (value) =>
                set(
                    (state) => ({
                        formData: {
                            ...state.formData,
                            initialStock: value,
                            currentStock: value,
                        },
                    }),
                    false,
                    'syncInitialAndCurrentStock'
                ),
        }),
        {
            name: 'create-product-store',
        }
    )
);