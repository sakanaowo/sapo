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
import onScan from "onscan.js";

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
    const [isManualSearch, setIsManualSearch] = useState(false); // Track manual search
    const [lastScanTime, setLastScanTime] = useState(0); // Track last scan time

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
            if (!isManualSearch) return; // Don't clear if it's from barcode scan
            setSearchQuery("");
            setFilteredProducts(products);
            setShowSearchResults(false);
            setIsManualSearch(false);
        }, 200);
    }

    const handleSearchFocus = () => {
        setIsManualSearch(true); // Mark as manual search
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

            const result = await printInvoice(invoiceData);
            if (!result.success) {
                throw new Error(result.message || 'Failed to print invoice');
            }

            toast.success(result.message || "Đã gửi lệnh in hóa đơn");
        } catch (error) {
            console.error("Error printing invoice:", error);
            toast.error(error instanceof Error ? error.message : "Lỗi khi in hóa đơn");
        }
    };

    const addProductToOrder = (variant: Variant, productName: string, productImage?: string, fromBarcode: boolean = false, targetOrderId?: string) => {
        // Use targetOrderId if provided (for barcode), otherwise use currentOrder
        const targetOrder = targetOrderId
            ? orders.find(order => order.id === targetOrderId)
            : currentOrder;

        if (!targetOrder) return;

        const existingProduct = targetOrder.products.find(p => p.id === variant.variantId);

        if (existingProduct) {
            // Increase quantity for existing product in the target order
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === targetOrder.id
                        ? {
                            ...order,
                            products: order.products.map((p) =>
                                p.id === variant.variantId
                                    ? { ...p, quantity: p.quantity + 1, amount: p.price * (p.quantity + 1) }
                                    : p
                            ),
                            total: order.products
                                .map((p) => p.id === variant.variantId
                                    ? { ...p, quantity: p.quantity + 1, amount: p.price * (p.quantity + 1) }
                                    : p
                                )
                                .reduce((sum, p) => sum + p.amount, 0)
                        }
                        : order
                )
            );

            if (fromBarcode) {
                toast.success(`Đã tăng số lượng ${variant.variantName} (${existingProduct.quantity + 1}) vào ${targetOrder.name}`);
            } else {
                toast.success(`Đã tăng số lượng ${productName} vào ${targetOrder.name}`);
            }
        } else {
            // Add new product to target order
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
                    order.id === targetOrder.id
                        ? {
                            ...order,
                            products: [...order.products, newCartProduct],
                            total: order.total + newCartProduct.price
                        }
                        : order
                )
            );

            if (fromBarcode) {
                toast.success(`Đã thêm ${newCartProduct.name} vào ${targetOrder.name}`);
            } else {
                toast.success(`Đã thêm ${newCartProduct.name} vào đơn hàng`);
            }
        }

        // Only clear search if it's from manual search
        if (!fromBarcode) {
            setSearchQuery("");
            setShowSearchResults(false);
            setFilteredProducts(products);
            setIsManualSearch(false);
        }
    }

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

    // barcode scanner using onScan.js
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Xử lý khi barcode được scan
    const handleBarcodeScanned = (scannedBarcode: string) => {
        console.log('Barcode scanned:', scannedBarcode);

        // Update last scan time
        setLastScanTime(Date.now());

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
                // Thêm sản phẩm vào đơn hàng (with fromBarcode = true)
                addProductToOrder(foundVariant, foundProduct.name, foundProduct.image, true);

                // Clear search input (not search state)
                if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                    searchInputRef.current.blur();
                }
            }
        } else {
            // Không tìm thấy sản phẩm, hiển thị trong search
            setSearchQuery(scannedBarcode);
            handleSearch(scannedBarcode);
            toast.warning(`Không tìm thấy sản phẩm với mã: ${scannedBarcode}`);

            // Focus vào search input for manual search
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
            setIsManualSearch(true);
        }
    };

    // Initialize onScan.js
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Cấu hình onScan
            onScan.attachTo(document, {
                suffixKeyCodes: [13], // Enter as suffix
                reactToPaste: false,
                timeBetweenScansMillis: 50, // Increased to better distinguish from manual typing
                minLength: 3, // Minimum length to avoid false positives
                avgTimeByChar: 15, // Lower avg time per char for barcode scanning
                preventDefault: false,
                stopPropagation: false,
                // Ignore scan when search input is focused and user is manually typing
                ignoreIfFocusOn: false, // We'll handle this manually
                onScan: (scannedBarcode: string) => {
                    // Only process if not manual search or if enough time has passed since last manual input
                    const now = Date.now();
                    const timeSinceLastScan = now - lastScanTime;

                    // If search input is focused and user was recently typing, ignore
                    if (searchInputRef.current === document.activeElement && isManualSearch && timeSinceLastScan < 1000) {
                        return;
                    }

                    handleBarcodeScanned(scannedBarcode);
                },
                onScanError: (error: Event) => {
                    console.log('Scan error:', error);
                }
            });

            // Cleanup function
            return () => {
                onScan.detachFrom(document);
            };
        }
    }, [products, isManualSearch, lastScanTime, orders, activeTab]); // Added orders and activeTab dependencies

    // Xử lý phím tắt
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F3 - Focus vào search
            if (e.key === 'F3') {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                    setIsManualSearch(true);
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
                setIsManualSearch(false);
                if (searchInputRef.current) {
                    searchInputRef.current.blur();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [currentOrder, products]);

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
        if (isManualSearch) {
            setShowSearchResults(true);
        }
    }

    // Handle manual input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (searchInputRef.current === document.activeElement) {
            setIsManualSearch(true);
        }
        handleSearch(value);
    }

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="bg-card border-b shadow-sm p-4">
                <div className="flex items-center gap-4">
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