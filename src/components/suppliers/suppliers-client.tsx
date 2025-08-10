"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSuppliers, deleteSupplier } from "@/actions/supplier.action";
import { SupplierWithDetails } from "@/lib/type/supplier.type";
import NewSupplierDialog from "@/components/suppliers/new-supplier-dialog";
import EditSupplierDialog from "@/components/suppliers/edit-supplier-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// TODO: clean code
export default function SuppliersClient() {
    const [suppliers, setSuppliers] = useState<SupplierWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newSupplierOpen, setNewSupplierOpen] = useState(false);
    const [editSupplierOpen, setEditSupplierOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithDetails | null>(null);

    const fetchSuppliers = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getSuppliers({
                page,
                limit: 20,
                search: searchTerm,
                status: statusFilter === "all" ? undefined : statusFilter,
            });

            if (result.success) {
                setSuppliers(result.data);
                setTotalPages(result.pagination.totalPages);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Không thể tải danh sách nhà cung cấp");
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, statusFilter]);

    useEffect(() => {
        fetchSuppliers();
    }, [fetchSuppliers]);

    const handleDeleteSupplier = async (supplierId: string) => {
        try {
            const result = await deleteSupplier(supplierId);
            if (result.success) {
                toast.success(result.message);
                fetchSuppliers();
            }
        } catch (error) {
            console.error("Error deleting supplier:", error);
            toast.error(error instanceof Error ? error.message : "Không thể xóa nhà cung cấp");
        }
    };

    const handleEditSupplier = (supplier: SupplierWithDetails) => {
        setSelectedSupplier(supplier);
        setEditSupplierOpen(true);
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setPage(1);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge variant="default" className="bg-green-500">Hoạt động</Badge>;
            case "INACTIVE":
                return <Badge variant="secondary">Ngừng hoạt động</Badge>;
            case "PENDING":
                return <Badge variant="outline">Chờ duyệt</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm nhà cung cấp..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="pl-8 w-[300px]"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                            <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                            <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={() => setNewSupplierOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm nhà cung cấp
                </Button>
            </div>

            {/* Suppliers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách nhà cung cấp</CardTitle>
                    <CardDescription>
                        Quản lý thông tin các nhà cung cấp của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="ml-2">Đang tải...</span>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Mã nhà cung cấp</TableHead>
                                    <TableHead>Tên nhà cung cấp</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Số điện thoại</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Số đơn nhập</TableHead>
                                    <TableHead className="text-right">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            Không có nhà cung cấp nào
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    suppliers.map((supplier) => (
                                        <TableRow key={supplier.supplierId}>
                                            <TableCell className="font-medium">
                                                {supplier.supplierCode}
                                            </TableCell>
                                            <TableCell>{supplier.name}</TableCell>
                                            <TableCell>{supplier.email || "-"}</TableCell>
                                            <TableCell>{supplier.phone || "-"}</TableCell>
                                            <TableCell>
                                                {getStatusBadge(supplier.status || "ACTIVE")}
                                            </TableCell>
                                            <TableCell>
                                                {supplier._count?.purchaseOrders || 0}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => handleEditSupplier(supplier)}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem
                                                                    onSelect={(e) => e.preventDefault()}
                                                                    className="text-red-600"
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Xóa
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>
                                                                        Xóa nhà cung cấp
                                                                    </AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Bạn có chắc chắn muốn xóa nhà cung cấp &ldquo;{supplier.name}&rdquo;?
                                                                        Hành động này không thể hoàn tác.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => handleDeleteSupplier(supplier.supplierId)}
                                                                        className="bg-red-600 hover:bg-red-700"
                                                                    >
                                                                        Xóa
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 pt-4">
                            <div className="text-sm text-muted-foreground">
                                Trang {page} / {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                >
                                    Trước
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page >= totalPages}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Supplier Dialog */}
            <NewSupplierDialog
                open={newSupplierOpen}
                onOpenChange={setNewSupplierOpen}
                onSuccess={fetchSuppliers}
            />

            {/* Edit Supplier Dialog */}
            {selectedSupplier && (
                <EditSupplierDialog
                    supplier={selectedSupplier}
                    open={editSupplierOpen}
                    onOpenChange={setEditSupplierOpen}
                    onSuccess={fetchSuppliers}
                />
            )}
        </div>
    );
}
