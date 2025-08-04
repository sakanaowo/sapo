import { flushAllCache, getProducts } from '@/actions/product.action';


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

        const result = await getProducts({ page, limit, search });

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

export async function POST() {
    try {
        await flushAllCache();
        // console.log("redis env", process.env.REDIS_URL);
        return new Response(JSON.stringify({ message: 'Cache flushed successfully' }), {
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