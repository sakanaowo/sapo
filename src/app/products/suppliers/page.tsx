import React from 'react'
import SuppliersClient from '@/components/suppliers/suppliers-client';

export default function SuppliersPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Nhà cung cấp</h2>
                    <p className="text-muted-foreground">
                        Quản lý thông tin nhà cung cấp
                    </p>
                </div>
            </div>
            <SuppliersClient />
        </div>
    )
}