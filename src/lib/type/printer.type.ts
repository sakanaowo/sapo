export type CartProduct = {
    id: string; // variantId
    productId: string;
    image: string;
    name: string;
    SKU: string;
    unit: string[];
    quantity: number;
    price: number;
    amount: number;
}
export type InvoiceData = {
    logo: string;
    storeName: string;
    address: string;
    phoneNumber: string;
    products: CartProduct[];
    totalAmount: number;
    additionalMessages?: string;
};