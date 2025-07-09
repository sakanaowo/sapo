/* eslint-disable @typescript-eslint/no-unused-vars */
import getAllProducts from '@/actions/product.action';

// Helper function to recursively convert BigInt to string
// function convertBigIntToString(obj) {
//     if (obj === null || obj === undefined) return obj;

//     if (typeof obj === 'bigint') {
//         return obj.toString();
//     }

//     if (Array.isArray(obj)) {
//         return obj.map(convertBigIntToString);
//     }

//     if (typeof obj === 'object') {
//         const converted = {};
//         for (const [key, value] of Object.entries(obj)) {
//             converted[key] = convertBigIntToString(value);
//         }
//         return converted;
//     }

//     return obj;
// }

// export async function GET(request) {
//     try {
//         // Get all products without pagination
//         const products = await getAllProducts();

//         // Convert all BigInt to string before serialization
//         const convertedProducts = convertBigIntToString(products);

//         return new Response(JSON.stringify(convertedProducts), {
//             status: 200,
//             headers: { 'Content-Type': 'application/json' },
//         });
//     } catch (error) {
//         console.error('API Error:', error);
//         return new Response(JSON.stringify({ error: error.message }), {
//             status: 500,
//             headers: { 'Content-Type': 'application/json' },
//         });
//     }
// }

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        // Validate parameters
        if (page < 1 || limit < 1 || limit > 100) {
            return new Response(JSON.stringify({
                error: 'Invalid parameters. Page must be >= 1, limit must be 1-100'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const result = await getAllProducts({ page, limit, search });

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}