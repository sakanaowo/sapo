/* eslint-disable @typescript-eslint/no-explicit-any */
export type Variant = {
    variantId: string;
    variantName: string;
    sku: string;
    barcode: string | null;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string | null;
    retailPrice: number;
    wholesalePrice: number;
    importPrice: number;
    taxApplied: boolean;
    fromConversions: any[];
    toConversions: any[];
};

export type Product = {
    productId: string;
    name: string;
    description: string | null;
    brand: string | null;
    productType: string | null;
    tags: string[];
    variants: Variant[];
};

// Upload-related types
export type UploadThingResponse = {
    url: string;
    fileUrl?: string;
    uploadedBy?: string;
    message?: string;
    key?: string;
    name?: string;
    size?: number;
};

export type ImageUploadError = {
    message: string;
    code?: string;
};