import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getProductsForDisplay, printInvoice } from '@/actions/POS.action';
import { processPosPayment } from '@/actions/order.action';
import onScan from 'onscan.js';

export type Variant = {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode?: string;
    SKU: string;
    image?: string | null;
}

export type Products = {
    productId: string;
    name: string;
    image?: string;
    variants: Variant[];
}

export type CartProduct = {
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

export type Order = {
    id: string;
    name: string;
    products: CartProduct[];
    total: number;
}

const ORDERS_STORAGE_KEY = "orders";
const ACTIVE_TAB_STORAGE_KEY = "activeTab";
const ORDER_COUNTER_KEY = "pos_order_counter";

export function usePosStore() {
    // Core state
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isManualSearch, setIsManualSearch] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(0);

    // Order management
    const [orderCounter, setOrderCounter] = useState(1);
    const [orders, setOrders] = useState<Order[]>([{
        id: "1",
        name: "Đơn 1",
        products: [],
        total: 0
    }]);
    const [activeTab, setActiveTab] = useState("Đơn 1");

    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Initialize data
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
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, []);

    // Load from localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Load orderCounter
        const savedCounter = localStorage.getItem(ORDER_COUNTER_KEY);
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

    // Auto-save to localStorage
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(ORDER_COUNTER_KEY, orderCounter.toString());
    }, [orderCounter]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
        } catch (error) {
            console.error('Error saving orders to localStorage:', error);
            toast.error('Lỗi khi lưu đơn hàng');
        }
    }, [orders]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
        } catch (error) {
            console.error('Error saving active tab to localStorage:', error);
        }
    }, [activeTab]);

    // Computed values
    const currentOrder = orders.find(order => order.name === activeTab);

    // Search functionality
    const handleSearch = useCallback((query: string) => {
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
            });
            return productNameMatch || variantMatch;
        });

        setFilteredProducts(filtered);
        if (isManualSearch) {
            setShowSearchResults(true);
        }
    }, [products, isManualSearch]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (searchInputRef.current === document.activeElement) {
            setIsManualSearch(true);
        }
        handleSearch(value);
    }, [handleSearch]);

    const handleSearchBlur = useCallback(() => {
        setTimeout(() => {
            if (!isManualSearch) return;
            setSearchQuery("");
            setFilteredProducts(products);
            setShowSearchResults(false);
            setIsManualSearch(false);
        }, 200);
    }, [isManualSearch, products]);

    const handleSearchFocus = useCallback(() => {
        setIsManualSearch(true);
        if (searchQuery.trim()) {
            setShowSearchResults(true);
        }
    }, [searchQuery]);

    // Order management
    const addOrder = useCallback(() => {
        const newOrderNumber = orderCounter + 1;
        const newOrderId = `order_${newOrderNumber}_${Math.random().toString(36).substr(2, 9)}`;
        const newOrder: Order = {
            id: newOrderId,
            name: `Đơn ${newOrderNumber}`,
            products: [],
            total: 0
        };
        setOrders(prev => [...prev, newOrder]);
        setActiveTab(newOrder.name);
        setOrderCounter(newOrderNumber);
    }, [orderCounter]);

    const removeOrder = useCallback((orderToRemove: string) => {
        if (orders.length > 1) {
            const newOrders = orders.filter(order => order.name !== orderToRemove);
            setOrders(newOrders);
            if (activeTab === orderToRemove) {
                setActiveTab(newOrders[0].name);
            }
        } else {
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
    }, [orders, activeTab]);

    // Product management
    const addProductToOrder = useCallback((
        variant: Variant,
        productName: string,
        productImage?: string,
        fromBarcode: boolean = false,
        targetOrderId?: string
    ) => {
        const targetOrder = targetOrderId
            ? orders.find(order => order.id === targetOrderId)
            : currentOrder;

        if (!targetOrder) return;

        const existingProduct = targetOrder.products.find(p => p.id === variant.variantId);

        if (existingProduct) {
            setOrders(prev =>
                prev.map(order =>
                    order.id === targetOrder.id
                        ? {
                            ...order,
                            products: order.products.map(p =>
                                p.id === variant.variantId
                                    ? { ...p, quantity: p.quantity + 1, amount: p.price * (p.quantity + 1) }
                                    : p
                            ),
                            total: order.products
                                .map(p => p.id === variant.variantId
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
            const newCartProduct: CartProduct = {
                id: variant.variantId,
                productId: variant.variantId,
                image: variant.image || productImage || "",
                name: variant.variantName,
                SKU: variant.SKU,
                unit: [variant.unit],
                quantity: 1,
                price: variant.price,
                amount: variant.price
            };

            setOrders(prev =>
                prev.map(order =>
                    order.id === targetOrder.id
                        ? {
                            ...order,
                            products: [newCartProduct, ...order.products],
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

        if (!fromBarcode) {
            setSearchQuery("");
            setShowSearchResults(false);
            setFilteredProducts(products);
            setIsManualSearch(false);
        }
    }, [orders, currentOrder, products]);

    const removeProductFromOrder = useCallback((orderId: string, productId: string) => {
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId
                    ? {
                        ...order,
                        products: order.products.filter(p => p.id !== productId),
                        total: order.products
                            .filter(p => p.id !== productId)
                            .reduce((sum, p) => sum + p.price * p.quantity, 0),
                    }
                    : order
            )
        );
    }, []);

    const updateProductQuantity = useCallback((productId: string, quantity: number) => {
        if (!currentOrder) return;

        setOrders(prev =>
            prev.map(order =>
                order.id === currentOrder.id
                    ? {
                        ...order,
                        products: order.products.map(p =>
                            p.id === productId ? { ...p, quantity, amount: p.price * quantity } : p
                        ),
                        total: order.products.map(p =>
                            p.id === productId ? { ...p, quantity, amount: p.price * quantity } : p
                        ).reduce((sum, p) => sum + p.price * p.quantity, 0)
                    }
                    : order
            )
        );
    }, [currentOrder]);

    const updateProductUnit = useCallback((productId: string, unit: string) => {
        console.log('Update unit:', productId, unit);
    }, []);

    // Payment and printing
    const handlePayment = useCallback(async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order?.products.length) {
            toast.error("Đơn hàng không có sản phẩm nào để thanh toán");
            return;
        }

        try {
            const res = await processPosPayment(order);
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
    }, [orders, removeOrder]);

    const handlePrintInvoice = useCallback(async (orderId: string) => {
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
    }, [orders]);

    // Barcode scanning
    const handleBarcodeScanned = useCallback((scannedBarcode: string) => {
        console.log('Barcode scanned:', scannedBarcode);
        setLastScanTime(Date.now());

        const foundProduct = products.find(product =>
            product.variants.some(variant => variant.barcode === scannedBarcode)
        );

        if (foundProduct) {
            const foundVariant = foundProduct.variants.find(variant =>
                variant.barcode === scannedBarcode
            );

            if (foundVariant) {
                addProductToOrder(foundVariant, foundProduct.name, foundProduct.image, true);
                if (searchInputRef.current) {
                    searchInputRef.current.value = "";
                    searchInputRef.current.blur();
                }
            }
        } else {
            setSearchQuery(scannedBarcode);
            handleSearch(scannedBarcode);
            toast.warning(`Không tìm thấy sản phẩm với mã: ${scannedBarcode}`);

            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
            setIsManualSearch(true);
        }
    }, [products, addProductToOrder, handleSearch]);

    // Initialize barcode scanner
    useEffect(() => {
        if (typeof window !== 'undefined') {
            onScan.attachTo(document, {
                suffixKeyCodes: [13],
                reactToPaste: false,
                timeBetweenScansMillis: 50,
                minLength: 3,
                avgTimeByChar: 15,
                preventDefault: false,
                stopPropagation: false,
                ignoreIfFocusOn: false,
                onScan: (scannedBarcode: string) => {
                    const now = Date.now();
                    const timeSinceLastScan = now - lastScanTime;

                    if (searchInputRef.current === document.activeElement && isManualSearch && timeSinceLastScan < 1000) {
                        return;
                    }

                    handleBarcodeScanned(scannedBarcode);
                },
                onScanError: (error: Event) => {
                    console.log('Scan error:', error);
                }
            });

            return () => {
                onScan.detachFrom(document);
            };
        }
    }, [products, isManualSearch, lastScanTime, orders, activeTab, handleBarcodeScanned]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F3') {
                e.preventDefault();
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                    searchInputRef.current.select();
                    setIsManualSearch(true);
                }
            }

            if (e.key === 'F1') {
                e.preventDefault();
                if (currentOrder && currentOrder.products.length > 0) {
                    handlePayment(currentOrder.id);
                }
            }

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
    }, [currentOrder, products, handlePayment]);

    return {
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

        // Search actions
        handleSearch,
        handleInputChange,
        handleSearchBlur,
        handleSearchFocus,
        setActiveTab,

        // Order actions
        addOrder,
        removeOrder,
        addProductToOrder,
        removeProductFromOrder,
        updateProductQuantity,
        updateProductUnit,

        // Payment actions
        handlePayment,
        handlePrintInvoice,
    };
}