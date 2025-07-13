export type Invoice = {
    logoUrl: string;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    products: InvoiceProduct[];
    totalAmount: number;
    additionalMessages?: string;
};

export type InvoiceProduct = {
    name: string;
    quantity: number;
    price: number;
    total: number;
};