"use server";

import prisma from "@/lib/prisma";

interface CartProduct {
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

interface POSOrder {
    id: string;
    name: string;
    products: CartProduct[];
    total: number;
}

export async function processPosPayment(order: POSOrder): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {

        const orderCode = `POS-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const result = await prisma.$transaction(async (tx) => {
            const createdOrder = await tx.order.create({
                data: {
                    orderCode,
                    status: "completed",
                    paymentStatus: "paid",
                    totalAmount: order.total,
                    note: `POS Order - ${order.name}`,
                }
            });

            for (const product of order.products) {
                await tx.orderDetail.create({
                    data: {
                        orderId: createdOrder.orderId,
                        variantId: BigInt(product.id),
                        quantity: product.quantity,
                        unitPrice: product.price,
                        discount: 0,
                        totalAmount: product.amount,
                    }
                });
                // Uncomment the following block to update inventory
                // const inventory = await tx.inventory.findUnique({
                //     where: { variantId: BigInt(product.id) }
                // });

                // if (inventory) {
                //     const newStock = inventory.currentStock - product.quantity;

                //     // Check if stock goes negative
                //     if (newStock < 0) {
                //         throw new Error(`Insufficient stock for product: ${product.name}. Available: ${inventory.currentStock}, Required: ${product.quantity}`);
                //     }

                //     await tx.inventory.update({
                //         where: { variantId: BigInt(product.id) },
                //         data: { currentStock: newStock }
                //     });
                // } else {
                //     // Create inventory record if it doesn't exist
                //     await tx.inventory.create({
                //         data: {
                //             variantId: BigInt(product.id),
                //             initialStock: 0,
                //             currentStock: -product.quantity, // Negative stock to indicate shortage
                //             minStock: 0,
                //             maxStock: 0,
                //         }
                //     });
                // }
            }
            return createdOrder;
        })
        return { success: true, orderId: result.orderCode };

    } catch (error) {
        console.error("Error processing POS payment:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" };
    }
}