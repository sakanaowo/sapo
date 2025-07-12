// "use client";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useState, useCallback } from "react";
// import useSWR from "swr";

// import ProductCard from "@/components/products/product-card";
// import { toast } from "sonner";

// interface Inventory {
//     inventoryId: string;
//     variantId: string;
//     initialStock: number;
//     currentStock: number;
//     minStock: number;
//     maxStock: number;
//     warehouseLocation: string | null;
//     updatedAt: string;
// }

// interface Variant {
//     variantId: string;
//     productId: string;
//     sku: string;
//     barcode: string;
//     variantName: string;
//     weight: number;
//     weightUnit: string;
//     unit: string;
//     imageUrl: string | null;
//     retailPrice: number;
//     wholesalePrice: number;
//     importPrice: number;
//     taxApplied: boolean;
//     inputTax: number;
//     outputTax: number;
//     createdAt: string;
//     inventory: Inventory;
// }

// interface Product {
//     productId: string;
//     name: string;
//     description: string | null;
//     brand: string | null;
//     productType: string;
//     tags: string | null;
//     createdAt: string;
//     variants: Variant[];
// }

// const fetcher = async (url: string) => {
//     const response = await fetch(url);

//     if (!response.ok) {
//         const error = new Error(`HTTP error! status: ${response.status}`) as Error & { info?: unknown; status?: number };
//         error.info = await response.json();
//         error.status = response.status;
//         throw error;
//     }

//     return response.json();
// };

// function ProductsPage() {
//     const router = useRouter();
//     const [searchTerm, setSearchTerm] = useState("");
//     const [currentPage, setCurrentPage] = useState(1);
//     const itemsPerPage = 20;

//     // Xây dựng query string với dependency
//     const getQueryString = useCallback((page: number, search: string) => {
//         const params = new URLSearchParams({
//             page: page.toString(),
//             limit: itemsPerPage.toString(),
//             ...(search && { search })
//         });
//         return `/api/products?${params}`;
//     }, [itemsPerPage]);

//     // Sử dụng SWR để fetch data
//     const { data, error, isLoading, mutate } = useSWR(
//         getQueryString(currentPage, searchTerm),
//         fetcher,
//         {
//             onError: (err) => {
//                 toast.error(`Lỗi khi tải sản phẩm: ${err.message}`);
//             },
//             revalidateOnFocus: false, // Không revalidate khi focus lại tab
//             revalidateOnReconnect: true, // Revalidate khi kết nối lại internet
//             dedupingInterval: 10000, // Không fetch lại trong vòng 10 giây
//         }
//     );

//     // Trích xuất dữ liệu từ response
//     const products = data?.data || [];
//     const pagination = data?.pagination || {
//         page: 1,
//         limit: itemsPerPage,
//         total: 0,
//         totalPages: 0,
//         hasNext: false,
//         hasPrev: false
//     };

//     // Handle search
//     const handleSearch = () => {
//         setCurrentPage(1);
//         mutate(getQueryString(1, searchTerm)); // Gọi mutate để fetch lại data
//     };

//     // Handle search input change
//     const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setSearchTerm(e.target.value);
//     };

//     // Handle search on Enter key
//     const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
//         if (e.key === 'Enter') {
//             handleSearch();
//         }
//     };

//     // Handle page change
//     const handlePageChange = (page: number) => {
//         if (page >= 1 && page <= pagination.totalPages) {
//             setCurrentPage(page);
//             window.scrollTo({ top: 0, behavior: 'smooth' });
//         }
//     };

//     const generatePageNumbers = () => {
//         const pages = [];
//         const maxVisiblePages = 5;
//         const totalPages = pagination.totalPages;

//         if (totalPages <= maxVisiblePages) {
//             for (let i = 1; i <= totalPages; i++) {
//                 pages.push(i);
//             }
//         } else {
//             const halfVisible = Math.floor(maxVisiblePages / 2);
//             let startPage = Math.max(1, currentPage - halfVisible);
//             const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//             if (endPage - startPage + 1 < maxVisiblePages) {
//                 startPage = Math.max(1, endPage - maxVisiblePages + 1);
//             }

