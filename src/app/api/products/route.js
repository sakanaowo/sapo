/* eslint-disable @typescript-eslint/no-unused-vars */
import getAllProducts from '@/actions/product.action';

// Helper function to recursively convert BigInt to string
function convertBigIntToString(obj) {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'bigint') {
        return obj.toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(convertBigIntToString);
    }

    if (typeof obj === 'object') {
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertBigIntToString(value);
        }
        return converted;
    }

    return obj;
}

export async function GET(request) {
    try {
        // Get all products without pagination
        const products = await getAllProducts();

        // Convert all BigInt to string before serialization
        const convertedProducts = convertBigIntToString(products);

        return new Response(JSON.stringify(convertedProducts), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}