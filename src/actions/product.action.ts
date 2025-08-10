"use server";

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

// Helper function để tính stock cho conversion variants
function calculateConversionStock(baseStock: number, conversionRate: number): number {
    if (conversionRate <= 0) return 0;
    return Math.floor(baseStock / conversionRate);
}



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

/**
 * ===== INVENTORY & CONVERSION LOGIC =====
 * 
 * 1. CHỈ BASE VARIANT CÓ INVENTORY THỰC TẾ
 *    - Base variant: stock được lưu trong inventory table
 *    - Conversion variants: KHÔNG có inventory, chỉ là metadata
 * 
 * 2. STOCK CALCULATION
 *    - Base stock: Thực tế trong DB
 *    - Conversion stock: Tính toán = baseStock / conversionRate
 *    - VD: Base = 100 cái, rate = 12 → Conversion = 8 thùng
 * 
 * 3. PURCHASE ORDER
 *    - Chỉ tạo PO detail cho base variant
 *    - Import sẽ chỉ update stock của base variant
 *    - Conversion stock tự động cập nhật theo calculation
 * 
 * 4. SELLING
 *    - Có thể bán theo bất kỳ unit nào (base hoặc conversion)
 *    - Khi bán conversion unit, sẽ deduct từ base stock theo rate
 */

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
    imageUrl?: string;
    retailPrice: number;
    importPrice: number;
    wholesalePrice: number;
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
    // Purchase Order - bắt buộc
    supplierCode: string;         // Mã nhà cung cấp - bắt buộc
    importQuantity: number;       // Số lượng nhập lần đầu
    note?: string;               // Ghi chú cho đơn nhập
}) {
    try {
        // VALIDATION
        if (!data.name?.trim()) throw new Error('Tên sản phẩm không được để trống');
        if (!data.sku?.trim()) throw new Error('Mã SKU không được để trống');
        if (data.retailPrice <= 0) throw new Error('Giá bán lẻ phải lớn hơn 0');
        if (!data.supplierCode?.trim()) throw new Error('Mã nhà cung cấp là bắt buộc');
        if (!data.importQuantity || data.importQuantity <= 0) {
            throw new Error('Số lượng nhập phải lớn hơn 0');
        }

        // Standardize the list of SKUs to check
        const convUnits = (data.unitConversions ?? [])
            .filter(c => c?.unit?.trim() && c.conversionRate > 0);
        const candidateSkus = [
            data.sku.trim(),
            ...convUnits.map(c => `${data.sku.trim()}-${c.unit.trim()}`)
        ];

        // check SKU duplicate
        const dup = await prisma.productVariant.findFirst({
            where: { sku: { in: candidateSkus } },
            select: { sku: true }
        })
        if (dup) throw new Error(`SKU đã tồn tại: ${dup.sku}`);

        // CREATE PRODUCT + VARIANTs - transaction1
        const { productId, baseVariantId } = await prisma.$transaction(async (tx) => {
            // 1
            const product = await tx.product.create({
                data: {
                    name: data.name.trim(),
                    description: data.description?.trim() || null,
                    brand: data.brand?.trim() || null,
                    productType: data.productType || 'Sản phẩm thường',
                    tags: data.tags?.length ? data.tags.join(',') : null,
                    variants: {
                        create: {
                            sku: data.sku.trim(),
                            barcode: data.barcode?.trim() || null,
                            variantName: `${data.name.trim()} - ${data.unit}`,
                            weight: data.weight || 0,
                            weightUnit: data.weightUnit || 'g',
                            unit: data.unit?.trim() || '',
                            imageUrl: data.imageUrl || null,
                            retailPrice: data.retailPrice,
                            wholesalePrice: data.wholesalePrice || 0,
                            importPrice: data.importPrice || 0,
                            taxApplied: !!data.taxApplied,
                            inputTax: data.inputTax || 0,
                            outputTax: data.outputTax || 0,
                            inventory: {
                                create: {
                                    initialStock: 0,
                                    currentStock: 0,
                                    minStock: data.minStock || 0,
                                    maxStock: data.maxStock || 0,
                                    warehouseLocation: data.warehouseLocation?.trim() || null,
                                },
                            },
                        },
                    },
                },
                include: {
                    variants: { include: { inventory: true } },
                },
            });

            const baseVariant = product.variants[0];

            // 2
            if (convUnits.length) {
                for (const conv of convUnits) {
                    const convVariant = await tx.productVariant.create({
                        data: {
                            productId: product.productId,
                            sku: `${data.sku.trim()}-${conv.unit.trim()}`,
                            variantName: `${data.name.trim()} - ${conv.unit.trim()}`,
                            weight: (data.weight || 0) * conv.conversionRate,
                            weightUnit: data.weightUnit || 'g',
                            unit: conv.unit.trim(),
                            imageUrl: data.imageUrl || null,
                            // nhân theo conversionRate để đảm bảo tỷ lệ giá/khối lượng
                            retailPrice: data.retailPrice * conv.conversionRate,
                            wholesalePrice: (data.wholesalePrice || 0) * conv.conversionRate,
                            importPrice: (data.importPrice || 0) * conv.conversionRate,
                            taxApplied: !!data.taxApplied,
                            inputTax: data.inputTax || 0,
                            outputTax: data.outputTax || 0,
                            // không tạo inventory cho conversion, chỉ base mới có stock thực nhập
                        },
                    });

                    await tx.unitConversion.create({
                        data: {
                            fromVariantId: baseVariant.variantId,
                            toVariantId: convVariant.variantId,
                            conversionRate: conv.conversionRate,
                        },
                    });
                }
            }
            return {
                productId: product.productId,
                baseVariantId: baseVariant.variantId,
            };
        });

        // create purchase order - transaction 2
        const { product, purchaseOrder } = await prisma.$transaction(async (tx) => {
            // 1 find supplier for supplierCode
            const supplier = await tx.supplier.findUnique({
                where: { supplierCode: data.supplierCode.trim() },
                select: { supplierId: true, name: true, supplierCode: true }
            });
            if (!supplier) throw new Error(`Nhà cung cấp với mã "${data.supplierCode}" không tồn tại`);

            const purchaseOrderCode = `PO-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 6).toUpperCase()}`

            // PO -> pending
            const po = await tx.purchaseOrder.create({
                data: {
                    purchaseOrderCode,
                    supplierId: supplier.supplierId,
                    createdBy: null,
                    importDate: null,
                    status: 'PENDING',
                    importStatus: 'PENDING',
                    purchaseOrderDetails: {
                        create: {
                            variantId: baseVariantId,
                            quantity: data.importQuantity,
                            unitPrice: data.importPrice,
                            discount: 0,
                            totalAmount: data.importQuantity * data.importPrice,
                        },
                    },

                },
                include: {
                    supplier: true,
                    purchaseOrderDetails: true,
                }
            });

            // NOTE: Chỉ tạo PO detail cho base variant
            // Conversion variants chỉ là metadata để display/sell với đơn vị khác
            // Stock thực tế chỉ lưu ở base variant, conversion stock = baseStock / conversionRate

            const createdProduct = await tx.product.findUnique({
                where: { productId },
                include: { variants: true }
            });
            return { product: createdProduct, purchaseOrder: po };
        });

        try {
            await redis.flushAll();
        } catch (err) {
            console.error('Error flushing Redis cache:', err);
        }

        const serialized = JSON.parse(JSON.stringify({ product, purchaseOrder }, (k, v) =>
            typeof v === 'bigint' ? v.toString() : v
        ));

        return {
            product: serialized.product,
            purchaseOrder: serialized.purchaseOrder,
            message: `Tạo đơn nhập thành công`
        }

    } catch (error) {
        console.error('Error creating product:', error);
        throw new Error('Tạo sản phẩm thất bại');
    }
}

