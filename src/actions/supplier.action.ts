"use server"

import prisma from "@/lib/prisma";
import redis from "@/lib/redis";
import { Supplier } from "@/lib/type/supplier.type";

export interface SupplierSelectOption {
    supplierId: string;
    supplierCode: string;
    name: string;
    email?: string;
    phone?: string;
    status?: string;
}

// Get all suppliers for select dropdown
export async function getAllSuppliers(): Promise<SupplierSelectOption[]> {
    const cacheKey = 'suppliers-all-select';

    try {
        // Check cache first (1 hour TTL)
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log('Suppliers loaded from cache');
            return JSON.parse(cached);
        }

        // Fetch from database
        const suppliers = await prisma.supplier.findMany({
            select: {
                supplierId: true,
                supplierCode: true,
                name: true,
                email: true,
                phone: true,
                status: true,
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Convert BigInt to string for JSON serialization
        const serializedSuppliers: SupplierSelectOption[] = suppliers.map(supplier => ({
            supplierId: supplier.supplierId.toString(),
            supplierCode: supplier.supplierCode,
            name: supplier.name,
            email: supplier.email || "",
            phone: supplier.phone || "",
            status: supplier.status || "",
        }));

        // const serialized = JSON.parse(JSON.stringify(suppliers, (key, value) =>
        //     typeof value === 'bigint' ? value.toString() : value
        // ));

        // Cache for 1 hour (3600 seconds)
        await redis.setEx(cacheKey, 3600, JSON.stringify(serializedSuppliers));

        console.log('Suppliers loaded from database and cached');
        return serializedSuppliers;
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error('Không thể tải danh sách nhà cung cấp');
    }
}

// Email validation helper
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Phone validation helper  
function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
}

export async function createSupplier(data: Supplier) {
    try {
        // Validation required fields
        if (!data.name?.trim()) {
            throw new Error("Tên nhà cung cấp không được để trống");
        }
        if (!data.supplierCode?.trim()) {
            throw new Error("Mã nhà cung cấp không được để trống");
        }

        // Validation optional fields with format
        if (data.email && data.email.trim() && !isValidEmail(data.email.trim())) {
            throw new Error("Định dạng email không hợp lệ");
        }
        if (data.phone && data.phone.trim() && !isValidPhone(data.phone.trim())) {
            throw new Error("Định dạng số điện thoại không hợp lệ");
        }

        // Check supplier code uniqueness
        const existingSupplier = await prisma.supplier.findUnique({
            where: { supplierCode: data.supplierCode.trim() },
        });

        if (existingSupplier) {
            throw new Error(`Mã nhà cung cấp "${data.supplierCode}" đã tồn tại`);
        }

        // Create new supplier
        const newSupplier = await prisma.supplier.create({
            data: {
                name: data.name.trim(),
                supplierCode: data.supplierCode.trim(),
                email: data.email?.trim() || null,
                phone: data.phone?.trim() || null,
                address: data.address?.trim() || null,
                taxCode: data.taxCode?.trim() || null,
                website: data.website?.trim() || null,
                status: data.status || "ACTIVE", // Standardized status
            },
        });

        // Clear cache after creating new supplier
        try {
            await redis.del('suppliers-all-select');
            console.log('Supplier cache cleared after creation');
        } catch (cacheError) {
            console.error('Error clearing supplier cache:', cacheError);
        }

        // Serialize BigInt for JSON response
        const serializedSupplier = JSON.parse(JSON.stringify(newSupplier, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serializedSupplier,
            message: "Nhà cung cấp đã được tạo thành công"
        };

    } catch (error) {
        console.error('Error creating supplier:', error);

        // Re-throw validation errors as-is
        if (error instanceof Error && (
            error.message.includes("không được để trống") ||
            error.message.includes("không hợp lệ") ||
            error.message.includes("đã tồn tại")
        )) {
            throw error;
        }

        // Generic error for unexpected issues
        throw new Error(`Không thể tạo nhà cung cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
}

export async function getSuppliers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status
        } = params || {};

        // Build where clause
        const whereClause: {
            status?: string;
            OR?: Array<{
                name?: { contains: string; mode: 'insensitive' };
                supplierCode?: { contains: string; mode: 'insensitive' };
                email?: { contains: string; mode: 'insensitive' };
            }>;
        } = {};

        if (status) {
            whereClause.status = status;
        }

        if (search.trim()) {
            whereClause.OR = [
                { name: { contains: search.trim(), mode: 'insensitive' as const } },
                { supplierCode: { contains: search.trim(), mode: 'insensitive' as const } },
                { email: { contains: search.trim(), mode: 'insensitive' as const } },
            ];
        }

        // Get total count
        const totalCount = await prisma.supplier.count({ where: whereClause });

        // Get suppliers
        const suppliers = await prisma.supplier.findMany({
            where: whereClause,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: {
                        purchaseOrders: true,
                    },
                },
            },
        });

        // Serialize BigInt
        const serializedSuppliers = JSON.parse(JSON.stringify(suppliers, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        // Build pagination metadata
        const totalPages = Math.ceil(totalCount / limit);

        return {
            success: true,
            data: serializedSuppliers,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };

    } catch (error) {
        console.error('Error fetching suppliers:', error);
        throw new Error(`Không thể lấy danh sách nhà cung cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
}

export async function getSupplierById(id: string) {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { supplierId: BigInt(id) },
            include: {
                purchaseOrders: {
                    select: {
                        purchaseOrderId: true,
                        purchaseOrderCode: true,
                        status: true,
                        importStatus: true,
                        createdAt: true,
                        importDate: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 10, // Latest 10 purchase orders
                },
                _count: {
                    select: {
                        purchaseOrders: true,
                    },
                },
            },
        });

        if (!supplier) {
            throw new Error('Nhà cung cấp không tồn tại');
        }

        // Serialize BigInt
        const serializedSupplier = JSON.parse(JSON.stringify(supplier, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serializedSupplier,
        };

    } catch (error) {
        console.error('Error fetching supplier:', error);
        if (error instanceof Error && error.message === 'Nhà cung cấp không tồn tại') {
            throw error;
        }
        throw new Error(`Không thể lấy thông tin nhà cung cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
    try {
        // Validation
        if (data.name !== undefined && !data.name?.trim()) {
            throw new Error("Tên nhà cung cấp không được để trống");
        }
        if (data.supplierCode !== undefined && !data.supplierCode?.trim()) {
            throw new Error("Mã nhà cung cấp không được để trống");
        }
        if (data.email && data.email.trim() && !isValidEmail(data.email.trim())) {
            throw new Error("Định dạng email không hợp lệ");
        }
        if (data.phone && data.phone.trim() && !isValidPhone(data.phone.trim())) {
            throw new Error("Định dạng số điện thoại không hợp lệ");
        }

        // Check if supplier exists
        const existingSupplier = await prisma.supplier.findUnique({
            where: { supplierId: BigInt(id) },
        });

        if (!existingSupplier) {
            throw new Error('Nhà cung cấp không tồn tại');
        }

        // Check supplier code uniqueness if changed
        if (data.supplierCode && data.supplierCode.trim() !== existingSupplier.supplierCode) {
            const duplicateSupplier = await prisma.supplier.findUnique({
                where: { supplierCode: data.supplierCode.trim() },
            });

            if (duplicateSupplier) {
                throw new Error(`Mã nhà cung cấp "${data.supplierCode}" đã tồn tại`);
            }
        }

        // Update supplier
        const updatedSupplier = await prisma.supplier.update({
            where: { supplierId: BigInt(id) },
            data: {
                ...(data.name && { name: data.name.trim() }),
                ...(data.supplierCode && { supplierCode: data.supplierCode.trim() }),
                ...(data.email !== undefined && { email: data.email?.trim() || null }),
                ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
                ...(data.address !== undefined && { address: data.address?.trim() || null }),
                ...(data.taxCode !== undefined && { taxCode: data.taxCode?.trim() || null }),
                ...(data.website !== undefined && { website: data.website?.trim() || null }),
                ...(data.status && { status: data.status }),
            },
        });

        // Serialize BigInt
        const serializedSupplier = JSON.parse(JSON.stringify(updatedSupplier, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));

        return {
            success: true,
            data: serializedSupplier,
            message: "Nhà cung cấp đã được cập nhật thành công"
        };

    } catch (error) {
        console.error('Error updating supplier:', error);

        // Re-throw validation errors as-is
        if (error instanceof Error && (
            error.message.includes("không được để trống") ||
            error.message.includes("không hợp lệ") ||
            error.message.includes("đã tồn tại") ||
            error.message.includes("không tồn tại")
        )) {
            throw error;
        }

        throw new Error(`Không thể cập nhật nhà cung cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
}

export async function deleteSupplier(id: string) {
    try {
        // Check if supplier exists
        const existingSupplier = await prisma.supplier.findUnique({
            where: { supplierId: BigInt(id) },
            include: {
                _count: {
                    select: {
                        purchaseOrders: true,
                    },
                },
            },
        });

        if (!existingSupplier) {
            throw new Error('Nhà cung cấp không tồn tại');
        }

        // Check if supplier has purchase orders
        if (existingSupplier._count.purchaseOrders > 0) {
            throw new Error('Không thể xóa nhà cung cấp đã có đơn nhập hàng. Vui lòng chuyển trạng thái thành "INACTIVE" thay vì xóa.');
        }

        // Delete supplier
        await prisma.supplier.delete({
            where: { supplierId: BigInt(id) },
        });

        return {
            success: true,
            message: "Nhà cung cấp đã được xóa thành công"
        };

    } catch (error) {
        console.error('Error deleting supplier:', error);

        // Re-throw specific errors as-is
        if (error instanceof Error && (
            error.message.includes("không tồn tại") ||
            error.message.includes("Không thể xóa")
        )) {
            throw error;
        }

        throw new Error(`Không thể xóa nhà cung cấp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
}