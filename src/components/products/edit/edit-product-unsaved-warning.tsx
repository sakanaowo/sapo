'use client';

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEditProductStore } from '@/store/product/edit-product-store';
import { useRouter } from 'next/navigation';

const EditProductUnsavedWarning: React.FC = () => {
    const router = useRouter();
    const {
        showUnsavedWarning,
        setShowUnsavedWarning,
        resetForm,
        selectedVariantId,
        pendingVariantId,
        switchToVariant
    } = useEditProductStore();

    const handleDiscard = () => {
        resetForm();
        setShowUnsavedWarning(false);

        // If there's a pending variant switch, perform it now
        if (pendingVariantId) {
            // Switch to the pending variant without triggering warnings
            switchToVariant(pendingVariantId);
        } else if (!selectedVariantId) {
            // If this was triggered by back navigation, go back
            router.back();
        }
    };

    return (
        <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Bạn có thay đổi chưa được lưu</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bạn có muốn tiếp tục mà không lưu các thay đổi? Các thay đổi sẽ bị mất.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)}>
                        Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Bỏ qua thay đổi
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default EditProductUnsavedWarning;