// Helper function để lấy thông tin stock cho tất cả variants của product
export async function getProductVariantsWithStock(productId: bigint) {
    try {
        const product = await prisma.product.findUnique({
            where: { productId },
            include: {
                variants: {
                    include: {
                        inventory: true,
                        fromConversions: {
                            include: {
                                toVariant: {
                                    select: {
                                        variantId: true,
                                        unit: true,
                                        variantName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!product) {
            throw new Error('Product not found');
        }

        // Tìm base variant (variant có inventory)
        const baseVariant = product.variants.find(v => v.inventory);
        if (!baseVariant) {
            throw new Error('Base variant with inventory not found');
        }

        // Calculate stock cho tất cả variants
        const variantsWithStock = product.variants.map(variant => {
            if (variant.inventory) {
                // Base variant - stock thực tế
                return {
                    ...variant,
                    currentStock: variant.inventory.currentStock,
                    isBaseVariant: true
                };
            } else {
                // Conversion variant - tính stock từ base
                const conversion = baseVariant.fromConversions.find(
                    conv => conv.toVariant.variantId === variant.variantId
                );
                const conversionRate = conversion?.conversionRate || 1;
                const calculatedStock = calculateConversionStock(
                    baseVariant.inventory!.currentStock,
                    conversionRate
                );

                return {
                    ...variant,
                    currentStock: calculatedStock,
                    isBaseVariant: false,
                    conversionRate
                };
            }
        });

        return {
            ...product,
            variants: variantsWithStock
        };

    } catch (error) {
        console.error('Error getting product variants with stock:', error);
        throw error;
    }
}

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

// TODO: delete related variants
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

