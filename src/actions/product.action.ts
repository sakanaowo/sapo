// import prisma from "@/lib/prisma";

// async function getProducts(page: number, limit: number) {
//     const cacheKey = `products-page-${page}-limit-${limit}`;
//     let products = redis.get(cacheKey);
//     if (products) {
//         return JSON.parse(products);
//     }
//     products = await prisma.product.findMany({
//         skip: (page - 1) * limit,
//         take: limit,
//     });
//     await redis.set(cacheKey, JSON.stringify(products), 'EX', 60 * 60); // Cache for 1 hour
//     return products;
// }