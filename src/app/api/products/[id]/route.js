import { getProductById } from '@/actions/product.action';
import { NextResponse } from 'next/server';

export async function GET(request, context) {
    try {
        const { params } = await context; // Chờ context để lấy params
        const { id } = await params;

        // Validate ID
        if (!id || isNaN(Number(id))) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        const product = await getProductById(id);
        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}