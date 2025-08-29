"use client";

import { useState } from "react";
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
import { createSupplier } from "@/actions/supplier.action";
import { Supplier } from "@/lib/type/supplier.type";

interface NewSupplierDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function NewSupplierDialog({
    open,
    onOpenChange,
    onSuccess,
}: NewSupplierDialogProps) {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplierCode.trim() || !formData.name.trim()) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        try {
            setLoading(true);
            const result = await createSupplier(formData);

            if (result.success) {
                toast.success(result.message);
                onSuccess();
                onOpenChange(false);
                // Reset form
                setFormData({
                    supplierCode: "",
                    name: "",
                    email: "",
                    phone: "",
                    address: "",
                    taxCode: "",
                    website: "",
                    status: "ACTIVE",
                });
            }
        } catch (error) {
            console.error("Error creating supplier:", error);
            toast.error(error instanceof Error ? error.message : "Không thể tạo nhà cung cấp");
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
                    <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
                    <DialogDescription>
                        Điền thông tin để tạo nhà cung cấp mới. Các trường có dấu * là bắt buộc.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="supplierCode">
                                Mã nhà cung cấp <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="supplierCode"
                                value={formData.supplierCode}
                                onChange={(e) => handleInputChange("supplierCode", e.target.value)}
                                placeholder="Nhập mã nhà cung cấp"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Tên nhà cung cấp <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Nhập tên nhà cung cấp"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="Nhập email"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                placeholder="Nhập số điện thoại"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="taxCode">Mã số thuế</Label>
                            <Input
                                id="taxCode"
                                value={formData.taxCode}
                                onChange={(e) => handleInputChange("taxCode", e.target.value)}
                                placeholder="Nhập mã số thuế"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => handleInputChange("website", e.target.value)}
                                placeholder="Nhập website"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            placeholder="Nhập địa chỉ"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Trạng thái</Label>
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
                            Tạo nhà cung cấp
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
