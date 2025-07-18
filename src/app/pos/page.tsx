"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import OnCart from "@/components/POS/onCart";
import Image from "next/image";
import { getProductsForDisplay, printInvoice } from "@/actions/POS.action";
import { processPosPayment } from "@/actions/order.action";

type Variant = {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode?: string;
    SKU: string;
    image?: string | null;
}

type Products = {
    productId: string;
    name: string;
    image?: string;
    variants: Variant[];
}

type CartProduct = {
    id: string; // variantId
    productId: string;
    image: string;
    name: string;
    SKU: string;
    unit: string[];
    quantity: number;
    price: number;
    amount: number;
}

type Order = {
    id: string;
    name: string;
    products: CartProduct[];
    total: number;
}

export default function POSPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const ORDERS_STORAGE_KEY = "orders";
    const ACTIVE_TAB_STORAGE_KEY = "activeTab";

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const data = await getProductsForDisplay();
                setProducts(data);
                setFilteredProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
                toast.error("Lỗi khi tải sản phẩm");
            } finally { setIsLoading(false); }
        }
        fetchProducts();
    }, [])
    // console.log("Products loaded:", products);

    const [orderCounter, setOrderCounter] = useState(1)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('pos_order_counter', orderCounter.toString());
        }
    }, [orderCounter]);


    const [orders, setOrders] = useState<Order[]>([{
        id: "1",
        name: "Đơn 1",
        products: [],
        total: 0
    }])

    const [activeTab, setActiveTab] = useState("Đơn 1");
    useEffect(() => {
        // Load orderCounter
        const savedCounter = localStorage.getItem('pos_order_counter');
        if (savedCounter) {
            setOrderCounter(parseInt(savedCounter) || 1);
        }

        // Load orders
        const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedOrders) {
            try {
                const parsedOrders = JSON.parse(savedOrders);
                if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
                    setOrders(parsedOrders);
                }
            } catch (error) {
                console.error("Error parsing orders from localStorage:", error);
            }
        }

        // Load activeTab
        const savedActiveTab = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
        if (savedActiveTab) {
            setActiveTab(savedActiveTab);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('pos_order_counter', orderCounter.toString());
    }, [orderCounter]);

    // Auto-save orders
    useEffect(() => {
        try {
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving orders to localStorage:', error);
            toast.error('Lỗi khi lưu đơn hàng');
        }
    }, [orders]);

    // Auto-save activeTab
    useEffect(() => {
        try {
            localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
        } catch (error) {
            console.error('Error saving active tab to localStorage:', error);
        }
    }, [activeTab]);



    const handleSearchBlur = () => {
        setTimeout(() => {
            setSearchQuery("");
            setFilteredProducts(products);
            setShowSearchResults(false);
        }, 200);
    }
    const handleSearchFocus = () => {
        if (searchQuery.trim()) {
            setShowSearchResults(true);
        }
    }

    const currentOrder = orders.find(order => order.name === activeTab);


    const removeProductFromOrder = (orderId: string, productId: string) => {
        setOrders((prev) =>
            prev.map((order) =>
                order.id === orderId
                    ? {
                        ...order,
                        products: order.products.filter((p) => p.id !== productId),
                        total: order.products
                            .filter((p) => p.id !== productId)
                            .reduce((sum, p) => sum + p.price * p.quantity, 0),
                    }
                    : order
            )
        );
    };

    const addOrder = () => {
        const newOrderNumber = orderCounter + 1;
        const newOrderId = `order_${newOrderNumber}_${Math.random().toString(36).substr(2, 9)}`
        const newOrder: Order = {
            id: newOrderId,
            name: `Đơn ${newOrderNumber}`,
            products: [],
            total: 0
        };
        setOrders([...orders, newOrder]);
        setActiveTab(newOrder.name);
        setOrderCounter(orderCounter + 1);
    };

    const removeOrder = (orderToRemove: string) => {
        if (orders.length > 1) {
            const newOrders = orders.filter(order => order.name !== orderToRemove);
            setOrders(newOrders);
            if (activeTab === orderToRemove) {
                setActiveTab(newOrders[0].name);
            }
        } else {
            // Nếu chỉ còn 1 đơn, reset về trạng thái ban đầu
            const resetOrder: Order = {
                id: 'order_reset_1',
                name: "Đơn 1",
                products: [],
                total: 0
            };
            setOrders([resetOrder]);
            setActiveTab(resetOrder.name);
            setOrderCounter(1);
        }
    };

    const updateProductQuantity = (productId: string, quantity: number) => {
        if (!currentOrder) return;

        setOrders((prev) =>
            prev.map((order) =>
                order.id === currentOrder.id
                    ? {
                        ...order,
                        products: order.products.map((p) =>
                            p.id === productId ? { ...p, quantity, amount: p.price * quantity } : p
                        ),
                        total: order.products.map((p) =>
                            p.id === productId ? { ...p, quantity, amount: p.price * quantity } : p
                        ).reduce((sum, p) => sum + p.price * p.quantity, 0)
                    }
                    : order
            )
        );
    };

    const updateProductUnit = (productId: string, unit: string) => {
        // Logic để cập nhật đơn vị tính (nếu cần)
        console.log('Update unit:', productId, unit);
    };
    // thanh toán
    const handlePayment = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order?.products.length) {
            toast.error("Đơn hàng không có sản phẩm nào để thanh toán");
            return;
        }

        try {
            const res = await processPosPayment(order)
            if (!res.success) {
                toast.error(`Lỗi khi thanh toán: ${res.error}` || "Đã xảy ra lỗi khi thanh toán");
                return;
            }

            toast.success("Thanh toán thành công");
            removeOrder(order.name);
        } catch (error) {
            console.error("Error during payment:", error);
            toast.error("Lỗi khi thanh toán đơn hàng");
        }
    };
    // In hóa đơn
    const handlePrintInvoice = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order || !order.products.length) {
            toast.error("Không có sản phẩm nào trong đơn hàng để in");
            return;
        }

        try {
            const invoiceData = {
                logo: "",
                storeName: "Tạp Hóa Bác Thanh",
                address: "181 Ỷ La, Dương Nội, Hà Đông, Hà Nội",
                phoneNumber: "0965 138 865",
                products: order.products,
                totalAmount: order.total,
                additionalMessages: "Hẹn gặp lại quý khách!"
            };

            const result = await printInvoice(invoiceData); // Gọi Server Action
            if (!result.success) {
                throw new Error(result.message || 'Failed to print invoice');
            }

            toast.success(result.message || "Đã gửi lệnh in hóa đơn");
        } catch (error) {
            console.error("Error printing invoice:", error);
            toast.error(error instanceof Error ? error.message : "Lỗi khi in hóa đơn");
        }
    };

    const addProductToOrder = (variant: Variant, productName: string, productImage?: string) => {
        if (!currentOrder) return;
        const existingProduct = currentOrder.products.find(p => p.id === variant.variantId);
        if (existingProduct) {
            updateProductQuantity(variant.variantId, existingProduct.quantity + 1);
            toast.success(`Đã tăng số lượng ${productName}`);
        } else {
            const newCartProduct: CartProduct = {
                id: variant.variantId,
                productId: variant.variantId,
                image: variant.image || productImage || "",
                name: `${variant.variantName}`,
                SKU: variant.SKU,
                unit: [variant.unit],
                quantity: 1,
                price: variant.price,
                amount: variant.price
            }
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === currentOrder.id
                        ? {
                            ...order,
                            products: [...order.products, newCartProduct],
                            total: order.total + newCartProduct.price
                        }
                        : order
                )
            );
            toast.success(`Đã thêm ${newCartProduct.name} vào đơn hàng`);
        }

        setSearchQuery("");
        setShowSearchResults(false);
        setFilteredProducts(products);
    }

    const SearchDropdown = () => {
        if (!showSearchResults) return null;

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
                    {filteredProducts.slice(0, 10).map((product) => // Giới hạn 10 sản phẩm đầu tiên
                        product.variants.map((variant) => (
                            <div
                                key={variant.variantId}
                                className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors"
                                onClick={() => addProductToOrder(variant, product.name, product.image)}
                            >
                                {/* Ảnh sản phẩm */}
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

                                {/* Thông tin sản phẩm */}
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

                                {/* Giá */}
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
    }

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

    // barcode scanner integration
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [isScanning, setIsScanning] = useState(false);
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);


    // barcode scanner logic
    useEffect(() => {
        let barcode = '';
        let scanStartTime = 0;

        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement && e.target !== searchInputRef.current) return;

            const currentTime = Date.now();
            const timeDiff = currentTime - scanStartTime;

            if (timeDiff > 100) barcode = '';

            if (e.key === 'Enter' && barcode.length > 0) {
                e.preventDefault();
                handleBarcodeScanned(barcode);
                barcode = '';
                setIsScanning(false);
                return;
            }

            if (e.key.length === 1) {
                barcode += e.key;
                scanStartTime = currentTime;
                setIsScanning(true);

                if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = setTimeout(() => {
                    barcode = '';
                    setIsScanning(false);
                }, 200);
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
            if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    // Xử lý phím tắt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F3 - Focus vào search
            if (e.key === 'F3') {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                }
            }

            // F1 - Thanh toán
            if (e.key === 'F1') {
                e.preventDefault();
                if (currentOrder && currentOrder.products.length > 0) {
                    handlePayment(currentOrder.id);
                }
            }

            // Escape - Clear search
            if (e.key === 'Escape') {
                setSearchQuery("");
                setShowSearchResults(false);
                setFilteredProducts(products);
                if (searchInputRef.current) {
                    searchInputRef.current.blur();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentOrder, products]);

    // Xử lý khi barcode được scan
    const handleBarcodeScanned = (scannedBarcode: string) => {
        // console.log('Barcode scanned:', scannedBarcode);

        // Tìm sản phẩm theo barcode
        const foundProduct = products.find(product =>
            product.variants.some(variant =>
                variant.barcode === scannedBarcode
            )
        );

        if (foundProduct) {
            const foundVariant = foundProduct.variants.find(variant =>
                variant.barcode === scannedBarcode
            );

            if (foundVariant) {
                // Thêm sản phẩm vào đơn hàng
                addProductToOrder(foundVariant, foundProduct.name, foundProduct.image);
                toast.success(`Đã quét mã: ${foundVariant.variantName}`);

                // Reset search bar ngay lập tức khi tìm thấy sản phẩm
                setSearchQuery("");
                setShowSearchResults(false);
                setFilteredProducts(products);

                // Blur search input để tránh focus
                if (searchInputRef.current) {
                    searchInputRef.current.blur();
                }
            }
        } else {
            // Không tìm thấy sản phẩm, hiển thị trong search
            setSearchQuery(scannedBarcode);
            handleSearch(scannedBarcode);
            toast.warning(`Không tìm thấy sản phẩm với mã: ${scannedBarcode}`);

            // Focus vào search input
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setFilteredProducts(products);
            setShowSearchResults(false);
            return;
        }
        const searchTerm = query.toLowerCase();
        const filtered = products.filter(product => {
            const productNameMatch = product.name.toLowerCase().includes(searchTerm);

            const variantMatch = product.variants.some(variant => {
                const variantNameMatch = variant.variantName.toLowerCase().includes(searchTerm);
                const barcodeMatch = variant.barcode ? variant.barcode.toLowerCase().includes(searchTerm) : false;
                const skuMatch = variant.SKU.toLowerCase().includes(searchTerm);
                return variantNameMatch || barcodeMatch || skuMatch;
            })
            return productNameMatch || variantMatch;
        })
        setFilteredProducts(filtered);
        setShowSearchResults(true);
    }


    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="bg-card border-b shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm"
                            className={`pl-10 ${isScanning ? 'ring-2 ring-blue-500' : ''}`}
                            value={searchQuery}
                            onChange={(e) => { handleSearch(e.target.value) }}
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
                                    {/* Hiển thị indicator nếu đơn có sản phẩm */}
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
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Product List Area */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-hide">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {orders.map((order) => (
                            <TabsContent key={order.id} value={order.name} className="mt-0">
                                {order.products.length === 0 ? (
                                    <EmptyOrder />
                                ) : (
                                    <div className="space-y-4">
                                        {order.products.map((product) => (
                                            <OnCart
                                                key={product.id}
                                                product={product}
                                                onUpdateQuantity={updateProductQuantity}
                                                onUpdateUnit={updateProductUnit}
                                                onRemoveProduct={(productId) => removeProductFromOrder(order.id, productId)}
                                            />
                                        ))}
                                    </div>
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
                                {/* <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Giảm giá:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">0₫</span>
                                </div> */}
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
                            <Button variant="outline" className="flex-1" size="sm">
                                Lưu tạm
                            </Button>
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