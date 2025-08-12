import { create } from 'zustand';
import { Product, Variant } from '../../lib/type/type';
import { updateProductAction } from '@/actions/product.action';

interface EditProductFormData {
    // Product basic info
    name: string;
    description?: string;
    brand?: string;
    productType?: string;
    tags?: string[];

    // Variant data
    variantName: string;
    sku: string;
    barcode?: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl?: string;
    retailPrice?: number;
    wholesalePrice?: number;
    importPrice?: number;
    taxApplied: boolean;
}

interface EditProductState {
    // Original data
    originalProduct: Product | null;
    originalVariant: Variant | null;

    // Current form data
    formData: EditProductFormData;

    // Current selected variant
    selectedVariantId: string | null;
    pendingVariantId: string | null; // For variant switching with unsaved changes

    // State flags
    hasChanges: boolean;
    isLoading: boolean;
    isSaving: boolean;
    showUnsavedWarning: boolean;

    // Actions
    setProduct: (product: Product) => void;
    setSelectedVariant: (variantId: string) => void;
    updateFormField: <K extends keyof EditProductFormData>(field: K, value: EditProductFormData[K]) => void;
    updateFormData: (data: Partial<EditProductFormData>) => void;
    resetForm: () => void;
    checkForChanges: () => void;
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;
    setShowUnsavedWarning: (show: boolean) => void;
    switchToVariant: (variantId: string) => void; // Force switch without warning
    saveChanges: () => Promise<void>;
}

const createInitialFormData = (variant?: Variant, product?: Product): EditProductFormData => {
    if (!variant || !product) {
        return {
            name: '',
            description: '',
            brand: '',
            productType: '',
            tags: [],
            variantName: '',
            sku: '',
            barcode: '',
            weight: 0,
            weightUnit: 'kg',
            unit: '',
            imageUrl: '',
            retailPrice: 0,
            wholesalePrice: 0,
            importPrice: 0,
            taxApplied: false,
        };
    }

    return {
        name: product.name,
        description: product.description || '',
        brand: product.brand || '',
        productType: product.productType || '',
        tags: product.tags || [],
        variantName: variant.variantName,
        sku: variant.sku,
        barcode: variant.barcode || '',
        weight: variant.weight,
        weightUnit: variant.weightUnit,
        unit: variant.unit,
        imageUrl: variant.imageUrl || '',
        retailPrice: variant.retailPrice || 0,
        wholesalePrice: variant.wholesalePrice || 0,
        importPrice: variant.importPrice || 0,
        taxApplied: variant.taxApplied,
    };
};

export const useEditProductStore = create<EditProductState>((set, get) => ({
    originalProduct: null,
    originalVariant: null,
    formData: createInitialFormData(),
    selectedVariantId: null,
    pendingVariantId: null,
    hasChanges: false,
    isLoading: false,
    isSaving: false,
    showUnsavedWarning: false,

    setProduct: (product: Product) => {
        const firstVariant = product.variants[0];
        const formData = createInitialFormData(firstVariant, product);

        set({
            originalProduct: product,
            originalVariant: firstVariant,
            selectedVariantId: firstVariant?.variantId || null,
            formData,
            hasChanges: false,
        });
    },

    setSelectedVariant: (variantId: string) => {
        const state = get();

        // If there are unsaved changes, show warning
        if (state.hasChanges) {
            set({
                showUnsavedWarning: true,
                pendingVariantId: variantId  // Store the pending variant to switch to
            });
            return;
        }

        const product = state.originalProduct;
        if (!product) return;

        const variant = product.variants.find(v => v.variantId === variantId);
        if (!variant) return;

        const formData = createInitialFormData(variant, product);

        set({
            selectedVariantId: variantId,
            originalVariant: variant,
            formData,
            hasChanges: false,
        });
    },

    updateFormField: (field, value) => {
        set((state) => {
            const newFormData = { ...state.formData, [field]: value };
            return {
                formData: newFormData,
            };
        });

        // Check for changes after updating
        setTimeout(() => get().checkForChanges(), 0);
    },

    updateFormData: (data) => {
        set((state) => {
            const newFormData = { ...state.formData, ...data };
            return {
                formData: newFormData,
            };
        });

        // Check for changes after updating
        setTimeout(() => get().checkForChanges(), 0);
    },

    resetForm: () => {
        const state = get();
        if (state.originalProduct && state.originalVariant) {
            const formData = createInitialFormData(state.originalVariant, state.originalProduct);
            set({
                formData,
                hasChanges: false,
            });
        }
    },

    checkForChanges: () => {
        const state = get();
        if (!state.originalProduct || !state.originalVariant) {
            set({ hasChanges: false });
            return;
        }

        const original = state.originalVariant;
        const product = state.originalProduct;
        const current = state.formData;

        const hasProductChanges =
            current.name !== product.name ||
            current.description !== (product.description || '') ||
            current.brand !== (product.brand || '') ||
            current.productType !== (product.productType || '') ||
            JSON.stringify(current.tags || []) !== JSON.stringify(product.tags || []);

        const hasVariantChanges =
            current.variantName !== original.variantName ||
            current.sku !== original.sku ||
            current.barcode !== (original.barcode || '') ||
            current.weight !== original.weight ||
            current.weightUnit !== original.weightUnit ||
            current.unit !== original.unit ||
            current.imageUrl !== (original.imageUrl || '') ||
            current.retailPrice !== (original.retailPrice || 0) ||
            current.wholesalePrice !== (original.wholesalePrice || 0) ||
            current.importPrice !== (original.importPrice || 0) ||
            current.taxApplied !== original.taxApplied;

        set({ hasChanges: hasProductChanges || hasVariantChanges });
    },

    setLoading: (loading) => set({ isLoading: loading }),
    setSaving: (saving) => set({ isSaving: saving }),
    setShowUnsavedWarning: (show) => set({ showUnsavedWarning: show }),

    switchToVariant: (variantId: string) => {
        const state = get();
        const product = state.originalProduct;
        if (!product) return;

        const variant = product.variants.find(v => v.variantId === variantId);
        if (!variant) return;

        const formData = createInitialFormData(variant, product);

        set({
            selectedVariantId: variantId,
            originalVariant: variant,
            formData,
            hasChanges: false,
            pendingVariantId: null,
        });
    },

    saveChanges: async () => {
        const state = get();
        if (!state.hasChanges || !state.originalProduct || !state.originalVariant) {
            return;
        }

        set({ isSaving: true });

        try {
            // TODO: Implement actual save logic with API calls
            // This would involve updating both product and variant data

            // const res = await updateProductAction({
            //     productId: state.originalProduct.productId,
            //     variantId: state.originalVariant.variantId,
            //     data: state.formData,
            // });

            // Update original data with current form data
            // In real implementation, you would get the updated data from the API response
            set({
                hasChanges: false,
                isSaving: false,
            });
        } catch (error) {
            console.error('Failed to save changes:', error);
            set({ isSaving: false });
            throw error;
        }
    },
}));
