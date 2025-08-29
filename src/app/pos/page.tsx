"use client";

// import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, X, Plus } from "lucide-react";
import OnCart from "@/components/POS/onCart";
import Image from "next/image";


import { usePosStore, type CartProduct } from "@/store/pos/POS-store";

export default function POSPage() {

    // Helper function để tìm các variant có sẵn của sản phẩm
    const getAvailableVariants = (cartProduct: CartProduct) => {
        // Tìm sản phẩm gốc dựa trên một variant trong cart
        const sourceProduct = products.find(product =>
            product.variants.some(variant => variant.variantId === cartProduct.id)
        );
        return sourceProduct ? sourceProduct.variants : [];
    };

    const SearchDropdown = () => {
        if (!showSearchResults || !isManualSearch) return null;

        if (isLoading) {
            return (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-4 text-center text-muted-foreground">
                        Đang tải sản phẩm...
                    </div>
                </div>
            );
        }

        if (filteredProducts.length === 0) {
            return (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg">
                    <div className="p-4 text-center text-muted-foreground">
                        <div className="text-2xl mb-2">🔍</div>
                        <p className="text-sm">Không tìm thấy sản phẩm</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border rounded-md shadow-lg max-h-96 overflow-y-auto">
                <div className="p-2">
                    {filteredProducts.slice(0, 10).map((product) =>
                        product.variants.map((variant) => (
                            <div
                                key={variant.variantId}
                                className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                                onClick={() => addProductToOrder(variant, product.name, product.image, false)}
                            >
                                <div className="w-12 h-12 flex-shrink-0">
                                    <div className="w-full h-full bg-muted rounded-lg overflow-hidden">
                                        <Image
                                            src={variant.image || product.image || "/not-found.png"}
                                            alt={variant.variantName}
                                            className="w-full h-full object-cover"
                                            width={48}
                                            height={48}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium line-clamp-1" title={`${variant.variantName}`}>
                                        {variant.variantName}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>SKU: {variant.SKU}</span>
                                        <span>•</span>
                                        <span>{variant.unit}</span>
                                        {variant.barcode && (
                                            <>
                                                <span>•</span>
                                                <span>{variant.barcode}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <p className="text-sm font-bold text-primary">
                                        {variant.price.toLocaleString('vi-VN')}₫
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                    {filteredProducts.length > 10 && (
                        <div className="p-3 text-center text-xs text-muted-foreground border-t">
                            Và {filteredProducts.length - 10} sản phẩm khác...
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const EmptyOrder = () => (
        <Card>
            <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                    <div className="text-4xl mb-4">🛒</div>
                    <p className="text-lg mb-2">Chưa có sản phẩm nào</p>
                    <p className="text-sm">Sử dụng thanh tìm kiếm để thêm sản phẩm vào đơn hàng</p>
                </div>
            </CardContent>
        </Card>
    );

    const {
        // State
        searchQuery,
        products,
        filteredProducts,
        isLoading,
        showSearchResults,
        isManualSearch,
        orders,
        activeTab,
        currentOrder,

        // Refs
        searchInputRef,

        // Actions
        handleInputChange,
        handleSearchBlur,
        handleSearchFocus,
        setActiveTab,
        addOrder,
        removeOrder,
        addProductToOrder,
        removeProductFromOrder,
        updateProductQuantity,
        updateProductUnit,
        handlePayment,
        handlePrintInvoice,
    } = usePosStore();

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="bg-card border-b shadow-sm p-4">
                <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Tìm kiếm sản phẩm (F3) hoặc quét barcode"
                            className="pl-10"
                            value={searchQuery}
                            onChange={handleInputChange}
                            onBlur={handleSearchBlur}
                            onFocus={handleSearchFocus}
                        />
                        <SearchDropdown />
                    </div>

                    {/* Order Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-muted">
                            {orders.map((order) => (
                                <TabsTrigger
                                    key={order.id}
                                    value={order.name}
                                    className="relative group"
                                >
                                    {order.name}
                                    {order.products.length > 0 && (
                                        <span className="ml-1 h-2 w-2 bg-primary rounded-full"></span>
                                    )}
                                    {orders.length > 1 && (
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeOrder(order.name);
                                            }}
                                            className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-destructive/20 cursor-pointer"
                                        >
                                            <X className="h-3 w-3" />
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={addOrder}
                                className="ml-2 h-8 w-8 p-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TabsList>
                    </Tabs>
                    {/* Test */}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Product List Area */}
                <div className="flex-1 p-4 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {orders.map((order) => (
                            <TabsContent key={order.id} value={order.name} className="mt-0 h-full">
                                {order.products.length === 0 ? (
                                    <EmptyOrder />
                                ) : (
                                    <Card className="h-fit">
                                        <CardContent className="p-0">
                                            <div className="overflow-x-auto">
                                                <Table className="w-full">
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/30 border-b-2">
                                                            <TableHead className="w-[60px] text-center font-semibold py-3">STT</TableHead>
                                                            <TableHead className="w-[80px] text-center font-semibold py-3">Ảnh</TableHead>
                                                            <TableHead className="w-[120px] font-semibold py-3">SKU</TableHead>
                                                            <TableHead className="min-w-[200px] font-semibold py-3">Tên sản phẩm</TableHead>
                                                            <TableHead className="w-[100px] text-center font-semibold py-3">Đơn vị</TableHead>
                                                            <TableHead className="w-[140px] text-center font-semibold py-3">Số lượng</TableHead>
                                                            <TableHead className="w-[100px] text-right font-semibold py-3">Đơn giá</TableHead>
                                                            <TableHead className="w-[120px] text-right font-semibold py-3">Thành tiền</TableHead>
                                                            <TableHead className="w-[80px] text-center font-semibold py-3">Thao tác</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {order.products.map((product, index) => (
                                                            <OnCart
                                                                key={product.id}
                                                                product={product}
                                                                index={index + 1}
                                                                availableVariants={getAvailableVariants(product)}
                                                                onUpdateQuantity={updateProductQuantity}
                                                                onUpdateUnit={updateProductUnit}
                                                                onRemoveProduct={(productId) => removeProductFromOrder(order.id, productId)}
                                                            />
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* Order Summary Sidebar */}
                <div className="w-80 bg-card border-l shadow-sm flex flex-col">
                    <div className="flex-1 p-6">
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Số lượng sản phẩm:</span>
                                    <span className="font-medium">{currentOrder?.products.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Tạm tính:</span>
                                    <span className="font-medium">{currentOrder?.total.toLocaleString('vi-VN')}₫</span>
                                </div>
                                <hr className="my-3 border-border" />
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-primary">{currentOrder?.total.toLocaleString('vi-VN')}₫</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-muted/30">
                        <Button
                            className="w-full font-medium py-3 text-lg"
                            size="lg"
                            onClick={() => currentOrder && handlePayment(currentOrder.id)}
                            disabled={!currentOrder?.products.length}
                        >
                            THANH TOÁN (F1)
                        </Button>
                        <div className="flex gap-2 mt-3">
                            {/* <Button variant="outline" className="flex-1" size="sm">
                                Lưu tạm
                            </Button> */}
                            <Button
                                variant="outline"
                                className="flex-1"
                                size="sm"
                                onClick={() => currentOrder && handlePrintInvoice(currentOrder.id)}
                                disabled={!currentOrder?.products.length}
                            >
                                In bill
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}