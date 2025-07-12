"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback } from "react";
import { toast } from "sonner";

import ProductCard from "@/components/products/product-card";
import { getProducts } from '@/actions/product.action';

interface Inventory {
    inventoryId: string;
    variantId: string;
    initialStock: number;
    currentStock: number;
    minStock: number;
    maxStock: number;
    warehouseLocation: string | null;
    updatedAt: string;
}

interface Variant {
    variantId: string;
    productId: string;
    sku: string;
    barcode: string;
    variantName: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl: string | null;
    retailPrice: number;
    wholesalePrice: number;
    importPrice: number;
    taxApplied: boolean;
    inputTax: number;
    outputTax: number;
    createdAt: string;
    inventory: Inventory;
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

interface ProductsClientProps {
    initialData: ProductsData;
    initialPage: number;
    initialSearch: string;
    itemsPerPage: number;
    error?: string;
}

export default function ProductsClient({
    initialData,
    initialPage,
    initialSearch,
    itemsPerPage,
    error: initialError
}: ProductsClientProps) {
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
    const handleSearch = () => {
        startTransition(async () => {
            try {
                await fetchData(1, searchTerm);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                // Error already handled in fetchData
            }
        });
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Handle search on Enter key
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= data.pagination.totalPages && !isPending) {
            startTransition(async () => {
                try {
                    await fetchData(page, searchTerm);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (err) {
                    // Error already handled in fetchData
                }
            });
        }
    };

    const generatePageNumbers = () => {
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
    };

    const skeleton = (
        <CardContent>
            <div className="text-center py-8 text-muted-foreground">
                <div className="mb-4">
                    <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="h-8 w-8" />
                    </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm nào</h3>
                <p className="text-sm mb-4">Hãy thêm sản phẩm đầu tiên của bạn</p>
                <Link href="/products/create">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm sản phẩm
                    </Button>
                </Link>
            </div>
        </CardContent>
    );

    // Loading skeleton
    const loadingSkeleton = (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <div className="animate-pulse">
                            <div className="flex space-x-4">
                                <div className="h-16 w-16 bg-muted rounded"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-muted rounded w-3/4"></div>
                                    <div className="h-3 bg-muted rounded w-1/2"></div>
                                    <div className="h-3 bg-muted rounded w-1/4"></div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Topbar */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-6">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Danh sách sản phẩm
                    </h1>
                    <Link href="/products/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm sản phẩm
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto p-6 space-y-6">
                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onKeyPress={handleKeyPress}
                                    disabled={isPending}
                                />
                            </div>
                            <Button
                                className="gap-2"
                                onClick={handleSearch}
                                disabled={isPending}
                            >
                                <Search className="h-4 w-4" />
                                {isPending ? 'Đang tìm...' : 'Tìm kiếm'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Error display */}
                {error && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8 text-destructive">
                                <p>Có lỗi xảy ra: {error}</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => handleSearch()}
                                    disabled={isPending}
                                >
                                    Thử lại
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Products Count */}
                {!isPending && !error && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, data.pagination.total)} của {data.pagination.total} sản phẩm
                        </p>
                    </div>
                )}

                {/* Products List */}
                {isPending ? (
                    loadingSkeleton
                ) : error ? null : data.data.length === 0 ? (
                    <Card>{skeleton}</Card>
                ) : (
                    <div className="space-y-4">
                        {data.data.map((product: Product) => (
                            <ProductCard
                                key={product.productId}
                                product={product}
                                onClick={() => router.push(`/products/${product.productId}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!isPending && !error && data.pagination.totalPages > 1 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center space-x-2">
                                {/* Previous Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={!data.pagination.hasPrev || isPending}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trước
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                    {currentPage > 3 && data.pagination.totalPages > 5 && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(1)}
                                                disabled={isPending}
                                            >
                                                1
                                            </Button>
                                            {currentPage > 4 && (
                                                <span className="px-2 text-muted-foreground">...</span>
                                            )}
                                        </>
                                    )}

                                    {generatePageNumbers().map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            disabled={isPending}
                                            className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    {currentPage < data.pagination.totalPages - 2 && data.pagination.totalPages > 5 && (
                                        <>
                                            {currentPage < data.pagination.totalPages - 3 && (
                                                <span className="px-2 text-muted-foreground">...</span>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(data.pagination.totalPages)}
                                                disabled={isPending}
                                            >
                                                {data.pagination.totalPages}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Next Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!data.pagination.hasNext || isPending}
                                    className="gap-1"
                                >
                                    Tiếp
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Page Info */}
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Trang {currentPage} của {data.pagination.totalPages}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}