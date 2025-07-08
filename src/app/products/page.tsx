"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProductCard from "@/components/product-card";

function ProductsPage() {
    const router = useRouter();
    const skeleton = (<CardContent>
        <div className="text-center py-8 text-muted-foreground">
            <div className="mb-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-8 w-8" />
                </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-sm mb-4">Hãy thêm sản phẩm đầu tiên của bạn</p>
            <Link href="/products/create">
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm sản phẩm
                </Button>
            </Link>
        </div>
    </CardContent>);

    const dummyProducts = [{
        "productId": "960",
        "name": "BM Sandwich Staff",
        "description": null,
        "brand": null,
        "productType": "Sản phẩm thường",
        "tags": null,
        "createdAt": "2025-07-06T09:39:16.468Z",
        "variants": [
            {
                "variantId": "1301",
                "productId": "960",
                "sku": "PVN4240",
                "barcode": "8934760212842",
                "variantName": "BM Sandwich Staff",
                "weight": 0,
                "weightUnit": "g",
                "unit": "túi",
                "imageUrl": "https://sapo.dktcdn.net/100/705/120/variants/369e877a-f7bc-4ee2-a45b-98184151116d.jpg",
                "retailPrice": 15000,
                "wholesalePrice": 0,
                "importPrice": 0,
                "taxApplied": false,
                "inputTax": 0,
                "outputTax": 0,
                "createdAt": "2025-07-06T10:14:38.219Z",
                "inventory": {
                    "inventoryId": "1301",
                    "variantId": "1301",
                    "initialStock": -1,
                    "currentStock": -1,
                    "minStock": 0,
                    "maxStock": 0,
                    "warehouseLocation": null,
                    "updatedAt": "2025-07-06T10:14:38.477Z"
                },
                "warranty": {
                    "warrantyId": "1301",
                    "variantId": "1301",
                    "expirationWarningDays": 0,
                    "warrantyPolicy": null,
                    "createdAt": "2025-07-06T10:14:38.734Z"
                },
                "fromConversions": [],
                "toConversions": []
            }
        ]
    },
    {
        "productId": "961",
        "name": "Mì hảo hảo chua cay",
        "description": null,
        "brand": null,
        "productType": "Sản phẩm thường",
        "tags": null,
        "createdAt": "2025-07-06T09:39:16.468Z",
        "variants": [
            {
                "variantId": "1302",
                "productId": "961",
                "sku": "PVN4238",
                "barcode": "8934563138165",
                "variantName": "Mì hảo hảo chua cay",
                "weight": 0,
                "weightUnit": "g",
                "unit": "gói",
                "imageUrl": "",
                "retailPrice": 5000,
                "wholesalePrice": 0,
                "importPrice": 0,
                "taxApplied": false,
                "inputTax": 0,
                "outputTax": 0,
                "createdAt": "2025-07-06T10:14:39.247Z",
                "inventory": {
                    "inventoryId": "1302",
                    "variantId": "1302",
                    "initialStock": -33,
                    "currentStock": -33,
                    "minStock": 0,
                    "maxStock": 0,
                    "warehouseLocation": null,
                    "updatedAt": "2025-07-06T10:14:39.497Z"
                },
                "warranty": {
                    "warrantyId": "1302",
                    "variantId": "1302",
                    "expirationWarningDays": 0,
                    "warrantyPolicy": null,
                    "createdAt": "2025-07-06T10:14:39.746Z"
                },
                "fromConversions": [
                    {
                        "conversionId": "177",
                        "fromVariantId": "1302",
                        "toVariantId": "1303",
                        "conversionRate": 24,
                        "createdAt": "2025-07-06T10:14:41.336Z",
                        "toVariant": {
                            "variantId": "1303",
                            "productId": "961",
                            "sku": "PVN4239",
                            "barcode": "8934563305048",
                            "variantName": "Mì hảo hảo chua cay - thùng",
                            "weight": 0,
                            "weightUnit": "g",
                            "unit": "thùng",
                            "imageUrl": null,
                            "retailPrice": 120000,
                            "wholesalePrice": 0,
                            "importPrice": 0,
                            "taxApplied": false,
                            "inputTax": 0,
                            "outputTax": 0,
                            "createdAt": "2025-07-06T10:14:39.996Z"
                        }
                    }
                ],
                "toConversions": []
            },
            {
                "variantId": "1303",
                "productId": "961",
                "sku": "PVN4239",
                "barcode": "8934563305048",
                "variantName": "Mì hảo hảo chua cay - thùng",
                "weight": 0,
                "weightUnit": "g",
                "unit": "thùng",
                "imageUrl": null,
                "retailPrice": 120000,
                "wholesalePrice": 0,
                "importPrice": 0,
                "taxApplied": false,
                "inputTax": 0,
                "outputTax": 0,
                "createdAt": "2025-07-06T10:14:39.996Z",
                "inventory": {
                    "inventoryId": "1303",
                    "variantId": "1303",
                    "initialStock": -1.1,
                    "currentStock": -1.1,
                    "minStock": 0,
                    "maxStock": 0,
                    "warehouseLocation": null,
                    "updatedAt": "2025-07-06T10:14:40.251Z"
                },
                "warranty": {
                    "warrantyId": "1303",
                    "variantId": "1303",
                    "expirationWarningDays": 0,
                    "warrantyPolicy": null,
                    "createdAt": "2025-07-06T10:14:40.501Z"
                },
                "fromConversions": [],
                "toConversions": [
                    {
                        "conversionId": "177",
                        "fromVariantId": "1302",
                        "toVariantId": "1303",
                        "conversionRate": 24,
                        "createdAt": "2025-07-06T10:14:41.336Z",
                        "fromVariant": {
                            "variantId": "1302",
                            "productId": "961",
                            "sku": "PVN4238",
                            "barcode": "8934563138165",
                            "variantName": "Mì hảo hảo chua cay",
                            "weight": 0,
                            "weightUnit": "g",
                            "unit": "gói",
                            "imageUrl": null,
                            "retailPrice": 5000,
                            "wholesalePrice": 0,
                            "importPrice": 0,
                            "taxApplied": false,
                            "inputTax": 0,
                            "outputTax": 0,
                            "createdAt": "2025-07-06T10:14:39.247Z"
                        }
                    }
                ]
            }
        ]
    },];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const products = dummyProducts;

    // pagination logic
    const totalItems = products.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    // handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const halfVisible = Math.floor(maxVisiblePages / 2);
            let startPage = Math.max(1, currentPage - halfVisible);
            const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
        }

        return pages;
    }

    // return (
    //     <div className="min-h-screen bg-background">
    //         {/* Topbar */}
    //         <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    //             <div className="container flex h-16 items-center justify-between px-6">
    //                 <h1 className="text-3xl font-bold tracking-tight">
    //                     Danh sách sản phẩm
    //                 </h1>
    //                 <Link href="/products/create">
    //                     <Button className="gap-2">
    //                         <Plus className="h-4 w-4" />
    //                         Thêm sản phẩm
    //                     </Button>
    //                 </Link>
    //             </div>
    //         </div>

    //         {/* Main content */}
    //         <div className="container mx-auto p-6 space-y-6">
    //             {/* Search and Filter */}
    //             <Card>
    //                 <CardContent className="pt-1">
    //                     <div className="flex flex-col sm:flex-row gap-4">
    //                         <div className="relative flex-1">
    //                             <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    //                             <Input
    //                                 placeholder="Tìm kiếm sản phẩm..."
    //                                 className="pl-10"
    //                             />
    //                         </div>
    //                         <Button className="gap-2">
    //                             <Search className="h-4 w-4" />
    //                             Tìm kiếm
    //                         </Button>
    //                     </div>
    //                 </CardContent>
    //             </Card>

    //             {/* Products List */}
    //             {products.length === 0 ? (
    //                 <Card>{skeleton}</Card>
    //             ) : (
    //                 products.map((product) => (
    //                     <ProductCard
    //                         key={product.productId}
    //                         product={product}
    //                         onClick={() => router.push(`/products/${product.productId}`)}
    //                     />
    //                 ))
    //             )}
    //         </div>
    //     </div>
    // );
    return (
        <div className="min-h-screen bg-background">
            {/* Topbar */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-6">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Danh sách sản phẩm
                    </h1>
                    <Link href="/products/create">
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Thêm sản phẩm
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto p-6 space-y-6">
                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-1">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="pl-10"
                                />
                            </div>
                            <Button className="gap-2">
                                <Search className="h-4 w-4" />
                                Tìm kiếm
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Count */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, totalItems)} của {totalItems} sản phẩm
                    </p>
                </div>

                {/* Products List */}
                {currentProducts.length === 0 ? (
                    <Card>{skeleton}</Card>
                ) : (
                    <div className="space-y-4">
                        {currentProducts.map((product) => (
                            <ProductCard
                                key={product.productId}
                                product={product}
                                onClick={() => router.push(`/products/${product.productId}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center space-x-2">
                                {/* Previous Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Trước
                                </Button>

                                {/* Page Numbers */}
                                <div className="flex items-center space-x-1">
                                    {currentPage > 3 && totalPages > 5 && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(1)}
                                            >
                                                1
                                            </Button>
                                            {currentPage > 4 && (
                                                <span className="px-2 text-muted-foreground">...</span>
                                            )}
                                        </>
                                    )}

                                    {generatePageNumbers().map((page) => (
                                        <Button
                                            key={page}
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => handlePageChange(page)}
                                            className={currentPage === page ? "bg-primary text-primary-foreground" : ""}
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                    {currentPage < totalPages - 2 && totalPages > 5 && (
                                        <>
                                            {currentPage < totalPages - 3 && (
                                                <span className="px-2 text-muted-foreground">...</span>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(totalPages)}
                                            >
                                                {totalPages}
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {/* Next Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="gap-1"
                                >
                                    Tiếp
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Page Info */}
                            <div className="mt-4 text-center text-sm text-muted-foreground">
                                Trang {currentPage} của {totalPages}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default ProductsPage;