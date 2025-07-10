import { getProductById } from '@/actions/product.action';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    try {
        const { params } = context;
        const { id } = params;
        const { searchParams } = new URL(request.url);

        // Get select parameter from query string
        const selectParam = searchParams.get('select');
        const select = selectParam ? selectParam.split(',') : undefined;

        // Pass select fields to getProductById
        const product = await getProductById(id, select);
        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}