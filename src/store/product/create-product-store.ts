// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';

// export interface UnitConversion {
//     fromVariantId?: string;
//     toVariantId?: string;
//     unit: string;
//     conversionRate: number;
// }

// export interface ProductFormData {
//     // Thông tin Product
//     name: string;
//     description: string;
//     brand: string;
//     productType: string;
//     tags: string[];

//     // Thông tin ProductVariant
//     sku: string;
//     barcode: string;
//     variantName: string;
//     weight: number;
//     weightUnit: string;
//     unit: string;
//     imageUrl: string; // Chỉ 1 URL ảnh

//     // Giá sản phẩm
//     retailPrice: number;
//     importPrice: number;
//     wholesalePrice: number;

//     // Inventory
//     initialStock: number;
//     currentStock: number;
//     minStock: number;
//     maxStock: number;
//     warehouseLocation: string;

//     // Đơn vị quy đổi
//     unitConversions: UnitConversion[];

//     // Trạng thái
//     allowSale: boolean;
//     taxApplied: boolean;
//     inputTax: number;
//     outputTax: number;
// }

// export interface CreateProductStore {
//     // State
//     formData: ProductFormData;
//     selectedImage: File | null;
//     imagePreview: string;
//     isSubmitting: boolean;
//     isUploadingImage: boolean;

//     // Actions
//     updateFormData: (field: keyof ProductFormData, value: unknown) => void;
//     updateFormDataBatch: (updates: Partial<ProductFormData>) => void;

//     // Image actions
//     setImage: (file: File) => void;
//     removeImage: () => void;
//     uploadImage: () => Promise<boolean>;

//     // Unit conversion actions
//     addUnitConversion: () => void;
//     updateUnitConversion: (index: number, field: keyof UnitConversion, value: string | number) => void;
//     removeUnitConversion: (index: number) => void;

//     // Form actions
//     setSubmitting: (isSubmitting: boolean) => void;
//     setUploadingImage: (isUploading: boolean) => void;
//     resetForm: () => void;

//     // Utility actions
//     syncInitialAndCurrentStock: (value: number) => void;
// }

// const initialFormData: ProductFormData = {
//     name: "",
//     description: "",
//     brand: "",
//     productType: "standard",
//     tags: [],
//     sku: "",
//     barcode: "",
//     variantName: "",
//     weight: 0,
//     weightUnit: "g",
//     unit: "",
//     imageUrl: "", // Khởi tạo trống
//     retailPrice: 0,
//     importPrice: 0,
//     wholesalePrice: 0,
//     initialStock: 0,
//     currentStock: 0,
//     minStock: 0,
//     maxStock: 0,
//     warehouseLocation: "",
//     unitConversions: [],
//     allowSale: true,
//     taxApplied: false,
//     inputTax: 0,
//     outputTax: 0,
// };

// export const useCreateProductStore = create<CreateProductStore>()(
//     devtools(
//         (set, get) => ({
//             // Initial state
//             formData: initialFormData,
//             selectedImage: null,
//             imagePreview: "",
//             isSubmitting: false,
//             isUploadingImage: false,

//             // Form data actions
//             updateFormData: (field, value) =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             [field]: value,
//                         },
//                     }),
//                     false,
//                     `updateFormData/${field}`
//                 ),

//             updateFormDataBatch: (updates) =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             ...updates,
//                         },
//                     }),
//                     false,
//                     'updateFormDataBatch'
//                 ),

//             // Image actions
//             setImage: (file) => {
//                 const reader = new FileReader();
//                 reader.onload = (e) => {
//                     const result = e.target?.result as string;
//                     set({ imagePreview: result }, false, 'setImagePreview');
//                 };
//                 reader.readAsDataURL(file);

//                 set({ selectedImage: file }, false, 'setImage');
//             },

