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
    const normalizedSearch = search.trim().toLowerCase();
    const cacheKey = `purchaseOrders-page-${page}-limit-${limit}-status-${status}-supplierId-${supplierId}-search-${normalizedSearch ? normalizedSearch : ''}-dateFrom-${dateFrom}-dateTo-${dateTo}`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

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

        await redis.setEx(cacheKey, 3600, JSON.stringify(result));

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
    const cacheKey = `purchaseOrder-${id}`;
    try {
        const cached = await redis.get(cacheKey);
        if (cached) {
            return {
                success: true,
                data: JSON.parse(cached),
            };
        }

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

        await redis.setEx(cacheKey, 3600, JSON.stringify(serialized));

        return {
            success: true,
            data: serialized,
        };

    } catch (error) {
        console.error('Error fetching purchase order:', error);
        throw new Error(`Failed to fetch purchase order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export async function updateMultiplePurchaseOrdersStatus(
    purchaseOrderIds: string[],
    status: string,
    importStatus?: string
) {
    try {
        if (!purchaseOrderIds || purchaseOrderIds.length === 0) {
            throw new Error('Danh sách Purchase Order ID không được rỗng');
        }

        // Validate status values
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
        const validImportStatuses = ['PENDING', 'IMPORTED'];

        if (!validStatuses.includes(status)) {
            throw new Error(`Trạng thái không hợp lệ: ${status}`);
        }

        if (importStatus && !validImportStatuses.includes(importStatus)) {
            throw new Error(`Trạng thái nhập hàng không hợp lệ: ${importStatus}`);
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra tất cả Purchase Orders có tồn tại không
            const existingPOs = await tx.purchaseOrder.findMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                select: {
                    purchaseOrderId: true,
                    purchaseOrderCode: true,
                    status: true,
                    importStatus: true
                }
            });

            if (existingPOs.length !== purchaseOrderIds.length) {
                const foundIds = existingPOs.map(po => po.purchaseOrderId.toString());
                const missingIds = purchaseOrderIds.filter(id => !foundIds.includes(id));
                throw new Error(`Không tìm thấy Purchase Orders với ID: ${missingIds.join(', ')}`);
            }

            // Kiểm tra logic nghiệp vụ
            for (const po of existingPOs) {
                // Không thể cập nhật PO đã hoàn thành
                if (po.status === 'COMPLETED' && status !== 'COMPLETED') {
                    throw new Error(`Purchase Order ${po.purchaseOrderCode} đã hoàn thành, không thể thay đổi trạng thái`);
                }

                // Không thể set import status = IMPORTED nếu status không phải COMPLETED
                if (importStatus === 'IMPORTED' && status !== 'COMPLETED') {
                    throw new Error(`Không thể set trạng thái nhập hàng thành công cho Purchase Order chưa hoàn thành: ${po.purchaseOrderCode}`);
                }
            }

            // Chuẩn bị data để update
            const updateData: Partial<{
                status: string;
                importStatus: string;
                importDate: Date;
                updatedAt: Date;
            }> = {
                status,
                updatedAt: new Date()
            };

            if (importStatus) {
                updateData.importStatus = importStatus;
            }

            if (status === 'COMPLETED') {
                updateData.importDate = new Date();
            }

            // Thực hiện update
            const updatedPOs = await tx.purchaseOrder.updateMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                data: updateData
            });

            // Nếu cập nhật thành COMPLETED + IMPORTED, cần cập nhật inventory
            if (status === 'COMPLETED' && importStatus === 'IMPORTED') {
                for (const poId of purchaseOrderIds) {
                    const purchaseOrder = await tx.purchaseOrder.findUnique({
                        where: { purchaseOrderId: BigInt(poId) },
                        include: {
                            purchaseOrderDetails: {
                                include: {
                                    variant: {
                                        include: {
                                            inventory: true
                                        }
                                    }
                                }
                            }
                        }
                    });

                    if (purchaseOrder) {
                        // Cập nhật inventory cho từng variant
                        for (const detail of purchaseOrder.purchaseOrderDetails) {
                            const currentInventory = detail.variant.inventory;

                            if (currentInventory) {
                                await tx.inventory.update({
                                    where: { inventoryId: currentInventory.inventoryId },
                                    data: {
                                        currentStock: currentInventory.currentStock + detail.quantity,
                                        updatedAt: new Date()
                                    }
                                });
                            } else {
                                // Tạo inventory mới nếu chưa có
                                await tx.inventory.create({
                                    data: {
                                        variantId: detail.variantId,
                                        initialStock: detail.quantity,
                                        currentStock: detail.quantity,
                                        minStock: 0,
                                        maxStock: 999999
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // Lấy thông tin chi tiết các PO đã update
            const finalPOs = await tx.purchaseOrder.findMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                include: {
                    supplier: {
                        select: {
                            supplierId: true,
                            name: true,
                            supplierCode: true
                        }
                    },
                    _count: {
                        select: {
                            purchaseOrderDetails: true
                        }
                    }
                }
            });

            return {
                updatedCount: updatedPOs.count,
                purchaseOrders: finalPOs
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
            message: `Đã cập nhật thành công ${serialized.updatedCount} Purchase Orders`
        };

    } catch (error) {
        console.error('Error updating multiple purchase orders:', error);
        return {
            success: false,
            message: `Failed to update purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function importMultiplePurchaseOrders(purchaseOrderIds: string[]) {
    try {
        if (!purchaseOrderIds || purchaseOrderIds.length === 0) {
            throw new Error('Danh sách Purchase Order ID không được rỗng');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra tất cả Purchase Orders có thể import không
            const purchaseOrders = await tx.purchaseOrder.findMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                include: {
                    supplier: true,
                    purchaseOrderDetails: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    inventory: true
                                }
                            }
                        }
                    }
                }
            });

            if (purchaseOrders.length !== purchaseOrderIds.length) {
                const foundIds = purchaseOrders.map(po => po.purchaseOrderId.toString());
                const missingIds = purchaseOrderIds.filter(id => !foundIds.includes(id));
                throw new Error(`Không tìm thấy Purchase Orders với ID: ${missingIds.join(', ')}`);
            }

            // Kiểm tra điều kiện import
            const invalidPOs = purchaseOrders.filter(po =>
                po.importStatus === 'IMPORTED' || po.status === 'CANCELLED'
            );

            if (invalidPOs.length > 0) {
                const invalidCodes = invalidPOs.map(po => po.purchaseOrderCode).join(', ');
                throw new Error(`Không thể import các Purchase Orders sau: ${invalidCodes} (đã import hoặc đã hủy)`);
            }

            // 1. Cập nhật tất cả Purchase Orders cùng lúc
            await tx.purchaseOrder.updateMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrders.map(po => po.purchaseOrderId)
                    }
                },
                data: {
                    status: 'COMPLETED',
                    importStatus: 'IMPORTED',
                    importDate: new Date()
                }
            });

            let totalImportedItems = 0;
            const inventoryUpdates = [];

            // 2. Xử lý inventory updates - batch theo variant
            const variantUpdates = new Map();

            // Tính toán tổng số lượng cần cập nhật cho mỗi variant
            for (const po of purchaseOrders) {
                for (const detail of po.purchaseOrderDetails) {
                    const variantId = detail.variantId.toString();
                    if (variantUpdates.has(variantId)) {
                        variantUpdates.set(variantId, {
                            ...variantUpdates.get(variantId),
                            quantity: variantUpdates.get(variantId).quantity + detail.quantity
                        });
                    } else {
                        variantUpdates.set(variantId, {
                            variantId: detail.variantId,
                            quantity: detail.quantity,
                            variant: detail.variant
                        });
                    }
                    totalImportedItems++;
                }
            }

            // 3. Cập nhật inventory cho từng variant
            for (const [variantId, updateData] of variantUpdates) {
                const currentInventory = updateData.variant.inventory;

                if (currentInventory) {
                    const newQuantity = currentInventory.currentStock + updateData.quantity;

                    await tx.inventory.update({
                        where: { inventoryId: currentInventory.inventoryId },
                        data: {
                            currentStock: newQuantity,
                            updatedAt: new Date()
                        }
                    });

                    inventoryUpdates.push({
                        variantId: variantId,
                        productName: updateData.variant.product.name,
                        oldQuantity: currentInventory.currentStock,
                        newQuantity: newQuantity,
                        importedQuantity: updateData.quantity
                    });
                } else {
                    // Tạo inventory mới nếu chưa có
                    await tx.inventory.create({
                        data: {
                            variantId: updateData.variantId,
                            initialStock: updateData.quantity,
                            currentStock: updateData.quantity,
                            minStock: 0,
                            maxStock: 999999
                        }
                    });

                    inventoryUpdates.push({
                        variantId: variantId,
                        productName: updateData.variant.product.name,
                        oldQuantity: 0,
                        newQuantity: updateData.quantity,
                        importedQuantity: updateData.quantity
                    });
                }
            }

            return {
                importedPOsCount: purchaseOrders.length,
                totalImportedItems,
                inventoryUpdates,
                purchaseOrderCodes: purchaseOrders.map(po => po.purchaseOrderCode)
            };
        }, {
            timeout: 30000, // 30 seconds timeout
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        return {
            success: true,
            data: result,
            message: `Đã nhập hàng thành công ${result.importedPOsCount} Purchase Orders với tổng cộng ${result.totalImportedItems} sản phẩm`
        };

    } catch (error) {
        console.error('Error importing multiple purchase orders:', error);
        return {
            success: false,
            message: `Failed to import purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function cancelMultiplePurchaseOrders(
    purchaseOrderIds: string[],
    cancelReason?: string
) {
    try {
        if (!purchaseOrderIds || purchaseOrderIds.length === 0) {
            throw new Error('Danh sách Purchase Order ID không được rỗng');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra tất cả Purchase Orders có thể hủy không
            const purchaseOrders = await tx.purchaseOrder.findMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                select: {
                    purchaseOrderId: true,
                    purchaseOrderCode: true,
                    status: true,
                    importStatus: true
                }
            });

            if (purchaseOrders.length !== purchaseOrderIds.length) {
                const foundIds = purchaseOrders.map(po => po.purchaseOrderId.toString());
                const missingIds = purchaseOrderIds.filter(id => !foundIds.includes(id));
                throw new Error(`Không tìm thấy Purchase Orders với ID: ${missingIds.join(', ')}`);
            }

            // Kiểm tra điều kiện hủy
            const invalidPOs = purchaseOrders.filter(po =>
                po.status === 'CANCELLED' ||
                po.status === 'COMPLETED' ||
                po.importStatus === 'IMPORTED'
            );

            if (invalidPOs.length > 0) {
                const invalidCodes = invalidPOs.map(po => po.purchaseOrderCode).join(', ');
                throw new Error(`Không thể hủy các Purchase Orders sau: ${invalidCodes} (đã hủy, đã hoàn thành hoặc đã nhập hàng)`);
            }

            // Cập nhật trạng thái thành CANCELLED
            const updatedPOs = await tx.purchaseOrder.updateMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                data: {
                    status: 'CANCELLED',
                    importStatus: 'PENDING', // Reset import status về PENDING
                    ...(cancelReason && { note: cancelReason })
                }
            });

            return {
                cancelledCount: updatedPOs.count,
                cancelledPOs: purchaseOrders.map(po => po.purchaseOrderCode)
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        return {
            success: true,
            data: result,
            message: `Đã hủy thành công ${result.cancelledCount} Purchase Orders`
        };

    } catch (error) {
        console.error('Error cancelling multiple purchase orders:', error);
        return {
            success: false,
            message: `Failed to cancel purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

export async function deleteMultiplePurchaseOrders(purchaseOrderIds: string[]) {
    try {
        if (!purchaseOrderIds || purchaseOrderIds.length === 0) {
            throw new Error('Danh sách Purchase Order ID không được rỗng');
        }

        const result = await prisma.$transaction(async (tx) => {
            // Kiểm tra tất cả Purchase Orders có thể xóa không
            const purchaseOrders = await tx.purchaseOrder.findMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                },
                select: {
                    purchaseOrderId: true,
                    purchaseOrderCode: true,
                    status: true,
                    importStatus: true
                }
            });

            if (purchaseOrders.length !== purchaseOrderIds.length) {
                const foundIds = purchaseOrders.map(po => po.purchaseOrderId.toString());
                const missingIds = purchaseOrderIds.filter(id => !foundIds.includes(id));
                throw new Error(`Không tìm thấy Purchase Orders với ID: ${missingIds.join(', ')}`);
            }

            // Kiểm tra điều kiện xóa - chỉ có thể xóa PO có status PENDING hoặc CANCELLED và chưa nhập hàng
            const invalidPOs = purchaseOrders.filter(po =>
                (po.status !== 'PENDING' && po.status !== 'CANCELLED') ||
                po.importStatus === 'IMPORTED'
            );

            if (invalidPOs.length > 0) {
                const invalidCodes = invalidPOs.map(po => po.purchaseOrderCode).join(', ');
                throw new Error(`Không thể xóa các Purchase Orders sau: ${invalidCodes} (chỉ có thể xóa PO đang chờ xử lý hoặc đã hủy và chưa nhập hàng)`);
            }

            // Xóa Purchase Order Details trước (do foreign key constraint)
            await tx.purchaseOrderDetail.deleteMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                }
            });

            // Xóa Purchase Orders
            const deletedPOs = await tx.purchaseOrder.deleteMany({
                where: {
                    purchaseOrderId: {
                        in: purchaseOrderIds.map(id => BigInt(id))
                    }
                }
            });

            return {
                deletedCount: deletedPOs.count,
                deletedPOs: purchaseOrders.map(po => po.purchaseOrderCode)
            };
        });

        // Invalidate cache
        try {
            await redis.flushAll();
        } catch (cacheError) {
            console.error('Error invalidating cache:', cacheError);
        }

        return {
            success: true,
            data: result,
            message: `Đã xóa thành công ${result.deletedCount} Purchase Orders`
        };

    } catch (error) {
        console.error('Error deleting multiple purchase orders:', error);
        return {
            success: false,
            message: `Failed to delete purchase orders: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}