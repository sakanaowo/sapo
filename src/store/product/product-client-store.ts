import { useState, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getProducts } from '@/actions/product.action';

interface Inventory {
    inventoryId?: string;
    variantId?: string;
    initialStock?: number;
    currentStock: number;
    minStock?: number;
    maxStock?: number;
    warehouseLocation?: string | null;
    updatedAt?: string;
}

interface Variant {
    variantId: string;
    productId?: string;
    sku: string;
    barcode: string;
    variantName: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string | null;
    retailPrice: number;
    wholesalePrice: number;
    importPrice?: number;
    taxApplied?: boolean;
    inputTax?: number;
    outputTax?: number;
    createdAt: string;
    inventory?: Inventory;
}

interface Product {
    productId: string;
    name: string;
    description: string | null;
    brand: string | null;
    productType: string;
    tags: string | null;
    createdAt: string;
    variants: Variant[];
}

interface ProductsData {
    data: Product[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

interface UseProductsStoreProps {
    initialData: ProductsData;
    initialPage: number;
    initialSearch: string;
    itemsPerPage: number;
    initialError?: string;
}

export function useProductClientStore({
    initialData,
    initialPage,
    initialSearch,
    itemsPerPage,
    initialError
}: UseProductsStoreProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [data, setData] = useState<ProductsData>(initialData);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [error, setError] = useState(initialError);

    // Update URL without causing a full page reload
    const updateURL = useCallback((page: number, search: string) => {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', itemsPerPage.toString());
        if (search) {
            params.set('search', search);
        }

        router.replace(`/products?${params.toString()}`, { scroll: false });
    }, [router, itemsPerPage]);

    // Fetch data using server action
    const fetchData = useCallback(async (page: number, search: string) => {
        try {
            setError(undefined);
            const newData = await getProducts({ page, limit: itemsPerPage, search });
            console.log('Data in store before set:', JSON.stringify(newData, null, 2));
            setData(newData as ProductsData);
            setCurrentPage(page);
            updateURL(page, search);
            return newData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
            setError(errorMessage);
            toast.error(`Lỗi khi tải sản phẩm: ${errorMessage}`);
            throw err;
        }
    }, [itemsPerPage, updateURL]);

    // Handle search
    const handleSearch = useCallback(() => {
        startTransition(async () => {
            try {
                await fetchData(1, searchTerm);
            } catch (err) {
                // Error already handled in fetchData
                console.error('Error during search:', err);
            }
        });
    }, [fetchData, searchTerm]);

    // Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }, []);

    // Handle search on Enter key
    const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }, [handleSearch]);

    // Handle page change
    const handlePageChange = useCallback((page: number) => {
        if (page >= 1 && page <= data.pagination.totalPages && !isPending) {
            startTransition(async () => {
                try {
                    await fetchData(page, searchTerm);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (err) {
                    // Error already handled in fetchData
                    console.error('Error during page change:', err);
                }
            });
        }
    }, [data.pagination.totalPages, isPending, fetchData, searchTerm]);

    // Generate page numbers for pagination
    const generatePageNumbers = useCallback(() => {
        const pages = [];
        const maxVisiblePages = 5;
        const totalPages = data.pagination.totalPages;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            let startPage = Math.max(1, currentPage - halfVisible);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }, [data.pagination.totalPages, currentPage]);

    // Navigate to product detail
    const navigateToProduct = useCallback((productId: string) => {
        router.push(`/products/${productId}`);
    }, [router]);

    const navigateToEditProduct = useCallback((productId: string) => {
        router.push(`/products/${productId}/edit`);
    }, [router]);

    return {
        // State
        data,
        searchTerm,
        currentPage,
        error,
        isPending,

        // Actions
        handleSearch,
        handleSearchChange,
        handleKeyPress,
        handlePageChange,
        navigateToProduct,
        navigateToEditProduct,

        // Computed
        generatePageNumbers,

        // Utils
        refreshData: () => fetchData(currentPage, searchTerm)
    };
}

export type { Product, ProductsData, Variant, Inventory };
