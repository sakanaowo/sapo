'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download } from 'lucide-react'
import BulkImportDropzone from '@/components/products/bulk-import-dropzone'
import { toast } from 'sonner'

interface PurchaseOrder {
    purchaseOrderCode: string
    totalAmount: number
}

export default function ProductImportPage() {
    const router = useRouter()
    const [isProcessing, setIsProcessing] = useState(false)
    const [toggleInstruction, setToggleInstruction] = useState(false)

    const handleDownloadTemplate = (type: 'excel' | 'csv') => {
        const link = document.createElement('a')
        link.href = `/templates/import-goods-template.${type === 'excel' ? 'xlsx' : 'csv'}`
        link.download = `import-goods-template.${type === 'excel' ? 'xlsx' : 'csv'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Đã tải xuống template')
    }

    const handleImportSuccess = (data: { productCount: number; purchaseOrder: PurchaseOrder }) => {
        toast.success(`Đã nhập thành công ${data.productCount} sản phẩm!`)
        router.push('/products')
    }

    const handleImportError = (error: string) => {
        toast.error(`Lỗi khi nhập sản phẩm: ${error}`)
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nhập hàng loạt sản phẩm</h1>
                    <p className="text-muted-foreground">
                        Tải lên file Excel hoặc CSV để nhập nhiều sản phẩm cùng lúc
                    </p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Instructions */}
                <Card
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => setToggleInstruction(!toggleInstruction)}
                >
                    <CardHeader className={toggleInstruction ? 'pb-4' : 'pb-6'}>
                        <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center justify-between">
                            Hướng dẫn sử dụng
                            <div className="transition-transform duration-200">
                                {toggleInstruction ? (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                ) : (
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    {toggleInstruction && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-sm">
                                            1
                                        </div>
                                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Chuẩn bị dữ liệu</h4>
                                    </div>
                                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2 ml-10">
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>Tải về template và điền thông tin sản phẩm</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>Đảm bảo các cột bắt buộc được điền đầy đủ</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>Mã SKU không được trùng lặp</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-1">•</span>
                                            <span>Giá trị số phải đúng định dạng</span>
                                        </li>
                                    </ul>

                                    <div className="flex flex-col md:flex-row md:space-x-4">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownloadTemplate('excel')
                                            }}
                                            variant="outline"
                                            className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải template Excel
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDownloadTemplate('csv')
                                            }}
                                            variant="outline"
                                            className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải template CSV
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 font-bold text-sm">
                                            2
                                        </div>
                                        <h4 className="font-semibold text-green-800 dark:text-green-200">Tải lên file</h4>
                                    </div>
                                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-2 ml-10">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>Kéo thả file hoặc click để upload file</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>Hỗ trợ file Excel (.xlsx) hoặc CSV (.csv)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>Dung lượng tối đa: 10MB</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            <span>Tối đa 1000 sản phẩm mỗi lần import</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                                            3
                                        </div>
                                        <h4 className="font-semibold text-purple-800 dark:text-purple-200">Xem kết quả</h4>
                                    </div>
                                    <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-2 ml-10">
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500 mt-1">•</span>
                                            <span>Hệ thống sẽ kiểm tra và xác thực dữ liệu</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500 mt-1">•</span>
                                            <span>Hiển thị các lỗi (nếu có) để bạn sửa lại</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-purple-500 mt-1">•</span>
                                            <span>Nhập thành công sẽ tự động chuyển về trang danh sách sản phẩm</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Separator />

                {/* Upload Section */}
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                    <CardContent className="pt-0">
                        <BulkImportDropzone
                            onSuccess={handleImportSuccess}
                            onError={handleImportError}
                            isProcessing={isProcessing}
                            setIsProcessing={setIsProcessing}
                        />

                        {/* File Format Info */}
                        <div className="mt-6 pt-6 border-t">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>Định dạng hỗ trợ: .xlsx, .csv</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span>Dung lượng tối đa: 10MB</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span>Tối đa: 1,000 sản phẩm</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span>Cần template chuẩn</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


            </div>
        </div>
    )
}