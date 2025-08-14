import { getPurchaseOrderById } from '@/actions/purchase-order.action';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Package, User, Calendar, FileText } from 'lucide-react';
import PurchaseOrderActions from '@/components/purchase-orders/purchase-order-actions';

export const dynamic = 'force-dynamic';

interface PurchaseOrderDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

interface PurchaseOrderDetail {
    purchaseOrderDetailId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalAmount: number;
    variant: {
        sku: string;
        variantName: string;
        unit: string;
        product: {
            name: string;
        };
    };
}

// Helper function for currency formatting
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
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
        <div className="flex gap-2">
            <Badge variant={statusInfo.variant} className={statusInfo.className}>{statusInfo.label}</Badge>
            {importInfo && (
                <Badge variant={importInfo.variant} className={importInfo.className}>
                    {importInfo.label}
                </Badge>
            )}
        </div>
    );
};

export default async function PurchaseOrderDetailPage({ params }: PurchaseOrderDetailPageProps) {
    const { id } = await params;

    try {
        // Gọi action để lấy chi tiết đơn nhập hàng
        const result = await getPurchaseOrderById(id);

        if (!result || !result.data) {
            notFound();
        }

        const order = result.data;
        const totalAmount = order.purchaseOrderDetails?.reduce(
            (sum: number, detail: PurchaseOrderDetail) => sum + detail.totalAmount, 0
        ) || 0;
        const totalQuantity = order.purchaseOrderDetails?.reduce(
            (sum: number, detail: PurchaseOrderDetail) => sum + detail.quantity, 0
        ) || 0;

        return (
            <div className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b bg-card shadow-sm">
                    <div className="flex h-14 items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <Link href="/products/purchase-orders">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Quay lại
                                </Button>
                            </Link>
                            <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <h1 className="text-xl font-semibold text-foreground">Chi tiết đơn nhập hàng</h1>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Order Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Order Header */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{order.purchaseOrderCode}</span>
                                        {getStatusBadge(order.status, order.importStatus)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Ngày tạo</div>
                                                <div className="font-medium">{formatDate(order.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <div className="text-sm text-muted-foreground">Ngày nhập dự kiến</div>
                                                <div className="font-medium">
                                                    {order.importDate ? formatDate(order.importDate) : 'Chưa xác định'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Supplier Info */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Nhà cung cấp
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div>
                                                <div className="font-medium">{order.supplier?.name}</div>
                                                <div className="text-sm text-muted-foreground">Mã: {order.supplier?.supplierCode}</div>
                                            </div>
                                            {order.supplier?.email && (
                                                <div className="text-sm text-muted-foreground">{order.supplier.email}</div>
                                            )}
                                            {order.supplier?.phone && (
                                                <div className="text-sm text-muted-foreground">{order.supplier.phone}</div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Order Summary */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Tổng kết đơn hàng
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Số mặt hàng:</span>
                                                <span className="font-medium">{order.purchaseOrderDetails?.length || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tổng số lượng:</span>
                                                <span className="font-medium">{totalQuantity.toLocaleString()}</span>
                                            </div>
                                            <div className="border-t pt-3">
                                                <div className="flex justify-between">
                                                    <span className="text-lg font-semibold">Tổng tiền:</span>
                                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(totalAmount)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Chi tiết sản phẩm</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sản phẩm</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead className="text-right">Số lượng</TableHead>
                                                <TableHead className="text-right">Đơn giá</TableHead>
                                                <TableHead className="text-right">Giảm giá</TableHead>
                                                <TableHead className="text-right">Thành tiền</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {order.purchaseOrderDetails?.map((detail: PurchaseOrderDetail) => (
                                                <TableRow key={detail.purchaseOrderDetailId}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{detail.variant?.product?.name}</div>
                                                            <div className="text-sm text-muted-foreground">{detail.variant?.variantName}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {detail.variant?.sku}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {detail.quantity.toLocaleString()} {detail.variant?.unit}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formatCurrency(detail.unitPrice)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {detail.discount > 0 ? formatCurrency(detail.discount) : '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {formatCurrency(detail.totalAmount)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thao tác nhanh</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <PurchaseOrderActions
                                        order={{
                                            purchaseOrderId: order.purchaseOrderId,
                                            status: order.status,
                                            importStatus: order.importStatus
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {/* Additional Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Xuất báo cáo</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {/* TODO: Implement print functionality */}
                                    <Button variant="outline" className="w-full" disabled>
                                        In đơn nhập hàng
                                    </Button>
                                    {/* TODO: Implement export functionality */}
                                    <Button variant="outline" className="w-full" disabled>
                                        Xuất Excel
                                    </Button>
                                    <p className="text-xs text-muted-foreground text-center mt-2">
                                        Chức năng sẽ được triển khai sau
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading purchase order:', error);
        notFound();
    }
}
