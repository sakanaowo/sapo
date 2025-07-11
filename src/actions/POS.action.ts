"use server"

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

// Define interfaces for the output structure
interface VariantForDisplay {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode?: string;
    SKU: string;
    image?: string;
}

interface ProductForDisplay {
    productId: string;
    name: string;
    image?: string;
    variants: VariantForDisplay[];
}

/**
 * Fetches all products with their variants, including name, image, unit, price, barcode, and SKU.
 * Results are cached for 24 hours to optimize performance.
 * @returns Promise<ProductForDisplay[]> - Array of products with their variant details
 */
export async function getProductsForDisplay(): Promise<ProductForDisplay[]> {
    const cacheKey = `products-for-display`;

    try {
        // Check if data is available in cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch products with their variants from the database
        const products = await prisma.product.findMany({
            include: {
                variants: true
            }
        });

        // Transform the data into the required format
        const productsForDisplay: ProductForDisplay[] = products
            .filter(product => product.variants.length > 0) // Ensure products have at least one variant
            .map(product => ({
                productId: product.productId.toString(),
                name: product.name,
                image: product.variants[0]?.imageUrl || undefined, // Use the first variant's image for the product
                variants: product.variants.map(variant => ({
                    variantId: variant.variantId.toString(),
                    variantName: variant.variantName,
                    unit: variant.unit,
                    price: variant.retailPrice,
                    barcode: variant.barcode ?? undefined,
                    SKU: variant.sku,
                    image: variant.imageUrl ?? undefined
                }))
            }));

        // Cache the result for 24 hours (3600 seconds * 24)
        await redis.setEx(cacheKey, 3600 * 24, JSON.stringify(productsForDisplay));

        return productsForDisplay;
    } catch (error) {
        console.error("Error fetching products for display:", error);
        throw error;
    }
}