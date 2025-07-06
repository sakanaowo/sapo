"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, X } from "lucide-react";

export default function POSPage() {
    const [orders, setOrders] = useState(["Đơn 1", "Đơn 2"]);
    const [activeTab, setActiveTab] = useState("Đơn 1");

    const addOrder = () => {
        const newOrder = `Đơn ${orders.length + 1}`;
        setOrders([...orders, newOrder]);
        setActiveTab(newOrder);
    };

    const removeOrder = (orderToRemove: string) => {
        if (orders.length > 1) {
            const newOrders = orders.filter(order => order !== orderToRemove);
            setOrders(newOrders);
            if (activeTab === orderToRemove) {
                setActiveTab(newOrders[0]);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="bg-card border-b shadow-sm p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm (F3)"
                            className="pl-10"
                        />
                    </div>

                    {/* Order Tabs */}
                    <div className="flex items-center gap-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                            <div className="flex items-center gap-2">
                                <TabsList className="bg-muted">
                                    {orders.map((order) => (
                                        <TabsTrigger
                                            key={order}
                                            value={order}
                                            className="relative group data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                        >
                                            {order}
                                            {orders.length > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeOrder(order);
                                                    }}
                                                    className="ml-2 opacity-0 group-hover:opacity-100 hover:bg-destructive rounded-full p-0.5"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addOrder}
                                    className="border-dashed"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Thêm đơn
                                </Button>
                            </div>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Product List Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        {orders.map((order) => (
                            <TabsContent key={order} value={order} className="mt-0">
                                <Card>
                                    <CardContent>
                                        <div className="text-center py-12 text-muted-foreground">
                                            <div className="text-4xl mb-4">🛒</div>
                                            <p className="text-lg mb-2">Chưa có sản phẩm nào</p>
                                            <p className="text-sm">Sử dụng thanh tìm kiếm để thêm sản phẩm vào đơn hàng</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* Order Summary Sidebar */}
                <div className="w-80 bg-card border-l shadow-sm flex flex-col">
                    <div className="p-6 border-b bg-muted/30">
                        <h3 className="text-lg font-semibold mb-2">Thông tin đơn hàng</h3>
                        <span className="inline-block bg-muted text-muted-foreground text-sm px-2 py-1 rounded">
                            {activeTab}
                        </span>
                    </div>

                    <div className="flex-1 p-6">
                        <div className="space-y-4">
                            <div className="bg-muted/50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Số lượng sản phẩm:</span>
                                    <span className="font-medium">0</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Tạm tính:</span>
                                    <span className="font-medium">0₫</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Giảm giá:</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">0₫</span>
                                </div>
                                <hr className="my-3 border-border" />
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold">Tổng cộng:</span>
                                    <span className="text-xl font-bold text-primary">0₫</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-muted/30">
                        <Button
                            className="w-full font-medium py-3 text-lg"
                            size="lg"
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