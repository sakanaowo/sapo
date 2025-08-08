"use server";

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

interface GetProductsParams {
    page?: number;
    limit?: number;
    search?: string;
    select?: string[];
}
interface PaginatedResult {
    data: unknown[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export async function getProducts({
    page = 1,
    limit = 20,
    search = ''
}: GetProductsParams = {}): Promise<PaginatedResult> {
    // Normalize search term for cache key
    const normalizedSearch = search.trim().toLowerCase();
    const cacheKey = `products-p${page}-l${limit}-s${normalizedSearch ? normalizedSearch : 'all'}`;

    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Build where clause for search
        const whereClause = normalizedSearch
            ? { name: { contains: normalizedSearch, mode: 'insensitive' as const } }
            : {};

        // Get total count for pagination (cached separately)
        const countCacheKey = `products-count-s${normalizedSearch ? normalizedSearch : 'all'}`;
        let totalCount: number = 0;
        const cacheCount = await redis.get(countCacheKey);
        if (!cacheCount) {
            totalCount = await prisma.product.count({ where: whereClause });
            await redis.setEx(countCacheKey, 3600, totalCount.toString());
        } else {
            totalCount = parseInt(cacheCount);
        }

        const products = await prisma.product.findMany({
            where: whereClause,
            select: {
                productId: true,
                name: true,
                productType: true,
                brand: true,
                createdAt: true,
                variants: {
                    select: {
                        variantId: true,
                        variantName: true,
                        sku: true,
                        imageUrl: true,
                        retailPrice: true,
                        createdAt: true,
                        inventory: {
                            select: {
                                currentStock: true,
                            },
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Convert BigInt to string for JSON serialization
        const serializedProducts = JSON.parse(JSON.stringify(products, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Build result with pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const result: PaginatedResult = {
            data: serializedProducts,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };

        // Cache for 60 minutes
        await redis.setEx(cacheKey, 3600, JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getProductById(id: string, selectFields?: string[]) {
    const cacheKey = `product-${id}-${selectFields ? selectFields.join('-') : 'full'}`;

    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Define default selections - core product data
        const baseSelect = {
            productId: true,
            name: true,
            description: true,
            brand: true,
            productType: true,
            tags: true,
            createdAt: true,
        };

        // Define variant selection based on need
        const variantSelect = {
            variantId: true,
            sku: true,
            barcode: true,
            variantName: true,
            weight: true,
            weightUnit: true,
            unit: true,
            imageUrl: true,
            retailPrice: true,
            wholesalePrice: true,
            importPrice: true,
            taxApplied: true,
        };

        // Only include these when needed
        const extendedVariantSelect = {
            ...variantSelect,
            inputTax: true,
            outputTax: true,
            createdAt: true,
            // Add related data more selectively
            inventory: !selectFields || selectFields.includes('inventory') ? {
                select: {
                    inventoryId: true,
                    currentStock: true,
                    // Only include additional fields when specifically requested
                    ...((!selectFields || selectFields.includes('inventoryDetails')) && {
                        initialStock: true,
                        minStock: true,
                        maxStock: true,
                        warehouseLocation: true,
                        updatedAt: true,
                    }),
                },
            } : false,
            warranty: !selectFields || selectFields.includes('warranty') ? {
                select: {
                    warrantyId: true,
                    expirationWarningDays: true,
                    warrantyPolicy: true,
                    createdAt: true,
                },
            } : false,
            // Conversions are expensive to query - only include when needed
            fromConversions: !selectFields || selectFields.includes('conversions') ? {
                select: {
                    conversionId: true,
                    toVariantId: true,
                    conversionRate: true,
                    createdAt: true,
                    toVariant: {
                        select: {
                            variantId: true,
                            variantName: true,
                            sku: true,
                            unit: true,
                        },
                    },
                },
            } : false,
            toConversions: !selectFields || selectFields.includes('conversions') ? {
                select: {
                    conversionId: true,
                    fromVariantId: true,
                    conversionRate: true,
                    createdAt: true,
                    fromVariant: {
                        select: {
                            variantId: true,
                            variantName: true,
                            sku: true,
                            unit: true,
                        },
                    },
                },
            } : false,
        };

        // Build query based on selectFields parameter
        const select = {
            ...baseSelect,
            variants: {
                select: selectFields && !selectFields.includes('variantDetails')
                    ? variantSelect
                    : extendedVariantSelect
            }
        };

        // Execute query with optimized selection
        const product = await prisma.product.findUnique({
            where: { productId: BigInt(id) },
            select,
        });

        if (!product) {
            throw new Error('Product not found');
        }

        const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Cache for 1 hour (adjust cache time based on data update frequency)
        await redis.setEx(cacheKey, 3600, JSON.stringify(serializedProduct));
        return serializedProduct;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}

export async function flushAllCache() {
    try {
        await redis.flushAll();
    } catch (error) {
        console.error('Error flushing all cache:', error);
        throw error;
    }
}

export async function addOneProduct(data: {
    name: string;
    description: string;
    brand: string;
    productType: string;
    tags: string[];
    sku: string;
    barcode?: string;
    weight: number;
    weightUnit: string;
    unit: string;
    imageUrl?: string; // Thêm field này
    retailPrice: number;
    importPrice: number;
    wholesalePrice: number;
    initialStock: number;
    currentStock: number;
    minStock: number;
    maxStock: number;
    warehouseLocation: string;
    unitConversions?: {
        unit: string;
        conversionRate: number;
    }[];
    allowSale: boolean;
    taxApplied: boolean;
    inputTax: number;
    outputTax: number;
    supplierId?: string; // Thêm field này để tạo purchase order
    createPurchaseOrder?: boolean; // Flag để quyết định có tạo purchase order hay không
}) {
    try {
        // Validation
        if (!data.name.trim()) {
            throw new Error('Tên sản phẩm không được để trống');
        }
        if (!data.sku.trim()) {
            throw new Error('Mã SKU không được để trống');
        }
        if (data.retailPrice <= 0) {
            throw new Error('Giá bán lẻ phải lớn hơn 0');
        }

        // Check SKU duplicate
        const existingSku = await prisma.productVariant.findUnique({
            where: { sku: data.sku }
        });
        if (existingSku) {
            throw new Error('Mã SKU đã tồn tại');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Tạo Product và Variant chính
            const product = await tx.product.create({
                data: {
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    brand: data.brand?.trim() || null,
                    productType: data.productType || "Sản phẩm thường",
                    tags: data.tags.length > 0 ? data.tags.join(',') : null,
                    variants: {
                        create: {
                            sku: data.sku.trim(),
                            barcode: data.barcode?.trim() || null,
                            variantName: `${data.name.trim()} - ${data.unit}`,
                            weight: data.weight || 0,
                            weightUnit: data.weightUnit || "g",
                            unit: data.unit?.trim() || "",
                            imageUrl: data.imageUrl || null, // Sử dụng imageUrl từ form
                            retailPrice: data.retailPrice,
                            wholesalePrice: data.wholesalePrice || 0,
                            importPrice: data.importPrice || 0,
                            taxApplied: data.taxApplied || false,
                            inputTax: data.inputTax || 0,
                            outputTax: data.outputTax || 0,
                            inventory: {
                                create: {
                                    initialStock: data.initialStock || 0,
                                    currentStock: data.currentStock || 0,
                                    minStock: data.minStock || 0,
                                    maxStock: data.maxStock || 0,
                                    warehouseLocation: data.warehouseLocation?.trim() || null,
                                },
                            },
                        },
                    },
                },
                include: {
                    variants: {
                        include: {
                            inventory: true,
                        },
                    },
                },
            });

            const baseVariant = product.variants[0];

            // Tạo Unit Conversions (chỉ tạo metadata conversion, không tạo variant mới)
            if (data.unitConversions && data.unitConversions.length > 0) {
                for (const conv of data.unitConversions) {
                    if (conv.unit.trim() && conv.conversionRate > 0) {
                        // Tạo variant cho đơn vị lớn hơn
                        const convVariant = await tx.productVariant.create({
                            data: {
                                productId: product.productId,
                                sku: `${data.sku}-${conv.unit.trim()}`,
                                variantName: `${data.name.trim()} - ${conv.unit}`,
                                weight: data.weight * conv.conversionRate,
                                weightUnit: data.weightUnit,
                                unit: conv.unit.trim(),
                                retailPrice: data.retailPrice * conv.conversionRate,
                                wholesalePrice: data.wholesalePrice * conv.conversionRate,
                                importPrice: data.importPrice * conv.conversionRate,
                                taxApplied: data.taxApplied,
                                inputTax: data.inputTax,
                                outputTax: data.outputTax,
                                barcode: null,
                                imageUrl: data.imageUrl || null, // Dùng chung ảnh
                            },
                        });

                        // Tạo conversion relationship
                        await tx.unitConversion.create({
                            data: {
                                fromVariantId: baseVariant.variantId,
                                toVariantId: convVariant.variantId,
                                conversionRate: conv.conversionRate,
                            },
                        });
                    }
                }
            }

            // Tạo Purchase Order nếu có initialStock > 0 và có supplierId
            let purchaseOrder = null;
            if (data.createPurchaseOrder && data.initialStock > 0 && data.supplierId) {
                // Kiểm tra supplier có tồn tại không
                const supplier = await tx.supplier.findUnique({
                    where: { supplierId: BigInt(data.supplierId) }
                });

                if (!supplier) {
                    throw new Error('Nhà cung cấp không tồn tại');
                }

                // Tạo mã Purchase Order duy nhất
                const purchaseOrderCode = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

                // Tạo Purchase Order
                purchaseOrder = await tx.purchaseOrder.create({
                    data: {
                        purchaseOrderCode,
                        supplierId: BigInt(data.supplierId),
                        createdBy: null, // Có thể thêm user ID sau
                        importDate: new Date(),
                        status: 'COMPLETED', // Đánh dấu đã hoàn thành vì đã nhập hàng
                        importStatus: 'IMPORTED',
                        purchaseOrderDetails: {
                            create: {
                                variantId: baseVariant.variantId,
                                quantity: data.initialStock,
                                unitPrice: data.importPrice,
                                discount: 0,
                                totalAmount: data.initialStock * data.importPrice,
                            },
                        },
                    },
                    include: {
                        supplier: true,
                        purchaseOrderDetails: true,
                    },
                });

                // Nếu có unit conversions, cũng tạo purchase order details cho chúng
                if (data.unitConversions && data.unitConversions.length > 0) {
                    const conversionVariants = await tx.productVariant.findMany({
                        where: {
                            productId: product.productId,
                            variantId: { not: baseVariant.variantId }
                        }
                    });

                    for (const convVariant of conversionVariants) {
                        // Tính số lượng tương ứng cho đơn vị lớn hơn
                        const conversionRate = data.unitConversions.find(c =>
                            convVariant.unit === c.unit
                        )?.conversionRate || 1;

                        const convertedQuantity = data.initialStock / conversionRate;

                        if (convertedQuantity >= 1) {
                            await tx.purchaseOrderDetail.create({
                                data: {
                                    purchaseOrderId: purchaseOrder.purchaseOrderId,
                                    variantId: convVariant.variantId,
                                    quantity: convertedQuantity,
                                    unitPrice: convVariant.importPrice,
                                    discount: 0,
                                    totalAmount: convertedQuantity * convVariant.importPrice,
                                },
                            });
                        }
                    }
                }
            }

            return { product, purchaseOrder };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            product: serialized.product,
            purchaseOrder: serialized.purchaseOrder,
            message: serialized.purchaseOrder
                ? `Sản phẩm và đơn nhập hàng ${serialized.purchaseOrder.purchaseOrderCode} đã được tạo thành công`
                : 'Sản phẩm đã được tạo thành công'
        };
    } catch (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// TODO: check logic

export async function createPurchaseOrderForProduct(data: {
    variantId: string;
    supplierId: string;
    quantity: number;
    unitPrice: number;
    importDate?: Date;
    note?: string;
}) {
    try {
        // Validation
        if (!data.variantId || !data.supplierId) {
            throw new Error('Variant ID và Supplier ID là bắt buộc');
        }
        if (data.quantity <= 0) {
            throw new Error('Số lượng phải lớn hơn 0');
        }
        if (data.unitPrice < 0) {
            throw new Error('Giá nhập không được âm');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra variant có tồn tại không
            const variant = await tx.productVariant.findUnique({
                where: { variantId: BigInt(data.variantId) },
                include: {
                    product: true,
                    inventory: true,
                }
            });

            if (!variant) {
                throw new Error('Sản phẩm không tồn tại');
            }

            // Kiểm tra supplier có tồn tại không
            const supplier = await tx.supplier.findUnique({
                where: { supplierId: BigInt(data.supplierId) }
            });

            if (!supplier) {
                throw new Error('Nhà cung cấp không tồn tại');
            }

            // Tạo mã Purchase Order duy nhất
            const purchaseOrderCode = `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Tạo Purchase Order
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    purchaseOrderCode,
                    supplierId: BigInt(data.supplierId),
                    createdBy: null, // Có thể thêm user ID sau
                    importDate: data.importDate || new Date(),
                    status: 'COMPLETED',
                    importStatus: 'IMPORTED',
                    purchaseOrderDetails: {
                        create: {
                            variantId: BigInt(data.variantId),
                            quantity: data.quantity,
                            unitPrice: data.unitPrice,
                            discount: 0,
                            totalAmount: data.quantity * data.unitPrice,
                        },
                    },
                },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                }
                            }
                        }
                    },
                },
            });

            // Cập nhật inventory
            if (variant.inventory) {
                await tx.inventory.update({
                    where: { inventoryId: variant.inventory.inventoryId },
                    data: {
                        currentStock: {
                            increment: data.quantity
                        },
                        updatedAt: new Date(),
                    },
                });
            } else {
                // Tạo inventory nếu chưa có
                await tx.inventory.create({
                    data: {
                        variantId: BigInt(data.variantId),
                        initialStock: data.quantity,
                        currentStock: data.quantity,
                        minStock: 0,
                        maxStock: 0,
                    },
                });
            }

            return purchaseOrder;
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đơn nhập hàng ${serialized.purchaseOrderCode} đã được tạo thành công`
        };
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return {
            success: false,
            message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function getSuppliers() {
    try {
        const suppliers = await prisma.supplier.findMany({
            select: {
                supplierId: true,
                supplierCode: true,
                name: true,
                status: true,
            },
            where: {
                status: 'ACTIVE', // Chỉ lấy supplier đang hoạt động
            },
            orderBy: {
                name: 'asc',
            },
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(suppliers, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return serialized;
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(`Failed to fetch suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getPurchaseOrdersByProduct(productId: string) {
    try {
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                purchaseOrderDetails: {
                    some: {
                        variant: {
                            productId: BigInt(productId)
                        }
                    }
                }
            },
            include: {
                supplier: {
                    select: {
                        supplierId: true,
                        name: true,
                        supplierCode: true,
                    }
                },
                purchaseOrderDetails: {
                    where: {
                        variant: {
                            productId: BigInt(productId)
                        }
                    },
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        productId: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(purchaseOrders, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return serialized;
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw new Error(`Failed to fetch purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updatePurchaseOrderStatus(purchaseOrderId: string, status: string, importStatus?: string) {
    try {
        const updatedPurchaseOrder = await prisma.purchaseOrder.update({
            where: { purchaseOrderId: BigInt(purchaseOrderId) },
            data: {
                status,
                ...(importStatus && { importStatus }),
                ...(status === 'COMPLETED' && { importDate: new Date() }),
            },
            include: {
                supplier: true,
                purchaseOrderDetails: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                                inventory: true,
                            }
                        }
                    }
                }
            }
        });

        // Nếu status là COMPLETED và importStatus là IMPORTED, cập nhật inventory
        if (status === 'COMPLETED' && importStatus === 'IMPORTED') {
            await prisma.$transaction(async (tx) => {
                for (const detail of updatedPurchaseOrder.purchaseOrderDetails) {
                    if (detail.variant.inventory) {
                        await tx.inventory.update({
                            where: { inventoryId: detail.variant.inventory.inventoryId },
                            data: {
                                currentStock: {
                                    increment: detail.quantity
                                },
                                updatedAt: new Date(),
                            },
                        });
                    } else {
                        // Tạo inventory nếu chưa có
                        await tx.inventory.create({
                            data: {
                                variantId: detail.variantId,
                                initialStock: detail.quantity,
                                currentStock: detail.quantity,
                                minStock: 0,
                                maxStock: 0,
                            },
                        });
                    }
                }
            });
        }

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(updatedPurchaseOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: 'Đơn nhập hàng đã được cập nhật thành công'
        };
    } catch (error) {
        console.error('Error updating purchase order:', error);
        return {
            success: false,
            message: `Failed to update purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function bulkImportProducts(data: {
    supplierId: string;
    importDate?: Date;
    note?: string;
    products: Array<{
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
        unitConversions?: {
            unit: string;
            conversionRate: number;
        }[];
        taxApplied?: boolean;
        inputTax?: number;
        outputTax?: number;
    }>;
}) {
    try {
        // Validation
        if (!data.supplierId) {
            throw new Error('Supplier ID là bắt buộc');
        }
        if (!data.products || data.products.length === 0) {
            throw new Error('Danh sách sản phẩm không được rỗng');
        }

        // Validate từng sản phẩm
        for (let i = 0; i < data.products.length; i++) {
            const product = data.products[i];
            if (!product.name?.trim()) {
                throw new Error(`Tên sản phẩm tại dòng ${i + 1} không được để trống`);
            }
            if (!product.sku?.trim()) {
                throw new Error(`Mã SKU tại dòng ${i + 1} không được để trống`);
            }
            if (product.retailPrice <= 0) {
                throw new Error(`Giá bán lẻ tại dòng ${i + 1} phải lớn hơn 0`);
            }
            if (product.initialStock < 0) {
                throw new Error(`Số lượng nhập tại dòng ${i + 1} không được âm`);
            }
        }

        // Kiểm tra SKU trùng lặp trong batch
        const skuSet = new Set();
        for (const product of data.products) {
            if (skuSet.has(product.sku)) {
                throw new Error(`Mã SKU "${product.sku}" bị trùng lặp trong danh sách nhập`);
            }
            skuSet.add(product.sku);
        }

        // Kiểm tra SKU đã tồn tại trong database
        const existingSKUs = await prisma.productVariant.findMany({
            where: {
                sku: {
                    in: data.products.map(p => p.sku)
                }
            },
            select: { sku: true }
        });

        if (existingSKUs.length > 0) {
            throw new Error(`Các mã SKU sau đã tồn tại: ${existingSKUs.map(s => s.sku).join(', ')}`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra supplier có tồn tại không
            const supplier = await tx.supplier.findUnique({
                where: { supplierId: BigInt(data.supplierId) }
            });

            if (!supplier) {
                throw new Error('Nhà cung cấp không tồn tại');
            }

            // Tạo mã Purchase Order duy nhất
            const purchaseOrderCode = `PO-BULK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Tạo Purchase Order trước
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    purchaseOrderCode,
                    supplierId: BigInt(data.supplierId),
                    createdBy: null, // Có thể thêm user ID sau
                    importDate: data.importDate || new Date(),
                    status: 'COMPLETED',
                    importStatus: 'IMPORTED',
                },
            });

            const createdProducts = [];
            let totalAmount = 0;

            // Tạo từng sản phẩm và variant
            for (const productData of data.products) {
                // Tạo Product và Variant chính
                const product = await tx.product.create({
                    data: {
                        name: productData.name.trim(),
                        description: productData.description?.trim() || null,
                        brand: productData.brand?.trim() || null,
                        productType: productData.productType || "Sản phẩm thường",
                        tags: productData.tags && productData.tags.length > 0 ? productData.tags.join(',') : null,
                        variants: {
                            create: {
                                sku: productData.sku.trim(),
                                barcode: productData.barcode?.trim() || null,
                                variantName: `${productData.name.trim()} - ${productData.unit}`,
                                weight: productData.weight || 0,
                                weightUnit: productData.weightUnit || "g",
                                unit: productData.unit?.trim() || "",
                                imageUrl: productData.imageUrl || null,
                                retailPrice: productData.retailPrice,
                                wholesalePrice: productData.wholesalePrice || 0,
                                importPrice: productData.importPrice || 0,
                                taxApplied: productData.taxApplied || false,
                                inputTax: productData.inputTax || 0,
                                outputTax: productData.outputTax || 0,
                                inventory: {
                                    create: {
                                        initialStock: productData.initialStock || 0,
                                        currentStock: productData.initialStock || 0,
                                        minStock: productData.minStock || 0,
                                        maxStock: productData.maxStock || 0,
                                        warehouseLocation: productData.warehouseLocation?.trim() || null,
                                    },
                                },
                            },
                        },
                    },
                    include: {
                        variants: {
                            include: {
                                inventory: true,
                            },
                        },
                    },
                });

                const baseVariant = product.variants[0];
                const variantIds = [baseVariant.variantId];

                // Tạo Unit Conversions nếu có
                if (productData.unitConversions && productData.unitConversions.length > 0) {
                    for (const conv of productData.unitConversions) {
                        if (conv.unit.trim() && conv.conversionRate > 0) {
                            const convVariant = await tx.productVariant.create({
                                data: {
                                    productId: product.productId,
                                    sku: `${productData.sku}-${conv.unit.trim()}`,
                                    variantName: `${productData.name.trim()} - ${conv.unit}`,
                                    weight: (productData.weight || 0) * conv.conversionRate,
                                    weightUnit: productData.weightUnit || "g",
                                    unit: conv.unit.trim(),
                                    retailPrice: productData.retailPrice * conv.conversionRate,
                                    wholesalePrice: (productData.wholesalePrice || 0) * conv.conversionRate,
                                    importPrice: (productData.importPrice || 0) * conv.conversionRate,
                                    taxApplied: productData.taxApplied || false,
                                    inputTax: productData.inputTax || 0,
                                    outputTax: productData.outputTax || 0,
                                    barcode: null,
                                    imageUrl: productData.imageUrl || null,
                                },
                            });

                            variantIds.push(convVariant.variantId);

                            // Tạo conversion relationship
                            await tx.unitConversion.create({
                                data: {
                                    fromVariantId: baseVariant.variantId,
                                    toVariantId: convVariant.variantId,
                                    conversionRate: conv.conversionRate,
                                },
                            });
                        }
                    }
                }

                // Tạo Purchase Order Detail cho variant chính (chỉ variant chính có stock)
                if (productData.initialStock > 0) {
                    const detailAmount = productData.initialStock * productData.importPrice;
                    totalAmount += detailAmount;

                    await tx.purchaseOrderDetail.create({
                        data: {
                            purchaseOrderId: purchaseOrder.purchaseOrderId,
                            variantId: baseVariant.variantId,
                            quantity: productData.initialStock,
                            unitPrice: productData.importPrice,
                            discount: 0,
                            totalAmount: detailAmount,
                        },
                    });
                }

                createdProducts.push({
                    product,
                    variantIds,
                    detailAmount: productData.initialStock * productData.importPrice
                });
            }

            // Lấy Purchase Order với tất cả details
            const completePurchaseOrder = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: purchaseOrder.purchaseOrderId },
                include: {
                    supplier: {
                        select: {
                            supplierId: true,
                            name: true,
                            supplierCode: true,
                        }
                    },
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        select: {
                                            productId: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return {
                purchaseOrder: completePurchaseOrder,
                createdProducts,
                totalAmount,
                productCount: data.products.length
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đã nhập thành công ${serialized.productCount} sản phẩm với đơn nhập hàng ${serialized.purchaseOrder.purchaseOrderCode}`
        };
    } catch (error) {
        console.error('Error bulk importing products:', error);
        return {
            success: false,
            message: `Failed to bulk import products: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function createPurchaseOrderFromExistingProducts(data: {
    supplierId: string;
    importDate?: Date;
    note?: string;
    items: Array<{
        variantId: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
    }>;
}) {
    try {
        // Validation
        if (!data.supplierId) {
            throw new Error('Supplier ID là bắt buộc');
        }
        if (!data.items || data.items.length === 0) {
            throw new Error('Danh sách sản phẩm không được rỗng');
        }

        // Validate từng item
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (!item.variantId) {
                throw new Error(`Variant ID tại dòng ${i + 1} là bắt buộc`);
            }
            if (item.quantity <= 0) {
                throw new Error(`Số lượng tại dòng ${i + 1} phải lớn hơn 0`);
            }
            if (item.unitPrice < 0) {
                throw new Error(`Giá nhập tại dòng ${i + 1} không được âm`);
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra supplier có tồn tại không
            const supplier = await tx.supplier.findUnique({
                where: { supplierId: BigInt(data.supplierId) }
            });

            if (!supplier) {
                throw new Error('Nhà cung cấp không tồn tại');
            }

            // Kiểm tra tất cả variants có tồn tại không
            const variants = await tx.productVariant.findMany({
                where: {
                    variantId: {
                        in: data.items.map(item => BigInt(item.variantId))
                    }
                },
                include: {
                    product: {
                        select: {
                            productId: true,
                            name: true,
                        }
                    },
                    inventory: true,
                }
            });

            if (variants.length !== data.items.length) {
                throw new Error('Một số sản phẩm không tồn tại trong hệ thống');
            }

            // Tạo mã Purchase Order duy nhất
            const purchaseOrderCode = `PO-RESTOCK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Tính tổng amount
            let totalOrderAmount = 0;
            const purchaseOrderDetails = [];

            for (const item of data.items) {
                const totalAmount = item.quantity * item.unitPrice - (item.discount || 0);
                totalOrderAmount += totalAmount;

                purchaseOrderDetails.push({
                    variantId: BigInt(item.variantId),
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    totalAmount,
                });
            }

            // Tạo Purchase Order
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    purchaseOrderCode,
                    supplierId: BigInt(data.supplierId),
                    createdBy: null, // Có thể thêm user ID sau
                    importDate: data.importDate || new Date(),
                    status: 'PENDING', // Để pending, sẽ update khi nhập hàng thực tế
                    importStatus: 'PENDING',
                    purchaseOrderDetails: {
                        createMany: {
                            data: purchaseOrderDetails
                        }
                    },
                },
                include: {
                    supplier: {
                        select: {
                            supplierId: true,
                            name: true,
                            supplierCode: true,
                        }
                    },
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        select: {
                                            productId: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return {
                purchaseOrder,
                totalAmount: totalOrderAmount,
                itemCount: data.items.length
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đã tạo đơn nhập hàng ${serialized.purchaseOrder.purchaseOrderCode} với ${serialized.itemCount} sản phẩm`
        };
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return {
            success: false,
            message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function confirmPurchaseOrderImport(
    purchaseOrderId: string,
    importData?: {
        actualQuantities?: Array<{
            variantId: string;
            actualQuantity: number;
        }>;
        importDate?: Date;
        note?: string;
    }
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Lấy Purchase Order hiện tại
            const purchaseOrder = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    inventory: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!purchaseOrder) {
                throw new Error('Đơn nhập hàng không tồn tại');
            }

            if (purchaseOrder.importStatus === 'IMPORTED') {
                throw new Error('Đơn nhập hàng này đã được nhập vào kho');
            }

            // Cập nhật trạng thái Purchase Order
            await tx.purchaseOrder.update({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                data: {
                    status: 'COMPLETED',
                    importStatus: 'IMPORTED',
                    importDate: importData?.importDate || new Date(),
                },
            });

            const inventoryUpdates = [];

            // Cập nhật inventory cho từng product variant
            for (const detail of purchaseOrder.purchaseOrderDetails) {
                let quantityToAdd = detail.quantity;

                // Nếu có actual quantity khác với planned quantity
                if (importData?.actualQuantities) {
                    const actualQty = importData.actualQuantities.find(
                        aq => aq.variantId === detail.variantId.toString()
                    );
                    if (actualQty) {
                        quantityToAdd = actualQty.actualQuantity;

                        // Cập nhật purchase order detail với actual quantity
                        await tx.purchaseOrderDetail.update({
                            where: { purchaseOrderDetailId: detail.purchaseOrderDetailId },
                            data: {
                                quantity: actualQty.actualQuantity,
                                totalAmount: actualQty.actualQuantity * detail.unitPrice - detail.discount,
                            },
                        });
                    }
                }

                // Cập nhật hoặc tạo inventory
                if (detail.variant.inventory) {
                    const updatedInventory = await tx.inventory.update({
                        where: { inventoryId: detail.variant.inventory.inventoryId },
                        data: {
                            currentStock: {
                                increment: quantityToAdd
                            },
                            updatedAt: new Date(),
                        },
                    });
                    inventoryUpdates.push(updatedInventory);
                } else {
                    // Tạo inventory mới nếu chưa có
                    const newInventory = await tx.inventory.create({
                        data: {
                            variantId: detail.variantId,
                            initialStock: quantityToAdd,
                            currentStock: quantityToAdd,
                            minStock: 0,
                            maxStock: 0,
                        },
                    });
                    inventoryUpdates.push(newInventory);
                }
            }

            // Lấy Purchase Order đã cập nhật
            const updatedPurchaseOrder = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    inventory: true,
                                }
                            }
                        }
                    }
                }
            });

            return {
                purchaseOrder: updatedPurchaseOrder,
                inventoryUpdates,
                importedItemsCount: purchaseOrder.purchaseOrderDetails.length
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đã nhập hàng thành công cho ${serialized.importedItemsCount} sản phẩm`
        };
    } catch (error) {
        console.error('Error confirming purchase order import:', error);
        return {
            success: false,
            message: `Failed to confirm import: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function getPurchaseOrders({
    page = 1,
    limit = 20,
    status,
    supplierId,
    search = '',
    dateFrom,
    dateTo
}: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
} = {}) {
    try {
        // Build where clause
        const whereClause: {
            status?: string;
            supplierId?: bigint;
            purchaseOrderCode?: {
                contains: string;
                mode: 'insensitive';
            };
            createdAt?: {
                gte?: Date;
                lte?: Date;
            };
        } = {};

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = BigInt(supplierId);
        }

        if (search) {
            whereClause.purchaseOrderCode = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) {
                whereClause.createdAt.gte = dateFrom;
            }
            if (dateTo) {
                whereClause.createdAt.lte = dateTo;
            }
        }

        // Get total count
        const totalCount = await prisma.purchaseOrder.count({ where: whereClause });

        // Get purchase orders
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: whereClause,
            include: {
                supplier: {
                    select: {
                        supplierId: true,
                        name: true,
                        supplierCode: true,
                    }
                },
                purchaseOrderDetails: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        productId: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        purchaseOrderDetails: true
                    }
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate totals for each purchase order
        const purchaseOrdersWithTotals = purchaseOrders.map(po => {
            const totalAmount = po.purchaseOrderDetails.reduce(
                (sum, detail) => sum + detail.totalAmount, 0
            );
            const totalQuantity = po.purchaseOrderDetails.reduce(
                (sum, detail) => sum + detail.quantity, 0
            );

            return {
                ...po,
                totalAmount,
                totalQuantity,
                itemCount: po._count.purchaseOrderDetails
            };
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(purchaseOrdersWithTotals, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Build result with pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const result = {
            data: serialized,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };

        return result;
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw new Error(`Failed to fetch purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function deleteProductById(productId: string) {
    try {
        const deleted = await prisma.product.delete({
            where: { productId: BigInt(productId) }
        })
        return {
            success: true,
            message: "Product deleted successfully",
            data: deleted
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        return {
            success: false,
            message: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
    }
}

