"use server";

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

export default async function get50ProductVariants(page: number, limit: number) {
    if (page < 1 || limit < 1) {
        throw new Error('Page and limit must be positive numbers');
    }

    const cacheKey = `products-variants-page-${page}-limit-${limit}`;

    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch products with their variants and pricing
        const products = await prisma.product.findMany({
            skip: (page - 1) * limit,
            take: limit,
            include: {
                variants: {
                    include: {
                        inventory: true,
                        warranty: true,
                        fromConversions: {
                            include: {
                                toVariant: true
                            }
                        },
                        toConversions: {
                            include: {
                                fromVariant: true
                            }
                        }
                    }
                }
            }
        });

        // Convert BigInt to string for caching
        const serializedProducts = JSON.parse(JSON.stringify(products, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Cache the serialized data
        await redis.setEx(cacheKey, 3600, JSON.stringify(serializedProducts));

        return serializedProducts;
    } catch (error) {
        console.error('Error fetching products with variants:', error);
        throw error;
    }
}