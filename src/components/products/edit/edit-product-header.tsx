'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEditProductStore } from '@/store/product/edit-product-store';
import { toast } from 'react-hot-toast';

const EditProductHeader: React.FC = () => {
    const router = useRouter();
    const {
        hasChanges,
        isSaving,
        saveChanges,
        setShowUnsavedWarning
    } = useEditProductStore();

    const handleBack = () => {
        if (hasChanges) {
            setShowUnsavedWarning(true);
            return;
        }
        router.back();
    };

    const handleSave = async () => {
        try {
            await saveChanges();
            toast.success('Đã lưu thành công!');
            router.back();
        } catch (error) {
            console.error('Failed to save:', error);
            toast.error('Lưu thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex items-center justify-between bg-background py-2">
            <Button variant="ghost" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Quay lại</span>
                <span className="sm:hidden">Quay lại</span>
            </Button>
            <div className="flex items-center gap-2">
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="gap-2"
                >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                </Button>
            </div>
        </div>
    );
};

export default EditProductHeader;
