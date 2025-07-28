import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import fs from 'fs';
const prisma = new PrismaClient();

// Read data JSON with error handling
let data;
try {
    data = JSON.parse(fs.readFileSync('./products.json', 'utf8'));
} catch (error) {
    console.error('Error reading products.json:', error.message);
    console.error('Ensure products.json exists in the same directory.');
    process.exit(1);
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

async function importNewData() {
    try {
        console.log('Starting incremental data import...');
        console.log('Number of records to process:', data.length);

        const products = groupProducts(data);
        console.log('Number of product groups:', products.length);

        let newProductsCount = 0;
        let newVariantsCount = 0;
        let skippedVariantsCount = 0;
        let updatedInventoryCount = 0;

        for (const product of products) {
            // Check if product exists
            let existingProduct = await prisma.product.findFirst({
                where: { name: product.name },
            });

            // Create product if it doesn't exist
            if (!existingProduct) {
                existingProduct = await prisma.product.create({
                    data: {
                        name: product.name,
                        productType: product.productType,
                        description: null,
                        brand: null,
                        tags: null,
                    },
                });
                newProductsCount++;
                console.log(`Created new product: ${existingProduct.name} (ID: ${existingProduct.productId})`);
            } else {
                console.log(`Processing existing product: ${existingProduct.name} (ID: ${existingProduct.productId})`);
            }

            // Process variants
            for (const variant of product.variants) {
                if (!variant['Mã SKU*'] || !variant['Tên phiên bản sản phẩm']) {
                    console.warn(`Skipping row missing SKU or variant name: ${JSON.stringify(variant)}`);
                    continue;
                }

                // Check if variant already exists
                const existingVariant = await prisma.productVariant.findUnique({
                    where: { sku: variant['Mã SKU*'] },
                });

                if (existingVariant) {
                    console.log(`Variant with SKU ${variant['Mã SKU*']} already exists - skipping`);
                    skippedVariantsCount++;

                    // Optionally update inventory if needed
                    const newStock = parseFloat(variant['LC_CN1_Tồn kho ban đầu*'] || 0);
                    if (newStock > 0) {
                        await prisma.inventory.updateMany({
                            where: { variantId: existingVariant.variantId },
                            data: {
                                currentStock: {
                                    increment: newStock
                                }
                            }
                        });
                        updatedInventoryCount++;
                        console.log(`Updated inventory for SKU ${variant['Mã SKU*']} - added ${newStock} units`);
                    }
                    continue;
                }

                // Create new variant
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
                newVariantsCount++;
                console.log(`Created new variant: ${createdVariant.variantName} (SKU: ${createdVariant.sku})`);

                // Create inventory
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

                // Create warranty
                await prisma.warranty.create({
                    data: {
                        variantId: createdVariant.variantId,
                        expirationWarningDays: parseInt(variant['Số ngày cảnh báo hết hạn'] || 0),
                        warrantyPolicy: variant['Chính sách bảo hành'],
                    },
                });
            }

            // Process unit conversions for new variants only
            const newVariants = [];
            for (const variant of product.variants) {
                const existingVariant = await prisma.productVariant.findUnique({
                    where: { sku: variant['Mã SKU*'] },
                });
                if (existingVariant) {
                    newVariants.push(variant);
                }
            }

            if (newVariants.length > 1) {
                const conversions = inferConversionRate(newVariants);
                for (const conv of conversions) {
                    // Check if conversion already exists
                    const fromVariant = await prisma.productVariant.findUnique({ where: { sku: conv.fromVariant } });
                    const toVariant = await prisma.productVariant.findUnique({ where: { sku: conv.toVariant } });

                    if (fromVariant && toVariant) {
                        const existingConversion = await prisma.unitConversion.findFirst({
                            where: {
                                fromVariantId: fromVariant.variantId,
                                toVariantId: toVariant.variantId,
                            }
                        });

                        if (!existingConversion) {
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
            }
        }

        console.log('\n=== Import Summary ===');
        console.log(`New products created: ${newProductsCount}`);
        console.log(`New variants created: ${newVariantsCount}`);
        console.log(`Skipped existing variants: ${skippedVariantsCount}`);
        console.log(`Updated inventory records: ${updatedInventoryCount}`);
        console.log('Incremental data import completed successfully!');

    } catch (error) {
        console.error('Error importing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importNewData();