//             removeImage: () =>
//                 set(
//                     {
//                         selectedImage: null,
//                         imagePreview: "",
//                         formData: { ...get().formData, imageUrl: "" }
//                     },
//                     false,
//                     'removeImage'
//                 ),

//             uploadImage: async () => {
//                 const { selectedImage } = get();
//                 if (!selectedImage) return false;

//                 set({ isUploadingImage: true }, false, 'uploadImage/start');

//                 try {
//                     const formData = new FormData();
//                     formData.append('image', selectedImage);

//                     // Sử dụng API route
//                     const response = await fetch('/api/upload', {
//                         method: 'POST',
//                         body: formData,
//                     });

//                     const result = await response.json();

//                     if (!response.ok) {
//                         throw new Error(result.message || `HTTP error! status: ${response.status}`);
//                     }

//                     if (result.success && result.url) {
//                         set(
//                             (state) => ({
//                                 formData: { ...state.formData, imageUrl: result.url },
//                                 isUploadingImage: false
//                             }),
//                             false,
//                             'uploadImage/success'
//                         );
//                         return true;
//                     } else {
//                         throw new Error(result.message || 'Upload failed');
//                     }
//                 } catch (error) {
//                     console.error('Upload error:', error);
//                     set({ isUploadingImage: false }, false, 'uploadImage/error');

//                     // Optional: Fallback to Server Action nếu API route fail
//                     try {
//                         console.log('Trying server action fallback...');
//                         const formData = new FormData();
//                         formData.append('image', selectedImage);

//                         const { uploadImage: serverActionUpload } = await import('@/actions/image-upload.action');
//                         const result = await serverActionUpload(formData);

//                         if (result.success && result.url) {
//                             set(
//                                 (state) => ({
//                                     formData: { ...state.formData, imageUrl: result.url! },
//                                     isUploadingImage: false
//                                 }),
//                                 false,
//                                 'uploadImage/fallback-success'
//                             );
//                             return true;
//                         }
//                     } catch (fallbackError) {
//                         console.error('Fallback also failed:', fallbackError);
//                     }

//                     return false;
//                 }
//             },

//             // Unit conversion actions
//             addUnitConversion: () =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             unitConversions: [
//                                 ...state.formData.unitConversions,
//                                 { unit: "", conversionRate: 1 }
//                             ],
//                         },
//                     }),
//                     false,
//                     'addUnitConversion'
//                 ),

//             updateUnitConversion: (index, field, value) =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             unitConversions: state.formData.unitConversions.map((item, i) =>
//                                 i === index ? { ...item, [field]: value } : item
//                             ),
//                         },
//                     }),
//                     false,
//                     `updateUnitConversion/${index}/${field}`
//                 ),

//             removeUnitConversion: (index) =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             unitConversions: state.formData.unitConversions.filter((_, i) => i !== index),
//                         },
//                     }),
//                     false,
//                     'removeUnitConversion'
//                 ),

//             // Form actions
//             setSubmitting: (isSubmitting) =>
//                 set({ isSubmitting }, false, 'setSubmitting'),

//             setUploadingImage: (isUploadingImage) =>
//                 set({ isUploadingImage }, false, 'setUploadingImage'),

//             resetForm: () =>
//                 set(
//                     {
//                         formData: initialFormData,
//                         selectedImage: null,
//                         imagePreview: "",
//                         isSubmitting: false,
//                         isUploadingImage: false,
//                     },
//                     false,
//                     'resetForm'
//                 ),

//             // Utility actions
//             syncInitialAndCurrentStock: (value) =>
//                 set(
//                     (state) => ({
//                         formData: {
//                             ...state.formData,
//                             initialStock: value,
//                             currentStock: value,
//                         },
//                     }),
//                     false,
//                     'syncInitialAndCurrentStock'
//                 ),
//         }),
//         {
//             name: 'create-product-store',
//         }
//     )
// );
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
    variantName: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string; // UploadThing URL

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
    imageUrl: "", // UploadThing URL sẽ được set từ component
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