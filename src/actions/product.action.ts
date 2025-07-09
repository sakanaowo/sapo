"use server";

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

// export default async function getAllProducts() {
//     const cacheKey = `all-products-variants`;

//     try {
//         // Check cache first
//         const cached = await redis.get(cacheKey);
//         if (cached) {
//             return JSON.parse(cached);
//         }

//         // Fetch all products with their variants and pricing
//         const products = await prisma.product.findMany({
//             include: {
//                 variants: {
//                     include: {
//                         inventory: true,
//                         warranty: true,
//                         fromConversions: {
//                             include: {
//                                 toVariant: true
//                             }
//                         },
//                         toConversions: {
//                             include: {
//                                 fromVariant: true
//                             }
//                         }
//                     }
//                 }
//             }
//         });

//         // Convert BigInt to string for caching
//         const serializedProducts = JSON.parse(JSON.stringify(products, (key, value) =>
//             typeof value === 'bigint' ? value.toString() : value
//         ));

//         // Cache the serialized data for 1 hour
//         await redis.setEx(cacheKey, 3600, JSON.stringify(serializedProducts));

//         return serializedProducts;
//     } catch (error) {
//         console.error('Error fetching all products with variants:', error);
//         throw error;
//     }
// }

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

export default async function getAllProducts({
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

        // Build where clause
        const whereClause = normalizedSearch
            ? { name: { contains: normalizedSearch, mode: 'insensitive' as const } }
            : {};

        // Get total count for pagination
        const totalCount = await prisma.product.count({
            where: whereClause,
        });

        // Get products with pagination
        const products = await prisma.product.findMany({
            where: whereClause,
            include: {
                variants: {
                    include: {
                        inventory: true,
                        warranty: true,
                        fromConversions: {
                            include: { toVariant: true }
                        },
                        toConversions: {
                            include: { fromVariant: true }
                        },
                    },
                },
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc', // Add consistent ordering
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

        // Cache for 30 minutes (shorter for dynamic data)
        await redis.setEx(cacheKey, 1800, JSON.stringify(result));

        return result;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getProductById(id: string, select: string[] = ['id', 'name', 'variants', 'inventory', 'warranty', 'conversions']) {
    const cacheKey = `product-${id}-select-${select.join(',')}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const include: any = {};
        if (select.includes('variants')) {
            include.variants = {
                include: {
                    inventory: select.includes('inventory'),
                    warranty: select.includes('warranty'),
                    fromConversions: select.includes('conversions') ? { include: { toVariant: true } } : false,
                    toConversions: select.includes('conversions') ? { include: { fromVariant: true } } : false,
                },
            };
        }

        const product = await prisma.product.findUnique({
            where: { id },
            select: {
                id: select.includes('id'),
                name: select.includes('name'),
                variants: include.variants || false,
            },
        });

        if (!product) {
            throw new Error('Product not found');
        }

        const serializedProduct = JSON.parse(JSON.stringify(product, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        await redis.setEx(cacheKey, 3600, JSON.stringify(serializedProduct));
        return serializedProduct;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
}

export async function invalidateProductCache(id?: string) {
    try {
        if (id) {
            const cacheKey = `product-${id}`;
            await redis.del(cacheKey);
        } else {
            // Invalidate all product caches if needed
            const keys = await redis.keys('product-*');
            if (keys.length > 0) {
                await redis.del(keys);
            }
        }
    } catch (error) {
        console.error('Error invalidating product cache:', error);
        throw error;
    }
}