"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, Search, MoreHorizontal, Package, Filter, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePurchaseOrderClientStoreWithInit, type PurchaseOrdersData } from "@/store/product/purchase-order-client-store";
import Link from "next/link";

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

interface PurchaseOrdersClientProps {
    initialData: PurchaseOrdersData;
    initialPage: number;
    initialSearch: string;
    initialStatus?: string;
    initialSupplierId?: string;
    itemsPerPage: number;
    error?: string;
}

export default function PurchaseOrdersClient({
    initialData,
    initialPage,
    initialSearch,
    initialStatus = '',
    initialSupplierId = '',
    itemsPerPage,
    error: initialError
}: PurchaseOrdersClientProps) {
    const {
        data,
        searchTerm,
        currentPage,
        selectedStatus,
        selectedSupplierId,
        error,
        isPending,
        handleSearch,
        handleSearchChange,
        handleStatusChange,
        handleSupplierChange,
        handleKeyPress,
        handlePageChange,
        navigateToPurchaseOrder,
        generatePageNumbers,
        clearFilters
    } = usePurchaseOrderClientStoreWithInit({
        initialData,
        initialPage,
        initialSearch,
        itemsPerPage,
        initialError
    });

    // Set initial filters
    React.useEffect(() => {
        if (initialStatus) {
            handleStatusChange(initialStatus);
        }
        if (initialSupplierId) {
            handleSupplierChange(initialSupplierId);
        }
    }, [initialStatus, initialSupplierId, handleStatusChange, handleSupplierChange]);

    const getStatusBadge = (status: string, importStatus?: string) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            'PENDING': { label: 'Chờ xử lý', variant: 'outline' },
            'CONFIRMED': { label: 'Đã xác nhận', variant: 'default' },
            'SHIPPED': { label: 'Đang vận chuyển', variant: 'secondary' },
            'DELIVERED': { label: 'Đã giao', variant: 'default' },
            'CANCELLED': { label: 'Đã hủy', variant: 'destructive' }
        };

        const importStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            'PENDING': { label: 'Chưa nhập', variant: 'outline' },
            'PARTIAL': { label: 'Nhập một phần', variant: 'secondary' },
            'COMPLETED': { label: 'Đã nhập hoàn tất', variant: 'default' },
            'CANCELLED': { label: 'Đã hủy', variant: 'destructive' }
        };

        const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
        const importInfo = importStatusMap[importStatus || ''] || null;

        return (
            <div className="flex gap-1">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                {importInfo && (
                    <Badge variant={importInfo.variant} className="text-xs">
                        {importInfo.label}
                    </Badge>
                )}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h1 className="text-xl font-semibold">Đơn nhập hàng</h1>
                        <Badge variant="secondary" className="ml-2">
                            {data.pagination.total} đơn
                        </Badge>
                    </div>
                    <Link href="/products/purchase-orders/create">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo đơn nhập
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="border-b bg-white px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Tìm kiếm theo mã đơn..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="pl-10"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select value={selectedStatus} onValueChange={handleStatusChange}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                                <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                                <SelectItem value="SHIPPED">Đang vận chuyển</SelectItem>
                                <SelectItem value="DELIVERED">Đã giao</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            onClick={handleSearch}
                            disabled={isPending}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Lọc
                        </Button>

                        {(searchTerm || (selectedStatus && selectedStatus !== 'ALL') || selectedSupplierId) && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                size="sm"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 p-6">
                <Card className="bg-white shadow-sm">
                    <CardContent className="p-0">
                        {isPending ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-pulse text-gray-500">Đang tải...</div>
                            </div>
                        ) : data.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <Package className="h-12 w-12 mb-4 text-gray-300" />
                                <p className="text-lg font-medium">Không có đơn nhập hàng</p>
                                <p className="text-sm text-gray-400">
                                    {searchTerm || selectedStatus ? 'Không tìm thấy đơn nào với bộ lọc hiện tại' : 'Tạo đơn nhập hàng đầu tiên của bạn'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mã đơn</TableHead>
                                        <TableHead>Nhà cung cấp</TableHead>
                                        <TableHead>Ngày tạo</TableHead>
                                        <TableHead>Ngày nhập</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Số mặt hàng</TableHead>
                                        <TableHead>Tổng tiền</TableHead>
                                        <TableHead className="w-12"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((order) => (
                                        <TableRow
                                            key={order.purchaseOrderId}
                                            className="cursor-pointer hover:bg-gray-50"
                                            onClick={() => navigateToPurchaseOrder(order.purchaseOrderId)}
                                        >
                                            <TableCell className="font-medium">
                                                {order.purchaseOrderCode}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{order.supplier.name}</div>
                                                    <div className="text-sm text-gray-500">{order.supplier.supplierCode}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {order.importDate ? formatDate(order.importDate) : (
                                                    <span className="text-gray-400">Chưa nhập</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status, order.importStatus)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-center">
                                                    <div className="font-medium">{order.itemCount}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {order.totalQuantity.toLocaleString()} sản phẩm
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(order.totalAmount)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigateToPurchaseOrder(order.purchaseOrderId);
                                                            }}
                                                        >
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                        {order.status === 'PENDING' && (
                                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                                Xác nhận đơn
                                                            </DropdownMenuItem>
                                                        )}
                                                        {order.importStatus === 'PENDING' && (
                                                            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                                Nhập hàng
                                                            </DropdownMenuItem>
                                                        )}
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
                {data.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <div className="text-sm text-gray-500">
                            Hiển thị {data.data.length} trong tổng số {data.pagination.total} đơn nhập hàng
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!data.pagination.hasPrev || isPending}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {generatePageNumbers().map((pageNum, index) => (
                                pageNum === -1 ? (
                                    <span key={index} className="px-2 text-gray-400">...</span>
                                ) : (
                                    <Button
                                        key={pageNum}
                                        variant={pageNum === currentPage ? "default" : "outline"}
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                )
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!data.pagination.hasNext || isPending}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Import React for useEffect
import React from 'react';
