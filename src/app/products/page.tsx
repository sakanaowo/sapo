import { getProducts } from '@/actions/product.action';
import ProductsClient from '../../components/products/products-client';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        limit?: string;
    }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    // Await searchParams trước khi sử dụng
    const params = await searchParams;

    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    const search = params.search || '';

    try {
        // Gọi trực tiếp server action
        const data = await getProducts({ page, limit, search });
        return (
            <ProductsClient
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                initialData={data as any}
                initialPage={page}
                initialSearch={search}
                itemsPerPage={limit}
            />
        );
    } catch (error) {
        console.error('Error loading products:', error);

        // Fallback data khi có lỗi
        const fallbackData = {
            data: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            }
        };

        return (
            <ProductsClient
                initialData={fallbackData}
                initialPage={page}
                initialSearch={search}
                itemsPerPage={limit}
                error="Không thể tải danh sách sản phẩm"
            />
        );
    }
}