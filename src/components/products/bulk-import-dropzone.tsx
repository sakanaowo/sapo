'use client'

import { useState, useCallback, useEffect } from 'react'
import * as React from 'react'
import { Dropzone, DropzoneContent } from '@/components/dropzone'
import { useSupabaseUpload } from '@/hooks/use-supabase-upload'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertCircle, CheckCircle, FileSpreadsheet, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { SupplierSelect } from '@/components/suppliers/SupplierSelect'

interface PurchaseOrder {
    purchaseOrderCode: string
    totalAmount: number
    // Add other purchase order fields as needed
}

interface BulkImportDropzoneProps {
    onSuccess: (data: { productCount: number; purchaseOrder: PurchaseOrder }) => void
    onError: (error: string) => void
    isProcessing: boolean
    setIsProcessing: (processing: boolean) => void
}

interface ParsedProduct {
    name: string
    productType?: string // Hình thức quản lý sản phẩm
    description?: string // Mô tả sản phẩm
    brand?: string // Nhãn hiệu
    tags?: string[] // Tags
    variantName?: string // Tên phiên bản sản phẩm
    sku: string // Mã SKU
    barcode?: string // Barcode
    weight?: number // Khối lượng
    weightUnit?: string // Đơn vị khối lượng
    unit: string // Đơn vị
    conversionRate?: number // Quy đổi đơn vị
    imageUrl?: string // Ảnh đại diện
    retailPrice: number // Giá bán lẻ
    importPrice: number // Giá nhập
    wholesalePrice?: number // Giá bán buôn
    taxApplied?: boolean // Áp dụng thuế
    inputTax?: number // Thuế đầu vào (%)
    outputTax?: number // Thuế đầu ra (%)
    initialStock: number // Tồn kho ban đầu
    minStock?: number // Tồn tối thiểu
    maxStock?: number // Tồn tối đa
    warehouseLocation?: string // Điểm lưu kho
    expiryWarningDays?: number // Số ngày cảnh báo hết hạn
    warrantyApplied?: boolean // Áp dụng bảo hành
    // For grouping variants
    productGroup?: string // Used to group variants together
    variants?: ParsedProduct[] // Child variants for this product
}

