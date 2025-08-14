"use client";

import { Button } from '@/components/ui/button';
import { updatePurchaseOrderStatus } from '@/actions/purchase-order.action';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface PurchaseOrderActionsProps {
    order: {
        purchaseOrderId: string;
        status: string;
        importStatus: string;
    };
}

export default function PurchaseOrderActions({ order }: PurchaseOrderActionsProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    const handleConfirmAndImport = async () => {
        if (order.status !== 'PENDING') {
            toast.error('Chỉ có thể xác nhận đơn hàng ở trạng thái "Chờ xử lý"');
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updatePurchaseOrderStatus(
                order.purchaseOrderId,
                'COMPLETED',    // Chuyển thẳng sang COMPLETED
                'IMPORTED'      // Và nhập vào kho luôn
            );

            if (result.success) {
                toast.success('Đơn hàng đã được xác nhận và nhập kho thành công! Tồn kho đã được cập nhật.');
                router.refresh(); // Refresh để cập nhật UI
            } else {
                toast.error(result.message || 'Có lỗi xảy ra khi xử lý đơn hàng');
            }
        } catch (error) {
            console.error('Error confirming and importing order:', error);
            toast.error('Có lỗi xảy ra khi xử lý đơn hàng');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelOrder = async () => {
        if (order.status !== 'PENDING') {
            toast.error('Không thể hủy đơn hàng ở trạng thái hiện tại');
            return;
        }

        if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updatePurchaseOrderStatus(
                order.purchaseOrderId,
                'CANCELLED',
                'CANCELLED'
            );

            if (result.success) {
                toast.success('Đơn hàng đã được hủy');
                router.refresh();
            } else {
                toast.error(result.message || 'Có lỗi xảy ra khi hủy đơn hàng');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Có lỗi xảy ra khi hủy đơn hàng');
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-2">
            {/* Xác nhận đơn và nhập kho */}
            {order.status === 'PENDING' && (
                <Button
                    size="sm"
                    onClick={handleConfirmAndImport}
                    disabled={isUpdating}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        'Xác nhận và nhập kho'
                    )}
                </Button>
            )}

            {/* Hủy đơn */}
            {order.status === 'PENDING' && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleCancelOrder}
                    disabled={isUpdating}
                    className="w-full"
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang hủy...
                        </>
                    ) : (
                        'Hủy đơn hàng'
                    )}
                </Button>
            )}

            {/* Hiển thị trạng thái hoàn thành */}
            {order.status === 'COMPLETED' && (
                <div className="text-center text-green-600 dark:text-green-400 font-medium py-2">
                    ✅ Đơn hàng đã được xử lý hoàn tất
                </div>
            )}

            {/* Hiển thị trạng thái đã hủy */}
            {order.status === 'CANCELLED' && (
                <div className="text-center text-red-600 dark:text-red-400 font-medium py-2">
                    ❌ Đơn hàng đã bị hủy
                </div>
            )}
        </div>
    );
}
