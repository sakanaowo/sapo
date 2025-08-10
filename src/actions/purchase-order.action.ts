"use server"

import redis from "@/lib/redis";
import prisma from "@/lib/prisma";

export async function createPurchaseOrderFromExistingProducts(data: {
    supplierId: string;
    importDate?: Date;
    note?: string;
    items: Array<{
        variantId: string;
        quantity: number;
        unitPrice: number;
        discount?: number;
    }>;
}) {
    try {
        // Validation
        if (!data.supplierId) {
            throw new Error('Supplier ID là bắt buộc');
        }
        if (!data.items || data.items.length === 0) {
            throw new Error('Danh sách sản phẩm không được rỗng');
        }

        // Validate từng item
        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i];
            if (!item.variantId) {
                throw new Error(`Variant ID tại dòng ${i + 1} là bắt buộc`);
            }
            if (item.quantity <= 0) {
                throw new Error(`Số lượng tại dòng ${i + 1} phải lớn hơn 0`);
            }
            if (item.unitPrice < 0) {
                throw new Error(`Giá nhập tại dòng ${i + 1} không được âm`);
            }
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra supplier có tồn tại không
            const supplier = await tx.supplier.findUnique({
                where: { supplierId: BigInt(data.supplierId) }
            });

            if (!supplier) {
                throw new Error('Nhà cung cấp không tồn tại');
            }

            // Kiểm tra tất cả variants có tồn tại không
            const variants = await tx.productVariant.findMany({
                where: {
                    variantId: {
                        in: data.items.map(item => BigInt(item.variantId))
                    }
                },
                include: {
                    product: {
                        select: {
                            productId: true,
                            name: true,
                        }
                    },
                    inventory: true,
                }
            });

            if (variants.length !== data.items.length) {
                throw new Error('Một số sản phẩm không tồn tại trong hệ thống');
            }

            // Tạo mã Purchase Order duy nhất
            const purchaseOrderCode = `PO-RESTOCK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            // Tính tổng amount
            let totalOrderAmount = 0;
            const purchaseOrderDetails = [];

            for (const item of data.items) {
                const totalAmount = item.quantity * item.unitPrice - (item.discount || 0);
                totalOrderAmount += totalAmount;

                purchaseOrderDetails.push({
                    variantId: BigInt(item.variantId),
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    totalAmount,
                });
            }

            // Tạo Purchase Order
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    purchaseOrderCode,
                    supplierId: BigInt(data.supplierId),
                    createdBy: null, // Có thể thêm user ID sau
                    importDate: data.importDate || new Date(),
                    status: 'PENDING', // Để pending, sẽ update khi nhập hàng thực tế
                    importStatus: 'PENDING',
                    purchaseOrderDetails: {
                        createMany: {
                            data: purchaseOrderDetails
                        }
                    },
                },
                include: {
                    supplier: {
                        select: {
                            supplierId: true,
                            name: true,
                            supplierCode: true,
                        }
                    },
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: {
                                        select: {
                                            productId: true,
                                            name: true,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            return {
                purchaseOrder,
                totalAmount: totalOrderAmount,
                itemCount: data.items.length
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đã tạo đơn nhập hàng ${serialized.purchaseOrder.purchaseOrderCode} với ${serialized.itemCount} sản phẩm`
        };
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return {
            success: false,
            message: `Failed to create purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function confirmPurchaseOrderImport(
    purchaseOrderId: string,
    importData?: {
        actualQuantities?: Array<{
            variantId: string;
            actualQuantity: number;
        }>;
        importDate?: Date;
        note?: string;
    }
) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Lấy Purchase Order hiện tại
            const purchaseOrder = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    inventory: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!purchaseOrder) {
                throw new Error('Đơn nhập hàng không tồn tại');
            }

            if (purchaseOrder.importStatus === 'IMPORTED') {
                throw new Error('Đơn nhập hàng này đã được nhập vào kho');
            }

            // Cập nhật trạng thái Purchase Order
            await tx.purchaseOrder.update({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                data: {
                    status: 'COMPLETED',
                    importStatus: 'IMPORTED',
                    importDate: importData?.importDate || new Date(),
                },
            });

            const inventoryUpdates = [];

            // Cập nhật inventory cho từng product variant
            for (const detail of purchaseOrder.purchaseOrderDetails) {
                let quantityToAdd = detail.quantity;

                // Nếu có actual quantity khác với planned quantity
                if (importData?.actualQuantities) {
                    const actualQty = importData.actualQuantities.find(
                        aq => aq.variantId === detail.variantId.toString()
                    );
                    if (actualQty) {
                        quantityToAdd = actualQty.actualQuantity;

                        // Cập nhật purchase order detail với actual quantity
                        await tx.purchaseOrderDetail.update({
                            where: { purchaseOrderDetailId: detail.purchaseOrderDetailId },
                            data: {
                                quantity: actualQty.actualQuantity,
                                totalAmount: actualQty.actualQuantity * detail.unitPrice - detail.discount,
                            },
                        });
                    }
                }

                // Cập nhật hoặc tạo inventory
                if (detail.variant.inventory) {
                    const updatedInventory = await tx.inventory.update({
                        where: { inventoryId: detail.variant.inventory.inventoryId },
                        data: {
                            currentStock: {
                                increment: quantityToAdd
                            },
                            updatedAt: new Date(),
                        },
                    });
                    inventoryUpdates.push(updatedInventory);
                } else {
                    // Tạo inventory mới nếu chưa có
                    const newInventory = await tx.inventory.create({
                        data: {
                            variantId: detail.variantId,
                            initialStock: quantityToAdd,
                            currentStock: quantityToAdd,
                            minStock: 0,
                            maxStock: 0,
                        },
                    });
                    inventoryUpdates.push(newInventory);
                }
            }

            // Lấy Purchase Order đã cập nhật
            const updatedPurchaseOrder = await tx.purchaseOrder.findUnique({
                where: { purchaseOrderId: BigInt(purchaseOrderId) },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    inventory: true,
                                }
                            }
                        }
                    }
                }
            });

            return {
                purchaseOrder: updatedPurchaseOrder,
                inventoryUpdates,
                importedItemsCount: purchaseOrder.purchaseOrderDetails.length
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(result, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: `Đã nhập hàng thành công cho ${serialized.importedItemsCount} sản phẩm`
        };
    } catch (error) {
        console.error('Error confirming purchase order import:', error);
        return {
            success: false,
            message: `Failed to confirm import: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function getPurchaseOrders({
    page = 1,
    limit = 20,
    status,
    supplierId,
    search = '',
    dateFrom,
    dateTo
}: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
} = {}) {
    try {
        // Build where clause
        const whereClause: {
            status?: string;
            supplierId?: bigint;
            purchaseOrderCode?: {
                contains: string;
                mode: 'insensitive';
            };
            createdAt?: {
                gte?: Date;
                lte?: Date;
            };
        } = {};

        if (status) {
            whereClause.status = status;
        }

        if (supplierId) {
            whereClause.supplierId = BigInt(supplierId);
        }

        if (search) {
            whereClause.purchaseOrderCode = {
                contains: search,
                mode: 'insensitive'
            };
        }

        if (dateFrom || dateTo) {
            whereClause.createdAt = {};
            if (dateFrom) {
                whereClause.createdAt.gte = dateFrom;
            }
            if (dateTo) {
                whereClause.createdAt.lte = dateTo;
            }
        }

        // Get total count
        const totalCount = await prisma.purchaseOrder.count({ where: whereClause });

        // Get purchase orders
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: whereClause,
            include: {
                supplier: {
                    select: {
                        supplierId: true,
                        name: true,
                        supplierCode: true,
                    }
                },
                purchaseOrderDetails: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        productId: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        purchaseOrderDetails: true
                    }
                }
            },
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate totals for each purchase order
        const purchaseOrdersWithTotals = purchaseOrders.map(po => {
            const totalAmount = po.purchaseOrderDetails.reduce(
                (sum, detail) => sum + detail.totalAmount, 0
            );
            const totalQuantity = po.purchaseOrderDetails.reduce(
                (sum, detail) => sum + detail.quantity, 0
            );

            return {
                ...po,
                totalAmount,
                totalQuantity,
                itemCount: po._count.purchaseOrderDetails
            };
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(purchaseOrdersWithTotals, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Build result with pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const result = {
            data: serialized,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };

        return result;
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw new Error(`Failed to fetch purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function getPurchaseOrdersByProduct(productId: string) {
    try {
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                purchaseOrderDetails: {
                    some: {
                        variant: {
                            productId: BigInt(productId)
                        }
                    }
                }
            },
            include: {
                supplier: {
                    select: {
                        supplierId: true,
                        name: true,
                        supplierCode: true,
                    }
                },
                purchaseOrderDetails: {
                    where: {
                        variant: {
                            productId: BigInt(productId)
                        }
                    },
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        productId: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(purchaseOrders, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return serialized;
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        throw new Error(`Failed to fetch purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updatePurchaseOrderStatus(purchaseOrderId: string, status: string, importStatus?: string) {
    try {
        const updatedPurchaseOrder = await prisma.purchaseOrder.update({
            where: { purchaseOrderId: BigInt(purchaseOrderId) },
            data: {
                status,
                ...(importStatus && { importStatus }),
                ...(status === 'COMPLETED' && { importDate: new Date() }),
            },
            include: {
                supplier: true,
                purchaseOrderDetails: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                                inventory: true,
                            }
                        }
                    }
                }
            }
        });

        // Nếu status là COMPLETED và importStatus là IMPORTED, cập nhật inventory
        if (status === 'COMPLETED' && importStatus === 'IMPORTED') {
            await prisma.$transaction(async (tx) => {
                for (const detail of updatedPurchaseOrder.purchaseOrderDetails) {
                    if (detail.variant.inventory) {
                        await tx.inventory.update({
                            where: { inventoryId: detail.variant.inventory.inventoryId },
                            data: {
                                currentStock: {
                                    increment: detail.quantity
                                },
                                updatedAt: new Date(),
                            },
                        });
                    } else {
                        // Tạo inventory nếu chưa có
                        await tx.inventory.create({
                            data: {
                                variantId: detail.variantId,
                                initialStock: detail.quantity,
                                currentStock: detail.quantity,
                                minStock: 0,
                                maxStock: 0,
                            },
                        });
                    }
                }
            });
        }

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(updatedPurchaseOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
            message: 'Đơn nhập hàng đã được cập nhật thành công'
        };
    } catch (error) {
        console.error('Error updating purchase order:', error);
        return {
            success: false,
            message: `Failed to update purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function getPurchaseOrderById(id: string) {
    try {
        const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: { purchaseOrderId: BigInt(id) },
            include: {
                supplier: {
                    select: {
                        supplierId: true,
                        name: true,
                        supplierCode: true,
                        email: true,
                        phone: true,
                        address: true,
                    }
                },
                purchaseOrderDetails: {
                    include: {
                        variant: {
                            include: {
                                product: {
                                    select: {
                                        productId: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!purchaseOrder) {
            throw new Error('Purchase order not found');
        }

        // Serialize BigInt
        const serialized = JSON.parse(JSON.stringify(purchaseOrder, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serialized,
        };

    } catch (error) {
        console.error('Error fetching purchase order:', error);
        throw new Error(`Failed to fetch purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}