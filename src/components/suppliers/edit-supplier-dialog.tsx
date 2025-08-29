"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateSupplier } from "@/actions/supplier.action";
import { SupplierWithDetails, Supplier } from "@/lib/type/supplier.type";

interface EditSupplierDialogProps {
    supplier: SupplierWithDetails;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditSupplierDialog({
    supplier,
    open,
    onOpenChange,
    onSuccess,
}: EditSupplierDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Supplier>({
        supplierCode: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        taxCode: "",
        website: "",
        status: "ACTIVE",
    });

    // Initialize form data when supplier changes
    useEffect(() => {
        if (supplier) {
            setFormData({
                supplierCode: supplier.supplierCode || "",
                name: supplier.name || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || "",
                taxCode: supplier.taxCode || "",
                website: supplier.website || "",
                status: supplier.status || "ACTIVE",
            });
        }
    }, [supplier]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplierCode.trim() || !formData.name.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        try {
            setLoading(true);
            const result = await updateSupplier(supplier.supplierId, formData);

            if (result.success) {
                toast.success(result.message);
                onSuccess();
                onOpenChange(false);
            }
        } catch (error) {
            console.error("Error updating supplier:", error);
            toast.error(error instanceof Error ? error.message : "Không thể cập nhật nhà cung cấp");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof Supplier, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa nhà cung cấp</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin nhà cung cấp. Các trường có dấu * là bắt buộc.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-supplierCode">
                                Mã nhà cung cấp <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-supplierCode"
                                value={formData.supplierCode}
                                onChange={(e) => handleInputChange("supplierCode", e.target.value)}
                                placeholder="Nhập mã nhà cung cấp"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-name">
                                Tên nhà cung cấp <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Nhập tên nhà cung cấp"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="Nhập email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Số điện thoại</Label>
                            <Input
                                id="edit-phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-taxCode">Mã số thuế</Label>
                            <Input
                                id="edit-taxCode"
                                value={formData.taxCode}
                                onChange={(e) => handleInputChange("taxCode", e.target.value)}
                                placeholder="Nhập mã số thuế"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-website">Website</Label>
                            <Input
                                id="edit-website"
                                value={formData.website}
                                onChange={(e) => handleInputChange("website", e.target.value)}
                                placeholder="Nhập website"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-address">Địa chỉ</Label>
                        <Textarea
                            id="edit-address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Nhập địa chỉ"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-status">Trạng thái</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => handleInputChange("status", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                                <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                                <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
