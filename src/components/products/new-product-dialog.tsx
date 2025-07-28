"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Plus, Upload, Edit, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface AddProductDialogProps {
    children?: React.ReactNode;
    onOpenChange?: (open: boolean) => void;
}

export default function AddProductDialog({
    children,
    onOpenChange
}: AddProductDialogProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        onOpenChange?.(open);
    };

    const handleManualAdd = () => {
        handleOpenChange(false);
        router.push('/products/create');
    };

    const handleBulkImport = () => {
        handleOpenChange(false);
        router.push('/products/import');
    };

    const handleDownloadTemplate = () => {
        // Logic để download template Excel/CSV
        const link = document.createElement('a');
        link.href = '/templates/product-import-template.xlsx';
        link.download = 'mau-import-san-pham.xlsx';
        link.click();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm sản phẩm
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        Chọn cách thêm sản phẩm
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Import từ file */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleBulkImport}
                            variant="outline"
                            className="w-full h-20 flex-col gap-2 border-dashed border-2 hover:bg-muted/50"
                        >
                            <Upload className="h-6 w-6 text-blue-600" />
                            <div className="text-center">
                                <div className="font-medium">Import danh sách sản phẩm</div>
                                <div className="text-xs text-muted-foreground">
                                    Kéo thả file Excel/CSV hoặc chọn file
                                </div>
                            </div>
                        </Button>

                        {/* Template download */}
                        <Button
                            onClick={handleDownloadTemplate}
                            variant="ghost"
                            size="sm"
                            className="w-full gap-2 text-xs"
                        >
                            <FileSpreadsheet className="h-3 w-3" />
                            Tải xuống mẫu import
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Hoặc
                            </span>
                        </div>
                    </div>

                    {/* Tạo thủ công */}
                    <Button
                        onClick={handleManualAdd}
                        variant="outline"
                        className="w-full h-20 flex-col gap-2"
                    >
                        <Edit className="h-6 w-6 text-green-600" />
                        <div className="text-center">
                            <div className="font-medium">Tạo sản phẩm thủ công</div>
                            <div className="text-xs text-muted-foreground">
                                Điền thông tin từng sản phẩm
                            </div>
                        </div>
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground text-center mt-2">
                    💡 Tip: Sử dụng import để thêm nhiều sản phẩm cùng lúc
                </div>
            </DialogContent>
        </Dialog>
    );
}