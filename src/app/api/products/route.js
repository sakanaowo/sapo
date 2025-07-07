import get50ProductVariants from '@/actions/product.action';


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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;

    try {
        const products = await get50ProductVariants(page, limit);

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