//             for (let i = startPage; i <= endPage; i++) {
//                 pages.push(i);
//             }
//         }

//         return pages;
//     };

//     const skeleton = (
//         <CardContent>
//             <div className="text-center py-8 text-muted-foreground">
//                 <div className="mb-4">
//                     <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
//                         <Plus className="h-8 w-8" />
//                     </div>
//                 </div>
//                 <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm nào</h3>
//                 <p className="text-sm mb-4">Hãy thêm sản phẩm đầu tiên của bạn</p>
//                 <Link href="/products/create">
//                     <Button>
//                         <Plus className="h-4 w-4 mr-2" />
//                         Thêm sản phẩm
//                     </Button>
//                 </Link>
//             </div>
//         </CardContent>
//     );

//     // Loading skeleton
//     const loadingSkeleton = (
//         <div className="space-y-4">
//             {[...Array(5)].map((_, i) => (
//                 <Card key={i}>
//                     <CardContent className="p-6">
//                         <div className="animate-pulse">
//                             <div className="flex space-x-4">
//                                 <div className="h-16 w-16 bg-muted rounded"></div>
//                                 <div className="flex-1 space-y-2">
//                                     <div className="h-4 bg-muted rounded w-3/4"></div>
//                                     <div className="h-3 bg-muted rounded w-1/2"></div>
//                                     <div className="h-3 bg-muted rounded w-1/4"></div>
//                                 </div>
//                             </div>
//                         </div>
//                     </CardContent>
//                 </Card>
//             ))}
//         </div>
//     );

//     return (
//         <div className="min-h-screen bg-background">
//             {/* Topbar */}
//             <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//                 <div className=" flex h-16 items-center justify-between px-6">
//                     <h1 className="text-3xl font-bold tracking-tight">
//                         Danh sách sản phẩm
//                     </h1>
//                     <Link href="/products/create">
//                         <Button className="gap-2">
//                             <Plus className="h-4 w-4" />
//                             Thêm sản phẩm
//                         </Button>
//                     </Link>
//                 </div>
//             </div>

//             {/* Main content */}
//             <div className="container mx-auto p-6 space-y-6">
//                 {/* Search and Filter */}
//                 <Card>
//                     <CardContent className="pt-6">
//                         <div className="flex flex-col sm:flex-row gap-4">
//                             <div className="relative flex-1">
//                                 <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                                 <Input
//                                     placeholder="Tìm kiếm sản phẩm..."
//                                     className="pl-10"
//                                     value={searchTerm}
//                                     onChange={handleSearchChange}
//                                     onKeyPress={handleKeyPress}
//                                 />
//                             </div>
//                             <Button className="gap-2" onClick={handleSearch} disabled={isLoading}>
//                                 <Search className="h-4 w-4" />
//                                 Tìm kiếm
//                             </Button>
//                         </div>
//                     </CardContent>
//                 </Card>

//                 {/* Error display */}
//                 {error && (
//                     <Card>
//                         <CardContent className="pt-6">
//                             <div className="text-center py-8 text-destructive">
//                                 <p>Có lỗi xảy ra: {error.message}</p>
//                                 <Button
//                                     variant="outline"
//                                     className="mt-4"
//                                     onClick={() => mutate()} // Gọi mutate để thử fetch lại
//                                 >
//                                     Thử lại
//                                 </Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}

//                 {/* Products Count */}
//                 {!isLoading && !error && (
//                     <div className="flex items-center justify-between">
//                         <p className="text-sm text-muted-foreground">
//                             Hiển thị {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, pagination.total)} của {pagination.total} sản phẩm
//                         </p>
//                     </div>
//                 )}

//                 {/* Products List */}
//                 {isLoading ? (
//                     loadingSkeleton
//                 ) : error ? null : products.length === 0 ? (
//                     <Card>{skeleton}</Card>
//                 ) : (
//                     <div className="space-y-4">
//                         {products.map((product: Product) => (
//                             <ProductCard
//                                 key={product.productId}
//                                 product={product}
//                                 onClick={() => router.push(`/products/${product.productId}`)}
//                             />
//                         ))}
//                     </div>
//                 )}

