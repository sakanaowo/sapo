import { NextResponse } from 'next/server';
import { getProductsForDisplay } from '@/actions/POS.action';

export async function GET() {
    try {
        const products = await getProductsForDisplay();
        return NextResponse.json(products);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}