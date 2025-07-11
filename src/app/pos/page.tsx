"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X, Plus } from "lucide-react";
import { toast } from "sonner";
import OnCart from "@/components/POS/onCart";
import Image from "next/image";

type Variant = {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode: string;
    SKU: string;
    image: string | null;
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
    const [products, setProducts] = useState<Products[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Products[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/api/POS', { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                    setFilteredProducts(data);
                } else {
                    // Xử lý lỗi HTTP
                    const errorData = await response.json().catch(() => ({}));
                    console.error("HTTP error:", response.status, errorData);
                    toast.error(`Lỗi khi tải sản phẩm: ${response.status}`);
                }
            } catch (error) {
                console.error("Error fetching products:", error);
                toast.error("Lỗi khi tải sản phẩm");
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);
    console.log("Products:", products);


    const [activeTab, setActiveTab] = useState("Đơn 1");

    const handleSearch = (query: string) => {
        if (!query.trim()) {
            setFilteredProducts(products);
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
    }

    // Khởi tạo orders với một số sản phẩm mẫu
    const [orders, setOrders] = useState<Order[]>([
        {
            id: "1",
            name: "Đơn 1",
            products: [
                {
                    id: "1",
                    productId: "1",
                    image: "https://sapo.dktcdn.net/100/705/120/variants/9ccf3470-4e20-41e0-9935-d342b0d877f7.jpg",
                    name: "DG Xmen Fire dây",
                    SKU: "PVN5599",
                    unit: ["dây"],
                    quantity: 2,
                    price: 15000,
                    amount: 30000
                },
                {
                    id: "5",
                    productId: "4",
                    image: "https://sapo.dktcdn.net/100/705/120/variants/146812a3-32db-4f14-80cc-e6aece96c796.jpg",
                    name: "Muối chanh ớt Dasavi 260g",
                    SKU: "PVN5596",
                    unit: ["chai"],
                    quantity: 1,
                    price: 25000,
                    amount: 25000
                }
            ],
            total: 55000
        },
        {
            id: "2",
            name: "Đơn 2",
            products: [
                {
                    id: "6",
                    productId: "5",
                    image: "https://sapo.dktcdn.net/100/705/120/variants/4ab13a99-38f6-4c17-9a49-09d936a83187.jpg",
                    name: "Tẩy trắng Hygiene 250ml",
                    SKU: "PVN5595",
                    unit: ["chai"],
                    quantity: 3,
                    price: 18000,
                    amount: 54000
                }
            ],
            total: 54000
        },
    ]);

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
        const newOrderId = (orders.length + 1).toString();
        const newOrder: Order = {
            id: newOrderId,
            name: `Đơn ${orders.length + 1}`,
            products: [],
            total: 0
        };
        setOrders([...orders, newOrder]);
        setActiveTab(newOrder.name);
    };

    const removeOrder = (orderToRemove: string) => {
        if (orders.length > 1) {
            const newOrders = orders.filter(order => order.name !== orderToRemove);
            setOrders(newOrders);
            if (activeTab === orderToRemove) {
                setActiveTab(newOrders[0].name);
            }
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

    const handlePayment = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order?.products.length) {
            toast.error("Đơn hàng không có sản phẩm nào để thanh toán");
            return;
        }

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order)
            });

            if (!response.ok) {
                throw new Error('Payment failed');
            }

            toast.success("Thanh toán thành công");
            removeOrder(order.name);
        } catch (error) {
            console.error("Error during payment:", error);
            toast.error("Lỗi khi thanh toán đơn hàng");
        }
    };

    const addProductToOrder = (variant: Variant, productName: string, productImage?: string) => {
        if (!currentOrder) return;
        const existingProduct = currentOrder.products.find(p => p.id === variant.variantId);
        if (existingProduct) {
            updateProductQuantity(variant.variantId, existingProduct.quantity + 1);
            return;
        }

        const newCartProduct: CartProduct = {
            id: variant.variantId,
            productId: variant.variantId, // hoặc productId nếu có
            image: variant.image || productImage || "",
            name: `${productName} - ${variant.variantName}`,
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

    const SearchResults = () => {
        if (isLoading) {
            return (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <div className="text-muted-foreground">Đang tải sản phẩm...</div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        if (filteredProducts.length === 0) {
            return (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">
                            <div className="text-4xl mb-4">🔍</div>
                            <p className="text-lg mb-2">Không tìm thấy sản phẩm</p>
                            <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) =>
                    product.variants.map((variant) => (
                        <Card
                            key={variant.variantId}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => addProductToOrder(variant, product.name, product.image)}
                        >
                            <CardContent className="p-4">
                                <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">

                                    <Image
                                        src={variant.image || product.image || "/not-found.png"}
                                        alt={variant.variantName}
                                        className="w-full h-full object-cover"
                                        width={200}
                                        height={200}
                                    />

                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">{variant.SKU}</p>
                                    <p className="text-sm font-medium line-clamp-2" title={`${product.name} - ${variant.variantName}`}>
                                        {product.name} - {variant.variantName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{variant.unit}</p>
                                    <p className="text-sm font-bold text-primary">
                                        {variant.price.toLocaleString('vi-VN')}₫
                                    </p>
                                    {variant.barcode && (
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {variant.barcode}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
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
                            className="pl-10"
                            onChange={(e) => { handleSearch(e.target.value) }}
                        />
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
                <div className="flex-1 p-6 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {orders.map((order) => (
                            <TabsContent key={order.id} value={order.name} className="mt-0">
                                {order.products.length === 0 ? (
                                    <div className="space-y-6">
                                        <EmptyOrder />
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Tìm kiếm sản phẩm</h3>
                                            <SearchResults />
                                        </div>
                                    </div>
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

                                        {/* Hiển thị kết quả tìm kiếm bên dưới danh sách sản phẩm */}
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-4">Thêm sản phẩm</h3>
                                            <SearchResults />
                                        </div>
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
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Giảm giá:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">0₫</span>
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
                            <Button variant="outline" className="flex-1" size="sm">
                                In bill
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}