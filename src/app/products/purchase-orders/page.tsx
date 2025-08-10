import { getPurchaseOrders } from '@/actions/purchase-order.action';
import PurchaseOrdersClient from '../../../components/purchase-orders/purchase-orders-client';

export const dynamic = 'force-dynamic';

interface PurchaseOrdersPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        supplierId?: string;
        limit?: string;
    }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PurchaseOrdersPageProps) {
    // Await searchParams trước khi sử dụng
    const params = await searchParams;

    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    const search = params.search || '';
    const status = params.status || 'ALL';
    const supplierId = params.supplierId || '';

    try {
        // Gọi trực tiếp server action
        const data = await getPurchaseOrders({
            page,
            limit,
            search,
            status: status !== 'ALL' ? status : undefined,
            supplierId: supplierId || undefined
        });

        return (
            <PurchaseOrdersClient
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                initialData={data as any}
                initialPage={page}
                initialSearch={search}
                initialStatus={status}
                initialSupplierId={supplierId}
                itemsPerPage={limit}
            />
        );
    } catch (error) {
        console.error('Error loading purchase orders:', error);

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
            <PurchaseOrdersClient
                initialData={fallbackData}
                initialPage={page}
                initialSearch={search}
                initialStatus={status}
                initialSupplierId={supplierId}
                itemsPerPage={limit}
                error="Không thể tải danh sách đơn nhập hàng"
            />
        );
    }
}