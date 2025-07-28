"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import AddProductDialog from "./new-product-dialog";
import { useProductClientStore, type ProductsData } from "@/store/product/product-client-store";

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
    const {
        data,
        searchTerm,
        currentPage,
        error,
        isPending,
        handleSearch,
        handleSearchChange,
        handleKeyPress,
        handlePageChange,
        navigateToProduct,
        generatePageNumbers
    } = useProductClientStore({
        initialData,
        initialPage,
        initialSearch,
        itemsPerPage,
        initialError
    });

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
                <AddProductDialog>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm sản phẩm
                    </Button>
                </AddProductDialog>
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
                    <AddProductDialog />
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
                        {data.data.map((product) => (
                            <ProductCard
                                key={product.productId}
                                product={product}
                                onClick={() => navigateToProduct(product.productId)}
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