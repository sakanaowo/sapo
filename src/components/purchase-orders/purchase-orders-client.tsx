"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

    // State for managing selected items
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    // Handlers for checkbox selection
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(data.data.map(order => order.purchaseOrderId));
            setSelectedItems(allIds);
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleSelectItem = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedItems);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedItems(newSelected);
    };

    const isAllSelected = data.data.length > 0 && selectedItems.size === data.data.length;

    // Set initial filters
    useEffect(() => {
        if (initialStatus) {
            handleStatusChange(initialStatus);
        }
        if (initialSupplierId) {
            handleSupplierChange(initialSupplierId);
        }
    }, [initialStatus, initialSupplierId, handleStatusChange, handleSupplierChange]);

    // Clear selected items when data changes
    useEffect(() => {
        setSelectedItems(new Set());
    }, [data.data]);

    const getStatusBadge = (status: string, importStatus?: string) => {
        const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
            'PENDING': { label: 'Chờ xử lý', variant: 'outline' },
            'COMPLETED': { label: 'Hoàn thành', variant: 'default', className: 'bg-green-600 hover:bg-green-700 text-white' },
            'CANCELLED': { label: 'Đã hủy', variant: 'destructive' }
        };

        const importStatusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
            'PENDING': { label: 'Chưa nhập', variant: 'outline' },
            'IMPORTED': { label: 'Đã nhập kho', variant: 'default', className: 'bg-green-600 hover:bg-green-700 text-white' },
            'CANCELLED': { label: 'Đã hủy', variant: 'destructive' }
        };

        const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const };
        const importInfo = importStatusMap[importStatus || ''] || null;

        return (
            <div className="grid grid-cols-1 gap-1">
                <Badge variant={statusInfo.variant} className={statusInfo.className}>{statusInfo.label}</Badge>
                {importInfo && (
                    <Badge variant={importInfo.variant} className={`text-xs ${importInfo.className || ''}`}>
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
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="border-b bg-card shadow-sm">
                <div className="flex h-14 items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-semibold text-foreground">Đơn nhập hàng</h1>
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
            <div className="border-b bg-card px-6 py-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Tất cả</SelectItem>
                                <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
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
                <div className="mx-6 mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 p-6">
                <Card className="bg-card shadow-sm">
                    <CardContent className="p-0">
                        {isPending ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-pulse text-muted-foreground">Đang tải...</div>
                            </div>
                        ) : data.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                <Package className="h-12 w-12 mb-4 text-muted-foreground/50" />
                                <p className="text-lg font-medium">Không có đơn nhập hàng</p>
                                <p className="text-sm text-muted-foreground/70">
                                    {searchTerm || selectedStatus ? 'Không tìm thấy đơn nào với bộ lọc hiện tại' : 'Tạo đơn nhập hàng đầu tiên của bạn'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                className="w-4"
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </TableHead>
                                        <TableHead className="min-w-[140px]">Mã đơn</TableHead>
                                        <TableHead className="min-w-[180px]">Nhà cung cấp</TableHead>
                                        <TableHead className="min-w-[120px]">Ngày tạo</TableHead>
                                        <TableHead className="min-w-[120px]">Ngày nhập</TableHead>
                                        <TableHead className="min-w-[120px]">Trạng thái</TableHead>
                                        <TableHead className="min-w-[100px] text-center">Số mặt hàng</TableHead>
                                        <TableHead className="min-w-[120px] text-right">Tổng tiền</TableHead>
                                        <TableHead className="w-12">
                                            {selectedItems.size > 0 && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            {/* TODO: implement delete selected items */}
                                                            Xóa đã chọn
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.data.map((order) => (
                                        <TableRow
                                            key={order.purchaseOrderId}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => navigateToPurchaseOrder(order.purchaseOrderId)}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    className="w-4"
                                                    checked={selectedItems.has(order.purchaseOrderId)}
                                                    onCheckedChange={(checked) => handleSelectItem(order.purchaseOrderId, checked as boolean)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {order.purchaseOrderCode}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{order.supplier.name}</div>
                                                    <div className="text-sm text-muted-foreground">{order.supplier.supplierCode}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {order.importDate ? formatDate(order.importDate) : (
                                                    <span className="text-muted-foreground">Chưa nhập</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(order.status, order.importStatus)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div>
                                                    <div className="font-medium">{order.itemCount}</div>
                                                    <div className="text-xs text-muted-foreground">
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
                        <div className="text-sm text-muted-foreground">
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
                                    <span key={index} className="px-2 text-muted-foreground">...</span>
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

