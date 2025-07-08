"use server";

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

export default async function getAllProducts() {
    const cacheKey = `all-products-variants`;

    try {
        // Check cache first
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch all products with their variants and pricing
        const products = await prisma.product.findMany({
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

        // Cache the serialized data for 1 hour
        await redis.setEx(cacheKey, 3600, JSON.stringify(serializedProducts));

        return serializedProducts;
    } catch (error) {
        console.error('Error fetching all products with variants:', error);
        throw error;
    }
}