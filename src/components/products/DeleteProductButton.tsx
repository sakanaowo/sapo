"use client"
import { Dialog, DialogContent, DialogTitle, DialogTrigger, DialogHeader } from '../ui/dialog'
import { useState } from 'react'
import { Button } from '../ui/button'
import { Trash2 } from 'lucide-react'
import { deleteProductById } from '@/actions/product.action'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProductDetailHeaderProps {
    product: {
        productId: string;
        name: string;
    };
}

function DeleteProductButton(product: ProductDetailHeaderProps) {

    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await deleteProductById(product.product.productId);
            if (res) {
                toast.success("Xóa sản phẩm thành công!");
                router.push('/products');
            } else {
                toast.error("Không thể xóa sản phẩm");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Không thể xóa sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="destructive">
                <Trash2 className="h-4 w-4" />
                Xóa sản phẩm</Button>
        </DialogTrigger>

        <DialogContent>
            <DialogHeader>
                <DialogTitle className='text-center'>Xác nhận xóa sản phẩm</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <p>
                    Bạn có chắc chắn muốn xóa sản phẩm{" "}
                    <span className="font-bold">{product.product.name}</span> không? Thao tác này
                    không thể hoàn tác.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? "Đang xóa..." : "Xác nhận xóa"}
                    </Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
}

export default DeleteProductButton