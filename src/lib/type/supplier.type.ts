export type Supplier = {
    supplierCode: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxCode?: string;
    website?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export type SupplierWithDetails = Supplier & {
    supplierId: string;
    createdAt: string;
    purchaseOrders?: Array<{
        purchaseOrderId: string;
        purchaseOrderCode: string;
        status: string;
        importStatus: string;
        createdAt: string;
        importDate: string | null;
    }>;
    _count?: {
        purchaseOrders: number;
    };
}