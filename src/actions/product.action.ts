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

        // Get products with only necessary fields
        const products = await prisma.product.findMany({
            where: whereClause,
            select: {
                productId: true,
                name: true,
                productType: true,
                brand: true,
                variants: {
                    select: {
                        variantId: true,
                        variantName: true,
                        sku: true,
                        barcode: true,
                        weight: true,
                        weightUnit: true,
                        unit: true,
                        imageUrl: true,
                        retailPrice: true,
                        wholesalePrice: true,
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

export async function addOneProduct() { }

export async function addManyProducts() { }