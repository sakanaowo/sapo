/* eslint-disable @typescript-eslint/no-unused-vars */
import { getProducts } from '@/actions/product.action';


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

// export async function GET(request, { params }) {
//     try {
//         const { id } = params;
//         const { searchParams } = new URL(request.url);

//         // Lấy tham số select từ query string
//         const selectParam = searchParams.get('select');
//         const select = selectParam ? selectParam.split(',') : ['id', 'name', 'variants', 'inventory', 'warranty', 'conversions'];

//         // Validate ID
//         if (!id || isNaN(id)) {
//             return new Response(JSON.stringify({
//                 error: 'Invalid product ID'
//             }), {
//                 status: 400,
//                 headers: { 'Content-Type': 'application/json' },
//             });
//         }

//         const product = await getProductById(id, select);

//         return new Response(JSON.stringify(product), {
//             status: 200,
//             headers: { 'Content-Type': 'application/json' },
//         });
//     } catch (error) {
//         console.error('API Error:', error);

//         if (error.message === 'Product not found') {
//             return new Response(JSON.stringify({
//                 error: 'Product not found'
//             }), {
//                 status: 404,
//                 headers: { 'Content-Type': 'application/json' },
//             });
//         }

//         return new Response(JSON.stringify({
//             error: 'Internal server error',
//             message: process.env.NODE_ENV === 'development' ? error.message : undefined
//         }), {
//             status: 500,
//             headers: { 'Content-Type': 'application/json' },
//         });
//     }
// }