//                 {/* Pagination */}
//                 {!isLoading && !error && pagination.totalPages > 1 && (
//                     <Card>
//                         <CardContent className="pt-6">
//                             <div className="flex items-center justify-center space-x-2">
//                                 {/* Previous Button */}
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => handlePageChange(currentPage - 1)}
//                                     disabled={!pagination.hasPrev}
//                                     className="gap-1"
//                                 >
//                                     <ChevronLeft className="h-4 w-4" />
//                                     Trước
//                                 </Button>

//                                 {/* Page Numbers */}
//                                 <div className="flex items-center space-x-1">
//                                     {currentPage > 3 && pagination.totalPages > 5 && (
//                                         <>
//                                             <Button
//                                                 variant="outline"
//                                                 size="sm"
//                                                 onClick={() => handlePageChange(1)}
//                                             >
//                                                 1
//                                             </Button>
//                                             {currentPage > 4 && (
//                                                 <span className="px-2 text-muted-foreground">...</span>
//                                             )}
//                                         </>
//                                     )}

//                                     {generatePageNumbers().map((page) => (
//                                         <Button
//                                             key={page}
//                                             variant={currentPage === page ? "default" : "outline"}
//                                             size="sm"
//                                             onClick={() => handlePageChange(page)}
//                                             className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
//                                         >
//                                             {page}
//                                         </Button>
//                                     ))}

//                                     {currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
//                                         <>
//                                             {currentPage < pagination.totalPages - 3 && (
//                                                 <span className="px-2 text-muted-foreground">...</span>
//                                             )}
//                                             <Button
//                                                 variant="outline"
//                                                 size="sm"
//                                                 onClick={() => handlePageChange(pagination.totalPages)}
//                                             >
//                                                 {pagination.totalPages}
//                                             </Button>
//                                         </>
//                                     )}
//                                 </div>

//                                 {/* Next Button */}
//                                 <Button
//                                     variant="outline"
//                                     size="sm"
//                                     onClick={() => handlePageChange(currentPage + 1)}
//                                     disabled={!pagination.hasNext}
//                                     className="gap-1"
//                                 >
//                                     Tiếp
//                                     <ChevronRight className="h-4 w-4" />
//                                 </Button>
//                             </div>

//                             {/* Page Info */}
//                             <div className="mt-4 text-center text-sm text-muted-foreground">
//                                 Trang {currentPage} của {pagination.totalPages}
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>
//         </div>
//     );
// }

// export default ProductsPage;

// import { getProducts } from '@/actions/product.action';
// import ProductsClient from './components/products-client';

// export const dynamic = 'force-dynamic';

// interface ProductsPageProps {
//     searchParams: {
//         page?: string;
//         search?: string;
//         limit?: string;
//     };
// }

// export default async function ProductsPage({ searchParams }: ProductsPageProps) {
//     const page = parseInt(searchParams.page || '1');
//     const limit = parseInt(searchParams.limit || '20');
//     const search = searchParams.search || '';

//     try {
//         // Gọi trực tiếp server action
//         const data = await getProducts({ page, limit, search });

//         return (
//             <ProductsClient
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//                 initialData={data as any}
//                 initialPage={page}
//                 initialSearch={search}
//                 itemsPerPage={limit}
//             />
//         );
//     } catch (error) {
//         console.error('Error loading products:', error);

//         // Fallback data khi có lỗi
//         const fallbackData = {
//             data: [],
//             pagination: {
//                 page: 1,
//                 limit: 20,
//                 total: 0,
//                 totalPages: 0,
//                 hasNext: false,
//                 hasPrev: false
//             }
//         };

//         return (
//             <ProductsClient
//                 initialData={fallbackData}
//                 initialPage={page}
//                 initialSearch={search}
//                 itemsPerPage={limit}
//                 error="Không thể tải danh sách sản phẩm"
//             />
//         );
//     }
// }

import { getProducts } from '@/actions/product.action';
import ProductsClient from './components/products-client';

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