interface ValidationError {
    row: number
    field: string
    message: string
}
// TODO: create detail dialog
export default function BulkImportDropzone({
    onSuccess,
    onError,
    isProcessing,
    setIsProcessing
}: BulkImportDropzoneProps) {
    const [parsedData, setParsedData] = useState<ParsedProduct[]>([])
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const [step, setStep] = useState<'upload' | 'preview' | 'processing'>('upload')
    const [progress, setProgress] = useState(0)
    const [selectedSupplier, setSelectedSupplier] = useState<string>('')
    const [importNote, setImportNote] = useState<string>('')
    const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

    const uploadProps = useSupabaseUpload({
        bucketName: 'temp-imports',
        allowedMimeTypes: [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 1
    })


    const parseExcelFile = useCallback((file: File): Promise<ParsedProduct[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer)
                    const workbook = XLSX.read(data, { type: 'array' })
                    const firstSheetName = workbook.SheetNames[0]
                    const worksheet = workbook.Sheets[firstSheetName]

                    // Convert to JSON with proper empty cell handling
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '', // Default value for empty cells
                        blankrows: false // Skip completely blank rows
                    })

                    if (jsonData.length < 2) {
                        reject(new Error('File không có dữ liệu hoặc chỉ có header'))
                        return
                    }

                    // Skip header row
                    const rows = jsonData.slice(1) as unknown[][]
                    const products: ParsedProduct[] = []

                    let lastProductName = '' // Track the last product name for grouping

                    rows.forEach((row, rowIndex) => {
                        // Skip completely empty rows
                        if (!row || row.length === 0 || row.every(cell => !cell)) return

                        // Ensure row has enough columns and convert to strings
                        // Pad with empty strings if row is shorter than expected
                        const paddedRow = Array(25).fill('').map((_, index) =>
                            index < row.length && row[index] != null ? String(row[index]).trim() : ''
                        )

                        const product: ParsedProduct = {
                            name: paddedRow[0] || '', // Tên sản phẩm
                            productType: paddedRow[1] || 'Sản phẩm thường', // Hình thức quản lý sản phẩm
                            description: paddedRow[2] || '', // Mô tả sản phẩm
                            brand: paddedRow[3] || '', // Nhãn hiệu
                            tags: paddedRow[4] ? paddedRow[4].split(',').map(tag => tag.trim()).filter(tag => tag) : [], // Tags (separated by comma)
                            variantName: paddedRow[5] || '', // Tên phiên bản sản phẩm
                            sku: paddedRow[6] || '', // Mã SKU
                            barcode: paddedRow[7] || '', // Barcode
                            weight: parseFloat(paddedRow[8]) || 0, // Khối lượng
                            weightUnit: paddedRow[9] || 'g', // Đơn vị khối lượng
                            unit: paddedRow[10] || '', // Đơn vị
                            conversionRate: parseFloat(paddedRow[11]) || 1, // Quy đổi đơn vị
                            imageUrl: paddedRow[12] || '', // Ảnh đại diện
                            retailPrice: parseFloat(paddedRow[13]) || 0, // Giá bán lẻ
                            importPrice: parseFloat(paddedRow[14]) || 0, // Giá nhập
                            wholesalePrice: parseFloat(paddedRow[15]) || 0, // Giá bán buôn
                            taxApplied: paddedRow[16] === 'Có' || paddedRow[16] === 'Yes', // Áp dụng thuế
                            inputTax: parseFloat(paddedRow[17]) || 0, // Thuế đầu vào (%)
                            outputTax: parseFloat(paddedRow[18]) || 0, // Thuế đầu ra (%)
                            initialStock: parseFloat(paddedRow[19]) || 0, // Tồn kho ban đầu
                            minStock: parseFloat(paddedRow[20]) || 0, // Tồn tối thiểu
                            maxStock: parseFloat(paddedRow[21]) || 0, // Tồn tối đa
                            warehouseLocation: paddedRow[22] || '', // Điểm lưu kho
                            expiryWarningDays: parseFloat(paddedRow[23]) || 0, // Số ngày cảnh báo hết hạn
                            warrantyApplied: paddedRow[24] === 'Có' || paddedRow[24] === 'Yes', // Áp dụng bảo hành
                        }


                        // Logic for grouping variants:
                        // If product name is empty, this is a variant of the previous product
                        if (!product.name.trim() && product.variantName?.trim() && lastProductName) {
                            product.name = lastProductName // Use the previous product name
                            product.productGroup = lastProductName
                        } else if (product.name.trim()) {
                            // This is a main product, update the last product name
                            lastProductName = product.name
                            product.productGroup = product.name

                        } else if (product.variantName?.trim()) {
                            // If no product name but has variant name, use variant name as product name
                            product.name = product.variantName
                            product.productGroup = product.variantName
                            lastProductName = product.variantName

                        }

                        // Skip products without both name and variant name
                        if (!product.name.trim() && !product.variantName?.trim()) {
                            console.warn(`Bỏ qua dòng ${rowIndex + 2}: Không có tên sản phẩm và tên variant`)
                            return
                        }

                        products.push(product)
                    })

                    resolve(products)
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = () => reject(new Error('Không thể đọc file'))
            reader.readAsArrayBuffer(file)
        })
    }, [])

    const parseCSVFile = useCallback((file: File): Promise<ParsedProduct[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const text = e.target?.result as string
                    const lines = text.split('\n')

                    if (lines.length < 2) {
                        reject(new Error('File CSV không có dữ liệu hoặc chỉ có header'))
                        return
                    }

                    // Skip header
                    const dataLines = lines.slice(1)
                    const products: ParsedProduct[] = []

                    let lastProductName = '' // Track the last product name for grouping

                    dataLines.forEach((line, lineIndex) => {
                        if (!line.trim()) return // Skip empty lines

                        // Improved CSV parsing to handle commas inside quoted fields
                        const row = []
                        let current = ''
                        let inQuotes = false

                        for (let i = 0; i < line.length; i++) {
                            const char = line[i]
                            if (char === '"') {
                                inQuotes = !inQuotes
                            } else if (char === ',' && !inQuotes) {
                                row.push(current.trim())
                                current = ''
                            } else {
                                current += char
                            }
                        }
                        row.push(current.trim()) // Add the last field

                        const product: ParsedProduct = {
                            name: row[0] || '', // Tên sản phẩm
                            productType: row[1] || 'Sản phẩm thường', // Hình thức quản lý sản phẩm
                            description: row[2] || '', // Mô tả sản phẩm
                            brand: row[3] || '', // Nhãn hiệu
                            tags: row[4] ? row[4].split(',').map(tag => tag.trim()).filter(tag => tag) : [], // Tags (separated by comma)
                            variantName: row[5] || '', // Tên phiên bản sản phẩm
                            sku: row[6] || '', // Mã SKU
                            barcode: row[7] || '', // Barcode
                            weight: parseFloat(row[8]) || 0, // Khối lượng
                            weightUnit: row[9] || 'g', // Đơn vị khối lượng
                            unit: row[10] || '', // Đơn vị
                            conversionRate: parseFloat(row[11]) || 1, // Quy đổi đơn vị
                            imageUrl: row[12] || '', // Ảnh đại diện
                            retailPrice: parseFloat(row[13]) || 0, // Giá bán lẻ
                            importPrice: parseFloat(row[14]) || 0, // Giá nhập
                            wholesalePrice: parseFloat(row[15]) || 0, // Giá bán buôn
                            taxApplied: row[16] === 'Có' || row[16] === 'Yes', // Áp dụng thuế
                            inputTax: parseFloat(row[17]) || 0, // Thuế đầu vào (%)
                            outputTax: parseFloat(row[18]) || 0, // Thuế đầu ra (%)
                            initialStock: parseFloat(row[19]) || 0, // Tồn kho ban đầu
                            minStock: parseFloat(row[20]) || 0, // Tồn tối thiểu
                            maxStock: parseFloat(row[21]) || 0, // Tồn tối đa
                            warehouseLocation: row[22] || '', // Điểm lưu kho
                            expiryWarningDays: parseFloat(row[23]) || 0, // Số ngày cảnh báo hết hạn
                            warrantyApplied: row[24] === 'Có' || row[24] === 'Yes', // Áp dụng bảo hành
                        }

                        // Logic for grouping variants:
                        // If product name is empty, this is a variant of the previous product
                        if (!product.name.trim() && product.variantName?.trim() && lastProductName) {
                            product.name = lastProductName // Use the previous product name
                            product.productGroup = lastProductName
                        } else if (product.name.trim()) {
                            // This is a main product, update the last product name
                            lastProductName = product.name
                            product.productGroup = product.name
                        } else if (product.variantName?.trim()) {
                            // If no product name but has variant name, use variant name as product name
                            product.name = product.variantName
                            product.productGroup = product.variantName
                            lastProductName = product.variantName
                        }

                        // Skip products without both name and variant name
                        if (!product.name.trim() && !product.variantName?.trim()) {
                            console.warn(`Bỏ qua dòng ${lineIndex + 2}: Không có tên sản phẩm và tên variant`)
                            return
                        }

                        products.push(product)
                    })

                    resolve(products)
                } catch (error) {
                    reject(error)
                }
            }
            reader.onerror = () => reject(new Error('Không thể đọc file CSV'))
            reader.readAsText(file, 'utf-8')
        })
    }, [])

    const validateProducts = useCallback((products: ParsedProduct[]): ValidationError[] => {
        const errors: ValidationError[] = []
        const skuSet = new Set<string>()

        products.forEach((product, index) => {
            const row = index + 2 // +2 because of 0-based index and header row

            // Required fields validation
            if (!product.name?.trim()) {
                errors.push({ row, field: 'Tên sản phẩm', message: 'Tên sản phẩm không được để trống' })
            }

            if (!product.sku?.trim()) {
                errors.push({ row, field: 'Mã SKU', message: 'Mã SKU không được để trống' })
            } else {
                // Check for duplicate SKUs
                if (skuSet.has(product.sku)) {
                    errors.push({ row, field: 'Mã SKU', message: `Mã SKU '${product.sku}' bị trùng lặp` })
                } else {
                    skuSet.add(product.sku)
                }
            }

            if (!product.unit?.trim()) {
                errors.push({ row, field: 'Đơn vị', message: 'Đơn vị không được để trống' })
            }

            // Price validation
            if (product.retailPrice < 0) {
                errors.push({ row, field: 'Giá bán lẻ', message: 'Giá bán lẻ không được âm' })
            }

            if (product.importPrice < 0) {
                errors.push({ row, field: 'Giá nhập', message: 'Giá nhập không được âm' })
            }

            if (product.initialStock < 0) {
                errors.push({ row, field: 'Tồn kho ban đầu', message: 'Tồn kho ban đầu không được âm' })
            }

            // Conversion rate validation
            if ((product.conversionRate ?? 1) <= 0) {
                errors.push({ row, field: 'Quy đổi đơn vị', message: 'Quy đổi đơn vị phải lớn hơn 0' })
            }

            // Tax validation
            if ((product.inputTax ?? 0) < 0 || (product.inputTax ?? 0) > 100) {
                errors.push({ row, field: 'Thuế đầu vào', message: 'Thuế đầu vào phải từ 0-100%' })
            }

            if ((product.outputTax ?? 0) < 0 || (product.outputTax ?? 0) > 100) {
                errors.push({ row, field: 'Thuế đầu ra', message: 'Thuế đầu ra phải từ 0-100%' })
            }

            // Variant name validation for grouped products
            if (product.productGroup && product.productGroup !== product.name && !product.variantName?.trim()) {
                errors.push({ row, field: 'Tên phiên bản', message: 'Tên phiên bản sản phẩm không được để trống cho variant' })
            }
        })

        return errors
    }, [])

    const groupProductsByVariants = useCallback((products: ParsedProduct[]): ParsedProduct[] => {
        const grouped = new Map<string, ParsedProduct>()

        products.forEach((product, index) => {
            const groupKey = product.productGroup || product.name

            if (grouped.has(groupKey)) {
                const existingProduct = grouped.get(groupKey)!

                // Initialize variants array if not exists
                if (!existingProduct.variants) {
                    existingProduct.variants = []
                }

                // Check if this is a variant (different SKU, unit, or variant name)
                const isDifferentVariant = product.sku !== existingProduct.sku ||
                    product.unit !== existingProduct.unit ||
                    product.variantName !== existingProduct.variantName ||
                    product.conversionRate !== existingProduct.conversionRate

                if (isDifferentVariant) {
                    existingProduct.variants.push(product)
                } else {
                    // Same product, might be duplicate - log warning
                    console.warn(`Sản phẩm trùng lặp tại dòng ${index + 2}:`, product.name, product.sku)
                }
            } else {
                // First occurrence of this product group
                grouped.set(groupKey, {
                    ...product,
                    variants: []
                })
            }
        })

        return Array.from(grouped.values())
    }, [])

    // Function to calculate conversion information for display
    const getConversionInfo = useCallback((product: ParsedProduct) => {
        if (!product.variants || product.variants.length === 0) {
            return product.conversionRate && product.conversionRate > 1 ?
                `1 ${product.unit} = ${product.conversionRate} đơn vị cơ sở` : null
        }

        // For products with variants, show conversion relationships
        const allVariants = [product, ...product.variants]
        const conversions: string[] = []

        // Sort variants by conversion rate (ascending) to show hierarchy
        const sortedVariants = allVariants.sort((a, b) => (a.conversionRate || 1) - (b.conversionRate || 1))

        // Find the base unit (lowest conversion rate)
        const baseUnit = sortedVariants[0]

        // Show conversion for each variant relative to base unit
        sortedVariants.forEach((variant, index) => {
            if (index > 0) { // Skip base unit
                const baseRate = baseUnit.conversionRate || 1
                const variantRate = variant.conversionRate || 1

                if (variantRate > baseRate) {
                    const ratio = variantRate / baseRate
                    conversions.push(`1 ${variant.unit || 'đv'} = ${ratio} ${baseUnit.unit || 'đv'}`)
                }
            }
        })

        return conversions.length > 0 ? conversions : null
    }, [])

    const toggleProductExpansion = useCallback((productKey: string) => {
        setExpandedProducts(prev => {
            const newSet = new Set(prev)
            if (newSet.has(productKey)) {
                newSet.delete(productKey)
            } else {
                newSet.add(productKey)
            }
            return newSet
        })
    }, [])

    const handleFileProcessing = useCallback(async () => {
        const file = uploadProps.files[0]
        console.log('handleFileProcessing called with file:', file?.name)
        if (!file) return

        setStep('preview')
        setProgress(20)

        try {
            let products: ParsedProduct[]

            if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                console.log('Processing as Excel file')
                products = await parseExcelFile(file)
            } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                console.log('Processing as CSV file')
                products = await parseCSVFile(file)
            } else {
                throw new Error('Định dạng file không được hỗ trợ')
            }

            setProgress(60)

            if (products.length === 0) {
                throw new Error('File không chứa dữ liệu sản phẩm hợp lệ')
            }

            if (products.length > 1000) {
                throw new Error('Chỉ được phép import tối đa 1000 sản phẩm mỗi lần')
            }

            const errors = validateProducts(products)
            setValidationErrors(errors)
            setParsedData(products)
            setProgress(100)

            if (errors.length === 0) {
                toast.success(`Đã xác thực thành công ${products.length} sản phẩm`)
            } else {
                toast.warning(`Tìm thấy ${errors.length} lỗi cần sửa`)
            }

        } catch (error) {
            console.error('Error processing file:', error)
            onError(error instanceof Error ? error.message : 'Lỗi không xác định')
            setStep('upload')
            setProgress(0)
        }
    }, [uploadProps.files, parseExcelFile, parseCSVFile, validateProducts, groupProductsByVariants, onError])

    const handleImport = useCallback(async () => {
        if (validationErrors.length > 0) {
            toast.error('Vui lòng sửa các lỗi trước khi import')
            return
        }

        if (!selectedSupplier) {
            toast.error('Vui lòng chọn nhà cung cấp')
            return
        }

        setStep('processing')
        setIsProcessing(true)
        setProgress(0)

        try {
            // Group products and their variants for processing
            const groupedProducts = groupProductsByVariants(parsedData)
            const transformedProducts: Array<{
                name: string;
                description?: string;
                brand?: string;
                productType?: string;
                tags?: string[];
                sku: string;
                barcode?: string;
                weight?: number;
                weightUnit?: string;
                unit: string;
                imageUrl?: string;
                retailPrice: number;
                importPrice: number;
                wholesalePrice?: number;
                initialStock: number;
                minStock?: number;
                maxStock?: number;
                warehouseLocation?: string;
                taxApplied?: boolean;
                inputTax?: number;
                outputTax?: number;
            }> = []

            // Process each grouped product and its variants
            groupedProducts.forEach(product => {
                // Add main product
                transformedProducts.push({
                    name: product.name,
                    description: product.description,
                    brand: product.brand,
                    productType: product.productType,
                    tags: product.tags,
                    sku: product.sku,
                    barcode: product.barcode,
                    weight: product.weight,
                    weightUnit: product.weightUnit,
                    unit: product.unit,
                    imageUrl: product.imageUrl,
                    retailPrice: product.retailPrice,
                    importPrice: product.importPrice,
                    wholesalePrice: product.wholesalePrice,
                    initialStock: product.initialStock,
                    minStock: product.minStock,
                    maxStock: product.maxStock,
                    warehouseLocation: product.warehouseLocation,
                    taxApplied: product.taxApplied,
                    inputTax: product.inputTax,
                    outputTax: product.outputTax,
                })

                // Add variants if any
                if (product.variants && product.variants.length > 0) {
                    product.variants.forEach(variant => {
                        transformedProducts.push({
                            name: product.name, // Use parent product name
                            description: product.description,
                            brand: product.brand,
                            productType: product.productType,
                            tags: product.tags,
                            sku: variant.sku,
                            barcode: variant.barcode,
                            weight: variant.weight,
                            weightUnit: variant.weightUnit,
                            unit: variant.unit,
                            imageUrl: variant.imageUrl,
                            retailPrice: variant.retailPrice,
                            importPrice: variant.importPrice,
                            wholesalePrice: variant.wholesalePrice,
                            initialStock: variant.initialStock,
                            minStock: variant.minStock,
                            maxStock: variant.maxStock,
                            warehouseLocation: variant.warehouseLocation,
                            taxApplied: variant.taxApplied,
                            inputTax: variant.inputTax,
                            outputTax: variant.outputTax,
                        })
                    })
                }
            })

            const importData = {
                supplierId: selectedSupplier,
                importDate: new Date(),
                note: importNote || `Bulk import ${transformedProducts.length} sản phẩm từ file`,
                products: transformedProducts
            }

            setProgress(30)

            // Import bulkImportProducts action
            const { bulkImportProducts } = await import('@/actions/product.action')

            setProgress(50)

            // Call server action directly
            const result = await bulkImportProducts(importData)

            setProgress(80)

            if (!result.success) {
                throw new Error(result.message || 'Lỗi khi import sản phẩm')
            }

            setProgress(100)
            onSuccess(result.data)

        } catch (error) {
            console.error('Import error:', error)
            onError(error instanceof Error ? error.message : 'Lỗi không xác định khi import')
            setStep('preview')
        } finally {
            setIsProcessing(false)
        }
    }, [validationErrors, selectedSupplier, importNote, parsedData, groupProductsByVariants, setIsProcessing, onSuccess, onError])

    const handleReset = useCallback(() => {
        uploadProps.setFiles([])
        setParsedData([])
        setValidationErrors([])
        setStep('upload')
        setProgress(0)
        setSelectedSupplier('')
        setImportNote('')
        setExpandedProducts(new Set())
    }, [uploadProps])

    // Auto-process file when uploaded
    useEffect(() => {
        console.log('Files changed:', uploadProps.files.length, 'Step:', step)
        if (uploadProps.files.length > 0 && step === 'upload') {
            console.log('Processing file:', uploadProps.files[0]?.name)
            handleFileProcessing()
        }
    }, [uploadProps.files, step, handleFileProcessing])

    if (step === 'processing') {
        return (
            <div className="space-y-6">
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Đang import sản phẩm...</h3>
                    <p className="text-muted-foreground mb-6">Vui lòng đợi, quá trình này có thể mất vài phút</p>

                    <div className="max-w-md mx-auto space-y-3">
                        <Progress value={progress} className="w-full h-3" />
                        <p className="text-sm font-medium">
                            {progress}% hoàn thành
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    if (step === 'preview') {
        return (
            <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Tải lên dữ liệu</span>
                        <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="w-full h-2" />
                </div>

                {/* Validation Results */}
                {validationErrors.length > 0 ? (
                    <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-3">
                                <p className="font-semibold">
                                    Tìm thấy {validationErrors.length} lỗi trong file:
                                </p>
                                <div className="max-h-32 overflow-y-auto space-y-1 bg-background/50 rounded p-3">
                                    {validationErrors.slice(0, 10).map((error, index) => (
                                        <p key={index} className="text-sm font-mono">
                                            <span className="font-bold text-destructive">Dòng {error.row}:</span>{' '}
                                            <span className="text-muted-foreground">{error.field}</span> - {error.message}
                                        </p>
                                    ))}
                                    {validationErrors.length > 10 && (
                                        <p className="text-sm italic text-muted-foreground">
                                            ... và {validationErrors.length - 10} lỗi khác
                                        </p>
                                    )}
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                Tải dữ liệu thành công!
                            </p>
                        </AlertDescription>
                    </Alert>
                )}

                {/* File Info */}
                <Card className="bg-muted/30">
                    <CardContent className="p-4 min-w-0">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileSpreadsheet className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold">{uploadProps.files[0]?.name}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                    <span>{parsedData.length} sản phẩm</span>
                                    <span>•</span>
                                    <span>{(uploadProps.files[0]?.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                            </div>
                        </div>

                        {/* Product Preview Table */}
                        <div className="space-y-3 w-full max-w-full">
                            {/* Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-primary">{parsedData.length}</div>
                                    <div className="text-xs text-muted-foreground">Tổng sản phẩm</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">
                                        {parsedData.filter(p => p.sku).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Mã SKU</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">
                                        {parsedData.filter(p => p.initialStock > 0).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Tồn kho</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">
                                        {parsedData.reduce((sum, p) => sum + (p.initialStock || 0), 0).toLocaleString('vi-VN')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Tổng tồn kho</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-purple-600">
                                        {parsedData.filter(p => (p.conversionRate || 1) > 1).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Quy đổi</div>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="w-full border rounded-lg overflow-hidden">
                                <div className="w-full border rounded-lg">
                                    <div className="relative overflow-x-auto min-w-0">
                                        <Table className="table-fixed min-w-[900px]">
                                            <TableHeader className="sticky top-0 bg-background z-10 border-b">
                                                <TableRow>
                                                    <TableHead className="w-[40px] bg-background"></TableHead>
                                                    <TableHead className="w-[50px] bg-background">STT</TableHead>
                                                    <TableHead className="w-[220px] bg-background">Tên sản phẩm</TableHead>
                                                    <TableHead className="w-[120px] bg-background">SKU</TableHead>
                                                    <TableHead className="w-[80px] bg-background">Đơn vị</TableHead>
                                                    <TableHead className="w-[80px] bg-background">Quy đổi</TableHead>
                                                    <TableHead className="w-[100px] bg-background">Số variant</TableHead>
                                                    <TableHead className="w-[120px] bg-background">Giá nhập</TableHead>
                                                    <TableHead className="w-[100px] bg-background">Tồn kho</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {(() => {
                                                    const groupedProducts = groupProductsByVariants(parsedData)

                                                    const displayedProducts = groupedProducts.slice(0, 50)

                                                    return displayedProducts.map((product, index) => {
                                                        const hasVariants = product.variants && product.variants.length > 0
                                                        const productKey = `${product.name}-${index}`
                                                        const isExpanded = expandedProducts.has(productKey)


                                                        return (
                                                            <React.Fragment key={productKey}>
                                                                {/* Main Product Row */}
                                                                <TableRow className={hasVariants ? "font-medium bg-muted/30" : ""}>
                                                                    <TableCell>
                                                                        {hasVariants && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-6 w-6 p-0"
                                                                                onClick={() => toggleProductExpansion(productKey)}
                                                                            >
                                                                                {isExpanded ?
                                                                                    <ChevronDown className="h-4 w-4" /> :
                                                                                    <ChevronRight className="h-4 w-4" />
                                                                                }
                                                                            </Button>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium text-muted-foreground">
                                                                        {index + 1}
                                                                    </TableCell>
                                                                    <TableCell className="font-medium">
                                                                        <div>
                                                                            <div className="font-semibold" title={product.name}>
                                                                                {product.name || '—'}
                                                                            </div>
                                                                            {product.variantName && product.variantName !== product.name && (
                                                                                <div className="text-sm text-muted-foreground" title={product.variantName}>
                                                                                    {product.variantName}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="font-mono text-sm">
                                                                        {product.sku || '—'}
                                                                    </TableCell>
                                                                    <TableCell className="text-center text-sm">
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                                            {product.unit || '—'}
                                                                        </span>
                                                                    </TableCell>
                                                                    <TableCell className="text-center text-sm">
                                                                        {(product.conversionRate && product.conversionRate > 1) ? (
                                                                            <div className="space-y-1">
                                                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                                                                                    {product.conversionRate}x
                                                                                </span>
                                                                                {(() => {
                                                                                    const conversionInfo = getConversionInfo(product)
                                                                                    return conversionInfo && (
                                                                                        <div className="text-xs text-muted-foreground">
                                                                                            {Array.isArray(conversionInfo) ? conversionInfo[0] : conversionInfo}
                                                                                        </div>
                                                                                    )
                                                                                })()}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">1x</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-center">
                                                                        {hasVariants ? (
                                                                            <span
                                                                                className="text-blue-600 font-medium cursor-help"
                                                                                title={`1 sản phẩm chính + ${product.variants?.length || 0} variant = ${(product.variants?.length || 0) + 1} tổng cộng`}
                                                                            >
                                                                                {(product.variants?.length || 0) + 1}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">1</span>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-right font-medium">
                                                                        {product.importPrice ?
                                                                            new Intl.NumberFormat('vi-VN', {
                                                                                style: 'currency',
                                                                                currency: 'VND'
                                                                            }).format(product.importPrice)
                                                                            : '—'
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell className="text-right">
                                                                        <div className="text-sm font-medium">
                                                                            {(product.initialStock || 0).toLocaleString('vi-VN')}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {product.unit || 'đơn vị'}
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>

                                                                {/* Variant Rows */}
                                                                {hasVariants && isExpanded && product.variants?.map((variant, variantIndex) => (
                                                                    <TableRow key={`${productKey}-variant-${variantIndex}`} className="bg-muted/10">
                                                                        <TableCell></TableCell>
                                                                        <TableCell className="text-muted-foreground text-sm">
                                                                            {index + 1}.{variantIndex + 1}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="ml-4">
                                                                                <div className="text-sm font-medium" title={variant.variantName}>
                                                                                    {variant.variantName || variant.name || '—'}
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="font-mono text-sm">
                                                                            {variant.sku || '—'}
                                                                        </TableCell>
                                                                        <TableCell className="text-center text-sm">
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                                                                                {variant.unit || '—'}
                                                                            </span>
                                                                        </TableCell>
                                                                        <TableCell className="text-center text-sm">
                                                                            {(variant.conversionRate && variant.conversionRate > 1) ? (
                                                                                <div className="space-y-1">
                                                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">
                                                                                        {variant.conversionRate}x
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-muted-foreground">1x</span>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell className="text-center text-muted-foreground text-sm">
                                                                            —
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-sm">
                                                                            {variant.importPrice ?
                                                                                new Intl.NumberFormat('vi-VN', {
                                                                                    style: 'currency',
                                                                                    currency: 'VND'
                                                                                }).format(variant.importPrice)
                                                                                : '—'
                                                                            }
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-sm">
                                                                            <div className="font-medium">
                                                                                {(variant.initialStock || 0).toLocaleString('vi-VN')}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {variant.unit || 'đơn vị'}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}

                                                                {/* Conversion Summary Row */}
                                                                {/* {hasVariants && isExpanded && product.variants && product.variants.length > 0 && (
                                                                    <TableRow className="bg-purple-50/50">
                                                                        <TableCell colSpan={2}></TableCell>
                                                                        <TableCell colSpan={7} className="text-center py-2">
                                                                            <div className="text-xs text-purple-700 font-medium">
                                                                                {(() => {
                                                                                    const allVariants = [product, ...product.variants]
                                                                                    const conversions = []

                                                                                    // Sort by conversion rate
                                                                                    const sorted = allVariants.sort((a, b) => (a.conversionRate || 1) - (b.conversionRate || 1))

                                                                                    for (let i = 0; i < sorted.length - 1; i++) {
                                                                                        const from = sorted[i]
                                                                                        const to = sorted[i + 1]
                                                                                        const ratio = (to.conversionRate || 1) / (from.conversionRate || 1)

                                                                                        if (ratio > 1) {
                                                                                            conversions.push(`1 ${to.unit} = ${ratio} ${from.unit}`)
                                                                                        }
                                                                                    }

                                                                                    return conversions.length > 0
                                                                                        ? `📊 Quy đổi: ${conversions.join(' • ')}`
                                                                                        : '📊 Không có quy đổi được xác định'
                                                                                })()}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )} */}
                                                            </React.Fragment>
                                                        )
                                                    })
                                                })()}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                            {parsedData.length > 50 && (
                                <div className="p-3 bg-muted/50 border-t text-center text-sm text-muted-foreground">
                                    Hiển thị 50 sản phẩm đầu tiên. Tổng cộng: {parsedData.length} sản phẩm
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Import Settings */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Thông tin nhập hàng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="supplier" className="text-sm font-medium">
                                Nhà cung cấp <span className="text-destructive">*</span>
                            </Label>
                            <SupplierSelect
                                value={selectedSupplier}
                                onChange={setSelectedSupplier}
                                placeholder="Chọn nhà cung cấp"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="note" className="text-sm font-medium">Ghi chú</Label>
                            <Textarea
                                id="note"
                                placeholder="Ghi chú cho đơn nhập hàng..."
                                value={importNote}
                                onChange={(e) => setImportNote(e.target.value)}
                                className="resize-none mt-1"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        onClick={handleImport}
                        disabled={validationErrors.length > 0 || isProcessing || !selectedSupplier}
                        className="flex-1 h-11"
                        size="lg"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang import...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Import {parsedData.length} sản phẩm
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isProcessing}
                        className="h-11"
                        size="lg"
                    >
                        Chọn file khác
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 min-w-0">
            <Dropzone {...uploadProps} className="min-h-[200px] border-2 border-dashed border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all duration-200">
                {uploadProps.files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <FileSpreadsheet className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold">Kéo thả file vào đây</h3>
                            <p className="text-muted-foreground">
                                hoặc
                            </p>
                            <Button
                                variant="outline"
                                onClick={uploadProps.open}
                                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                                <FileSpreadsheet className="h-4 w-4 mr-2" />
                                Chọn file
                            </Button>
                            <div className="text-sm text-muted-foreground">
                                Hỗ trợ file .xlsx, .csv (tối đa 10MB)
                            </div>
                        </div>
                    </div>
                ) : null}
                <DropzoneContent />
            </Dropzone>

            {uploadProps.files.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">{uploadProps.files[0]?.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(uploadProps.files[0]?.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => uploadProps.setFiles([])}
                            className="h-8 px-3"
                        >
                            Xóa
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
