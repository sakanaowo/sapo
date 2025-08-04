import { PrismaClient } from '@prisma/client';
import 'dotenv/config'; // Ensure dotenv is loaded to use environment variables
import fs from 'fs';
const prisma = new PrismaClient();

// Read data JSON with error handling
let data;
try {
    data = JSON.parse(fs.readFileSync('./products.json', 'utf8'));
} catch (error) {
    console.error('Error reading products.json:', error.message);
    console.error('Ensure products.json exists in F:\\code\\VSCode\\sapo\\prisma');
    process.exit(1);
}

// Check for duplicate SKUs
const skus = data.map(row => row['Mã SKU*']);
const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index);
if (duplicates.length > 0) {
    console.error('Duplicate SKUs in products.json:', duplicates);
    throw new Error('Data contains duplicate SKUs. Please fix before importing.');
}

// Infer product name from variant name
function inferProductName(variantName) {
    return variantName.replace(/ - (lốc|thùng|bịch|hộp|vỉ|cây|bao)$/i, '').trim();
}

// Group products
function groupProducts(data) {
    const productsMap = new Map();
    data.forEach(row => {
        let productName = row['Tên sản phẩm*'] || inferProductName(row['Tên phiên bản sản phẩm']);
        if (!productName) {
            console.warn(`Skipping row missing product and variant name: ${JSON.stringify(row)}`);
            return;
        }

        if (!productsMap.has(productName)) {
            productsMap.set(productName, {
                name: productName,
                productType: row['Hình thức quản lý sản phẩm'] || 'NORMAL',
                variants: [],
            });
        }
        productsMap.get(productName).variants.push(row);
    });
    return Array.from(productsMap.values());
}

// Infer conversion rate
function inferConversionRate(variants) {
    const conversions = [];
    variants.forEach((variant, i) => {
        for (let j = i + 1; j < variants.length; j++) {
            const v1 = variant;
            const v2 = variants[j];
            if (v1['PL_Giá bán lẻ'] && v2['PL_Giá bán lẻ'] && v1['PL_Giá bán lẻ'] < v2['PL_Giá bán lẻ']) {
                const rate = v2['PL_Giá bán lẻ'] / v1['PL_Giá bán lẻ'];
                if (Number.isInteger(rate)) {
                    conversions.push({
                        fromVariant: v1['Mã SKU*'],
                        toVariant: v2['Mã SKU*'],
                        rate,
                    });
                }
            }
        }
    });
    return conversions;
}

async function importData() {
    try {
        console.log('Starting data deletion...');
        await prisma.$transaction([
            prisma.unitConversion.deleteMany(),
            prisma.warranty.deleteMany(),
            prisma.inventory.deleteMany(),
            prisma.productVariant.deleteMany(),
            prisma.product.deleteMany(),
        ]);
        console.log('Deleted all data from tables.');

        console.log('Starting data import...');
        console.log('Number of records:', data.length);
        const products = groupProducts(data);
        console.log('Number of product groups:', products.length);

        // Batch processing for products
        const batchSize = 100;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            await prisma.$transaction(
                batch.map(product =>
                    prisma.product.create({
                        data: {
                            name: product.name,
                            productType: product.productType,
                            description: null,
                            brand: null,
                            tags: null,
                        },
                    })
                )
            );
        }

        // Process variants, inventory, warranty, and conversions
        for (const product of products) {
            const existingProduct = await prisma.product.findFirst({
                where: { name: product.name },
            });
            if (!existingProduct) {
                console.error(`Product not found after creation: ${product.name}`);
                continue;
            }
            console.log(`Processing product: ${existingProduct.name} (ID: ${existingProduct.productId})`);

            for (const variant of product.variants) {
                if (!variant['Mã SKU*'] || !variant['Tên phiên bản sản phẩm']) {
                    console.warn(`Skipping row missing SKU or variant name: ${JSON.stringify(variant)}`);
                    continue;
                }

                const createdVariant = await prisma.productVariant.create({
                    data: {
                        productId: existingProduct.productId,
                        sku: variant['Mã SKU*'],
                        barcode: variant['Barcode'],
                        variantName: variant['Tên phiên bản sản phẩm'],
                        weight: parseFloat(variant['Khối lượng'] || 0),
                        weightUnit: variant['Đơn vị khối lượng'] || 'g',
                        unit: variant['Đơn vị'] || 'unit',
                        imageUrl: variant['Ảnh đại diện'],
                        retailPrice: parseFloat(variant['PL_Giá bán lẻ'] || 0),
                        wholesalePrice: parseFloat(variant['PL_Giá bán buôn'] || 0),
                        importPrice: parseFloat(variant['PL_Giá nhập'] || 0),
                        taxApplied: variant['Giá áp dụng thuế'] === 'Giá bao gồm thuế',
                        inputTax: parseFloat(variant['Thuế đầu vào (%)'] || 0),
                        outputTax: parseFloat(variant['Thuế đầu ra (%)'] || 0),
                    },
                });
                console.log(`Created variant: ${createdVariant.variantName} (SKU: ${createdVariant.sku})`);

                await prisma.inventory.create({
                    data: {
                        variantId: createdVariant.variantId,
                        initialStock: parseFloat(variant['LC_CN1_Tồn kho ban đầu*'] || 0),
                        currentStock: parseFloat(variant['LC_CN1_Tồn kho ban đầu*'] || 0),
                        minStock: parseFloat(variant['LC_CN1_Tồn tối thiểu'] || 0),
                        maxStock: parseFloat(variant['LC_CN1_Tồn tối đa'] || 0),
                        warehouseLocation: variant['LC_CN1_Điểm lưu kho'],
                    },
                });
                console.log(`Created inventory for SKU: ${variant['Mã SKU*']}`);

                await prisma.warranty.create({
                    data: {
                        variantId: createdVariant.variantId,
                        expirationWarningDays: parseInt(variant['Số ngày cảnh báo hết hạn'] || 0),
                        warrantyPolicy: variant['Chính sách bảo hành'],
                    },
                });
                console.log(`Created warranty for SKU: ${variant['Mã SKU*']}`);
            }

            const conversions = inferConversionRate(product.variants);
            for (const conv of conversions) {
                const fromVariant = await prisma.productVariant.findUnique({ where: { sku: conv.fromVariant } });
                const toVariant = await prisma.productVariant.findUnique({ where: { sku: conv.toVariant } });
                if (fromVariant && toVariant) {
                    await prisma.unitConversion.create({
                        data: {
                            fromVariantId: fromVariant.variantId,
                            toVariantId: toVariant.variantId,
                            conversionRate: conv.rate,
                        },
                    });
                    console.log(`Created unit conversion from ${conv.fromVariant} to ${conv.toVariant}`);
                }
            }
        }

        console.log('Data import successful!');
    } catch (error) {
        console.error('Error importing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importData();