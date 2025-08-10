"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { getAllSuppliers, SupplierSelectOption } from "@/actions/supplier.action";
import { toast } from "sonner";

interface SupplierSelectProps {
    value: string;
    onChange: (supplierCode: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export function SupplierSelect({
    value,
    onChange,
    placeholder = "Chọn nhà cung cấp",
    disabled = false,
    required = false
}: SupplierSelectProps) {
    const [suppliers, setSuppliers] = useState<SupplierSelectOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSuppliers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error('Error loading suppliers:', error);
            setError(error instanceof Error ? error.message : 'Không thể tải danh sách nhà cung cấp');
            toast.error('Không thể tải danh sách nhà cung cấp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    const handleRefresh = () => {
        loadSuppliers();
    };

    const selectedSupplier = suppliers.find(s => s.supplierCode === value);

    if (loading) {
        return (
            <div className="flex items-center space-x-2">
                <Select disabled>
                    <SelectTrigger className="flex-1">
                        <div className="flex items-center">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Đang tải...
                        </div>
                    </SelectTrigger>
                </Select>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center space-x-2">
                <Select disabled>
                    <SelectTrigger className="flex-1 border-red-300">
                        <SelectValue placeholder="Lỗi tải dữ liệu" />
                    </SelectTrigger>
                </Select>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="px-3"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center space-x-2">
            <Select
                value={value}
                onValueChange={onChange}
                disabled={disabled}
                required={required}
            >
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder={placeholder}>
                        {selectedSupplier && (
                            <div className="flex items-center justify-between w-full">
                                <span>{selectedSupplier.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                    ({selectedSupplier.supplierCode})
                                </span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {suppliers.length === 0 ? (
                        <div className="p-2 text-center text-gray-500 text-sm">
                            Chưa có nhà cung cấp nào
                        </div>
                    ) : (
                        suppliers.map((supplier) => (
                            <SelectItem
                                key={supplier.supplierCode}
                                value={supplier.supplierCode}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{supplier.name}</span>
                                        <span className="text-xs text-gray-500">
                                            {supplier.supplierCode}
                                            {supplier.phone && ` • ${supplier.phone}`}
                                        </span>
                                    </div>
                                    {supplier.status && supplier.status !== 'ACTIVE' && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">
                                            {supplier.status}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>

            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="px-3"
                title="Làm mới danh sách"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
