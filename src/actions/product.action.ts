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
    variantName: string;
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
}) {
    try {
        // Validation
        if (!data.name.trim()) {
            throw new Error('Tên sản phẩm không được để trống');
        }
        if (!data.sku.trim()) {
            throw new Error('Mã SKU không được để trống');
        }
        if (!data.variantName.trim()) {
            throw new Error('Tên biến thể không được để trống');
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
                            variantName: data.variantName.trim(),
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
                                variantName: `${data.variantName} - ${conv.unit}`,
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

            return product;
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

        return serialized;
    } catch (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
export async function addManyProducts() { }