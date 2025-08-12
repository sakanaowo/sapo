"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
// import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, FileDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddProductDialog from "./new-product-dialog";
import { Product, useProductClientStore, type ProductsData } from "@/store/product/product-client-store";
import Image from "next/image";
import Link from "next/link";

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
        navigateToEditProduct,
        generatePageNumbers
    } = useProductClientStore({
        initialData,
        initialPage,
        initialSearch,
        itemsPerPage,
        initialError
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }



    const getProductImage = (product: Product) => {
        if (product.variants[0].imageUrl) {
            return product.variants[0].imageUrl
        };
        return null
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStockBadge = (stock: number) => {
        if (stock === 0) {
            return <Badge variant="destructive" className=" text-white">Hết hàng</Badge>;
        } else if (stock < 50) {
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">{stock}</Badge>;
        }
        return <Badge variant="default" className=" bg-green-100 text-green-800">{stock}</Badge>;
    };

    const skeleton = (
        <div className="text-center py-16">
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
    );

    const loadingSkeleton = (
        <TableBody>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-muted rounded animate-pulse"></div>
                        </div>
                    </TableCell>
                    <TableCell><div className="h-4 w-20 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-16 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 w-20 bg-muted rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 w-4 bg-muted rounded animate-pulse"></div></TableCell>
                </TableRow>
            ))}
        </TableBody>
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Topbar */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-6">
                    <Link href="/products" className="px-3 py-2 rounded-md hover:bg-muted/80 transition-colors duration-200 group">
                        <h1 className="text-2xl font-semibold">
                            Danh sách sản phẩm
                        </h1>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Xuất dữ liệu
                        </Button>
                        <AddProductDialog>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Thêm sản phẩm
                            </Button>
                        </AddProductDialog>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto p-6 space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Input
                            placeholder="Tìm kiếm..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyPress={handleKeyPress}
                            disabled={isPending}
                        />
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                </div>

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

                {/* Products Table */}
                <Card>
                    <CardContent className="p-0">
                        {isPending ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            {/* <Checkbox /> */}
                                        </TableHead>
                                        <TableHead>Tên sản phẩm</TableHead>
                                        <TableHead>Danh mục</TableHead>
                                        <TableHead>Tồn kho</TableHead>
                                        <TableHead>Giá</TableHead>
                                        <TableHead>Ngày nhập</TableHead>
                                        <TableHead className="w-12">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                {loadingSkeleton}
                            </Table>
                        ) : error ? null : data.data.length === 0 ? (
                            skeleton
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            {/* <Checkbox /> */}
                                        </TableHead>
                                        <TableHead>Tên sản phẩm</TableHead>
                                        <TableHead>Danh mục</TableHead>
                                        <TableHead>Tồn kho</TableHead>
                                        <TableHead>Giá</TableHead>
                                        <TableHead>Ngày nhập</TableHead>
                                        <TableHead className="w-12">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((product) => (
                                        <TableRow key={product.productId} className="cursor-pointer hover:bg-muted/50">
                                            <TableCell>
                                                {/* <Checkbox /> */}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                                                        {getProductImage(product) ? (
                                                            <Image
                                                                src={getProductImage(product)!}
                                                                alt={product.name}
                                                                width={48}
                                                                height={48}
                                                                className="h-12 w-12 rounded object-cover"
                                                                onError={(e) => {
                                                                    // Fallback nếu ảnh lỗi
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded bg-muted-foreground/20 flex items-center justify-center">
                                                                <span className="text-xs text-muted-foreground">No Image</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span
                                                        className="font-medium hover:underline"
                                                        onClick={() => navigateToProduct(product.productId)}
                                                    >
                                                        {product.name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {product.productType || 'Uncategorized'}
                                            </TableCell>
                                            <TableCell>
                                                {getStockBadge(product.variants[0].inventory?.currentStock || 0)}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(product.variants[0].retailPrice)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(product.variants[0].createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigateToProduct(product.productId)}>
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => navigateToEditProduct(product.productId)}>
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">
                                                            Xóa
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {!isPending && !error && data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Result {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, data.pagination.total)} of {data.pagination.total}
                        </p>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!data.pagination.hasPrev || isPending}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <div className="flex items-center space-x-1">
                                {generatePageNumbers().map((page) => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                        disabled={isPending}
                                    >
                                        {page}
                                    </Button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!data.pagination.hasNext || isPending}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}