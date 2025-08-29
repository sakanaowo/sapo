"use client"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '../ui/dialog'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Trash2, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { checkProductDeletability, deleteProductById, forceDeleteProductById, flushAllCache } from '@/actions/product.action'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface ProductDetailHeaderProps {
    product: {
        productId: string;
        name: string;
    };
}

interface DeletabilityCheck {
    success: boolean;
    canDelete: boolean;
    hasWarnings: boolean;
    product?: {
        productId: string;
        name: string;
        variantCount: number;
    };
    issues?: Array<{
        type: string;
        message: string;
        details: string[];
        severity: 'error' | 'warning';
    }>;
    warnings?: Array<{
        type: string;
        message: string;
        details: string[];
        severity: 'error' | 'warning';
    }>;
    message: string;
}

interface DeleteResponse {
    success: boolean;
    message: string;
    data?: Record<string, unknown>;
    warnings?: string[];
}

function DeleteProductButton(product: ProductDetailHeaderProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(false)
    const [deletabilityCheck, setDeletabilityCheck] = useState<DeletabilityCheck | null>(null)
    const [showForceOptions, setShowForceOptions] = useState(false)
    const router = useRouter()

    const handleCheckDeletability = async () => {
        setChecking(true);
        try {
            const check = await checkProductDeletability(product.product.productId) as DeletabilityCheck;
            setDeletabilityCheck(check);

            if (!check.success) {
                toast.error(check.message);
                setOpen(false);
                return;
            }

            // Nếu không thể xóa, hiển thị tùy chọn force delete
            if (!check.canDelete) {
                setShowForceOptions(true);
            }
        } catch (error) {
            console.error("Error checking deletability:", error);
            toast.error("Lỗi khi kiểm tra khả năng xóa sản phẩm.");
            setOpen(false);
        } finally {
            setChecking(false);
        }
    };

    const handleDelete = async (forceDelete = false) => {
        setLoading(true);
        try {
            let res: DeleteResponse;

            if (forceDelete) {
                res = await forceDeleteProductById(product.product.productId, {
                    deleteOrders: true,
                    deletePurchaseOrders: true,
                    allowStockDeletion: true
                }) as DeleteResponse;
            } else {
                res = await deleteProductById(product.product.productId) as DeleteResponse;
            }

            if (res.success) {
                toast.success(res.message);
                if (forceDelete && res.warnings && res.warnings.length > 0) {
                    res.warnings.forEach((warning: string) => {
                        toast.error(warning);
                    });
                }
                router.push('/products');
                await flushAllCache();
                setOpen(false);
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Không thể xóa sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    const resetDialog = () => {
        setDeletabilityCheck(null);
        setShowForceOptions(false);
        setChecking(false);
        setLoading(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen);
        if (newOpen) {
            resetDialog();
            handleCheckDeletability();
        } else {
            resetDialog();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="h-4 w-4" />
                    Xóa sản phẩm
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className='text-center'>
                        {checking ? "Đang kiểm tra..." : "Xác nhận xóa sản phẩm"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {checking && (
                        <div className="flex items-center justify-center p-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2">Đang kiểm tra khả năng xóa sản phẩm...</span>
                        </div>
                    )}

                    {deletabilityCheck && !checking && (
                        <>
                            {/* Product Info Header */}
                            <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                {deletabilityCheck.canDelete ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 break-words">
                                        Sản phẩm: {deletabilityCheck.product?.name}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        <div>Số variants: {deletabilityCheck.product?.variantCount}</div>
                                        <div>Trạng thái: {deletabilityCheck.message}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Issues (errors) */}
                            {deletabilityCheck.issues && deletabilityCheck.issues.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-red-700 flex items-center">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Vấn đề cần giải quyết:
                                    </h4>
                                    {deletabilityCheck.issues.map((issue, index) => (
                                        <div key={index} className="border border-red-200 bg-red-50 rounded-lg p-4">
                                            <div className="font-medium text-red-800 mb-2">
                                                {issue.message}
                                            </div>
                                            {issue.details.length > 0 && (
                                                <div className="text-sm text-red-700">
                                                    {issue.details.slice(0, 3).map((detail, idx) => (
                                                        <div key={idx} className="flex items-start">
                                                            <span className="mr-2">•</span>
                                                            <span className="break-words">{detail}</span>
                                                        </div>
                                                    ))}
                                                    {issue.details.length > 3 && (
                                                        <div className="flex items-start">
                                                            <span className="mr-2">•</span>
                                                            <span>... và {issue.details.length - 3} mục khác</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Warnings */}
                            {deletabilityCheck.warnings && deletabilityCheck.warnings.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="font-medium text-yellow-700 flex items-center">
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Cảnh báo:
                                    </h4>
                                    {deletabilityCheck.warnings.map((warning, index) => (
                                        <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                                            <div className="font-medium text-yellow-800 mb-2">
                                                {warning.message}
                                            </div>
                                            {warning.details.length > 0 && (
                                                <div className="text-sm text-yellow-700">
                                                    {warning.details.map((detail, idx) => (
                                                        <div key={idx} className="flex items-start">
                                                            <span className="mr-2">•</span>
                                                            <span className="break-words">{detail}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Safe deletion */}
                            {deletabilityCheck.canDelete && !deletabilityCheck.hasWarnings && (
                                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                        <div className="font-medium text-green-700">
                                            Sản phẩm có thể xóa an toàn
                                        </div>
                                    </div>
                                    <div className="text-sm text-green-600">
                                        Không có dữ liệu liên quan sẽ bị ảnh hưởng.
                                    </div>
                                </div>
                            )}

                            {/* Force delete options */}
                            {!deletabilityCheck.canDelete && showForceOptions && (
                                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                                    <div className="flex items-center mb-2">
                                        <Info className="h-4 w-4 text-orange-500 mr-2" />
                                        <div className="font-medium text-orange-700">
                                            Tùy chọn xóa cưỡng bức
                                        </div>
                                    </div>
                                    <div className="text-sm text-orange-600">
                                        Sẽ xóa tất cả dữ liệu liên quan bao gồm đơn hàng, đơn nhập và tồn kho.
                                    </div>
                                    <div className="text-sm font-medium text-orange-700 mt-1">
                                        Cảnh báo: Thao tác này không thể hoàn tác!
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                >
                                    Hủy
                                </Button>

                                {deletabilityCheck.canDelete && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDelete(false)}
                                        disabled={loading}
                                    >
                                        {loading ? "Đang xóa..." : "Xác nhận xóa"}
                                    </Button>
                                )}

                                {!deletabilityCheck.canDelete && showForceOptions && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDelete(true)}
                                        disabled={loading}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {loading ? "Đang xóa..." : "Xóa cưỡng bức"}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteProductButton