// Interfaces và types cho bulk import
export interface PurchaseOrder {
    purchaseOrderCode: string
    totalAmount: number
    // Add other purchase order fields as needed
}

export interface ParsedProduct {
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

export interface ValidationError {
    row: number
    field: string
    message: string
}

export interface BulkImportDropzoneProps {
    onSuccess: (data: { productCount: number; purchaseOrder: PurchaseOrder }) => void
    onError: (error: string) => void
    isProcessing: boolean
    setIsProcessing: (processing: boolean) => void
}

export interface TransformedProduct {
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
}

export interface ImportData {
    supplierId: string;
    importDate: Date;
    note: string;
    products: TransformedProduct[];
}

// Constants
export const BULK_IMPORT_CONSTANTS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 1,
    MAX_PRODUCTS_PER_IMPORT: 1000,
    PREVIEW_LIMIT: 50,

    // File types
    ALLOWED_MIME_TYPES: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
    ],

    // Default values
    DEFAULT_PRODUCT_TYPE: 'Sản phẩm thường',
    DEFAULT_WEIGHT_UNIT: 'g',
    DEFAULT_CONVERSION_RATE: 1,
    DEFAULT_COLUMNS_COUNT: 25,

    // Progress values
    PROGRESS: {
        FILE_UPLOAD: 20,
        FILE_PARSING: 60,
        VALIDATION_COMPLETE: 100,
        IMPORT_START: 30,
        IMPORT_PROCESSING: 50,
        IMPORT_FINALIZING: 80,
        IMPORT_COMPLETE: 100
    },

    // Excel/CSV column mapping
    COLUMN_INDICES: {
        NAME: 0,
        PRODUCT_TYPE: 1,
        DESCRIPTION: 2,
        BRAND: 3,
        TAGS: 4,
        VARIANT_NAME: 5,
        SKU: 6,
        BARCODE: 7,
        WEIGHT: 8,
        WEIGHT_UNIT: 9,
        UNIT: 10,
        CONVERSION_RATE: 11,
        IMAGE_URL: 12,
        RETAIL_PRICE: 13,
        IMPORT_PRICE: 14,
        WHOLESALE_PRICE: 15,
        TAX_APPLIED: 16,
        INPUT_TAX: 17,
        OUTPUT_TAX: 18,
        INITIAL_STOCK: 19,
        MIN_STOCK: 20,
        MAX_STOCK: 21,
        WAREHOUSE_LOCATION: 22,
        EXPIRY_WARNING_DAYS: 23,
        WARRANTY_APPLIED: 24
    },

    // Validation messages
    VALIDATION_MESSAGES: {
        PRODUCT_NAME_REQUIRED: 'Tên sản phẩm không được để trống',
        SKU_REQUIRED: 'Mã SKU không được để trống',
        SKU_DUPLICATE: 'Mã SKU bị trùng lặp',
        UNIT_REQUIRED: 'Đơn vị không được để trống',
        RETAIL_PRICE_NEGATIVE: 'Giá bán lẻ không được âm',
        IMPORT_PRICE_NEGATIVE: 'Giá nhập không được âm',
        INITIAL_STOCK_NEGATIVE: 'Tồn kho ban đầu không được âm',
        CONVERSION_RATE_INVALID: 'Quy đổi đơn vị phải lớn hơn 0',
        INPUT_TAX_INVALID: 'Thuế đầu vào phải từ 0-100%',
        OUTPUT_TAX_INVALID: 'Thuế đầu ra phải từ 0-100%',
        VARIANT_NAME_REQUIRED: 'Tên phiên bản sản phẩm không được để trống cho variant'
    },

    // Error messages
    ERROR_MESSAGES: {
        UNSUPPORTED_FORMAT: 'Định dạng file không được hỗ trợ',
        NO_DATA: 'File không chứa dữ liệu sản phẩm hợp lệ',
        NO_HEADER: 'File không có dữ liệu hoặc chỉ có header',
        CSV_NO_HEADER: 'File CSV không có dữ liệu hoặc chỉ có header',
        TOO_MANY_PRODUCTS: 'Chỉ được phép import tối đa 1000 sản phẩm mỗi lần',
        FILE_READ_ERROR: 'Không thể đọc file',
        CSV_READ_ERROR: 'Không thể đọc file CSV',
        SUPPLIER_REQUIRED: 'Vui lòng chọn nhà cung cấp',
        VALIDATION_ERRORS_EXIST: 'Vui lòng sửa các lỗi trước khi import',
        IMPORT_FAILED: 'Lỗi khi import sản phẩm',
        UNKNOWN_ERROR: 'Lỗi không xác định'
    },

    // Success messages
    SUCCESS_MESSAGES: {
        VALIDATION_SUCCESS: 'Đã xác thực thành công {count} sản phẩm',
        VALIDATION_WITH_ERRORS: 'Tìm thấy {count} lỗi cần sửa'
    }
} as const;

// Types cho steps
export type ImportStep = 'upload' | 'preview' | 'processing';

// Utility types
export type FileType = 'excel' | 'csv';
