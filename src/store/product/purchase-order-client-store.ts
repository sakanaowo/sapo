"use client";

import { create } from 'zustand';
import { getPurchaseOrders } from '@/actions/purchase-order.action';

export interface PurchaseOrder {
    purchaseOrderId: string;
    purchaseOrderCode: string;
    supplierId: string;
    createdBy?: string;
    createdAt: string;
    importDate?: string;
    status: string;
    importStatus: string;
    supplier: {
        supplierId: string;
        name: string;
        supplierCode: string;
    };
    purchaseOrderDetails: Array<{
        purchaseOrderDetailId: string;
        variantId: string;
        quantity: number;
        unitPrice: number;
        discount: number;
        totalAmount: number;
        variant: {
            variantId: string;
            sku: string;
            variantName: string;
            unit: string;
            product: {
                productId: string;
                name: string;
            };
        };
    }>;
    totalAmount: number;
    totalQuantity: number;
    itemCount: number;
}

export interface PurchaseOrdersData {
    data: PurchaseOrder[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

interface PurchaseOrderClientState {
    data: PurchaseOrdersData;
    searchTerm: string;
    currentPage: number;
    selectedStatus: string;
    selectedSupplierId: string;
    error: string | null;
    isPending: boolean;
}

interface PurchaseOrderClientActions {
    handleSearch: () => Promise<void>;
    handleSearchChange: (value: string) => void;
    handleStatusChange: (status: string) => void;
    handleSupplierChange: (supplierId: string) => void;
    handleKeyPress: (e: React.KeyboardEvent) => Promise<void>;
    handlePageChange: (page: number) => Promise<void>;
    navigateToPurchaseOrder: (id: string) => void;
    generatePageNumbers: () => number[];
    clearFilters: () => Promise<void>;
}

type PurchaseOrderClientStore = PurchaseOrderClientState & PurchaseOrderClientActions;

interface CreateStoreParams {
    initialData: PurchaseOrdersData;
    initialPage: number;
    initialSearch: string;
    itemsPerPage: number;
    initialError?: string;
}

export const usePurchaseOrderClientStore = create<PurchaseOrderClientStore>()((set, get) => ({
    // Initial state will be set by the hook
    data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false } },
    searchTerm: '',
    currentPage: 1,
    selectedStatus: 'ALL',
    selectedSupplierId: '',
    error: null,
    isPending: false,

    handleSearchChange: (value: string) => {
        set({ searchTerm: value });
    },

    handleStatusChange: (status: string) => {
        set({ selectedStatus: status });
        get().handleSearch();
    },

    handleSupplierChange: (supplierId: string) => {
        set({ selectedSupplierId: supplierId });
        get().handleSearch();
    },

    handleKeyPress: async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            await get().handleSearch();
        }
    },

    handleSearch: async () => {
        const state = get();
        set({ isPending: true, error: null });

        try {
            const result = await getPurchaseOrders({
                page: 1, // Reset to first page when searching
                limit: state.data.pagination.limit,
                search: state.searchTerm,
                status: state.selectedStatus && state.selectedStatus !== 'ALL' ? state.selectedStatus : undefined,
                supplierId: state.selectedSupplierId || undefined,
            });

            set({
                data: result,
                currentPage: 1,
                isPending: false,
            });

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('page', '1');

            if (state.searchTerm) {
                url.searchParams.set('search', state.searchTerm);
            } else {
                url.searchParams.delete('search');
            }

            if (state.selectedStatus && state.selectedStatus !== 'ALL') {
                url.searchParams.set('status', state.selectedStatus);
            } else {
                url.searchParams.delete('status');
            }

            if (state.selectedSupplierId) {
                url.searchParams.set('supplierId', state.selectedSupplierId);
            } else {
                url.searchParams.delete('supplierId');
            }

            window.history.pushState({}, '', url.toString());
        } catch (error) {
            console.error('Error searching purchase orders:', error);
            set({
                error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tìm kiếm',
                isPending: false,
            });
        }
    },

    handlePageChange: async (page: number) => {
        const state = get();
        set({ isPending: true, error: null });

        try {
            const result = await getPurchaseOrders({
                page,
                limit: state.data.pagination.limit,
                search: state.searchTerm,
                status: state.selectedStatus && state.selectedStatus !== 'ALL' ? state.selectedStatus : undefined,
                supplierId: state.selectedSupplierId || undefined,
            });

            set({
                data: result,
                currentPage: page,
                isPending: false,
            });

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('page', page.toString());
            window.history.pushState({}, '', url.toString());
        } catch (error) {
            console.error('Error changing page:', error);
            set({
                error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải trang',
                isPending: false,
            });
        }
    },

    navigateToPurchaseOrder: (id: string) => {
        window.location.href = `/products/purchase-orders/${id}`;
        // router.push(`/products/purchase-orders/${id}`);
    },

    generatePageNumbers: () => {
        const { currentPage, data } = get();
        const totalPages = data.pagination.totalPages;
        const pages: number[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 4) {
                pages.push(1, 2, 3, 4, 5, -1, totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages);
            }
        }

        return pages;
    },

    clearFilters: async () => {
        set({
            searchTerm: '',
            selectedStatus: 'ALL',
            selectedSupplierId: '',
            currentPage: 1
        });
        await get().handleSearch();
    },
}));

// Hook to initialize store
export const usePurchaseOrderClientStoreWithInit = (params: CreateStoreParams) => {
    const store = usePurchaseOrderClientStore();

    // Initialize store on mount
    React.useEffect(() => {
        usePurchaseOrderClientStore.setState({
            data: params.initialData,
            searchTerm: params.initialSearch,
            currentPage: params.initialPage,
            error: params.initialError || null,
            isPending: false,
        });
    }, [params.initialData, params.initialSearch, params.initialPage, params.initialError]);

    return store;
};

// Import React for useEffect
import React from 'react';
