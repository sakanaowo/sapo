"use server"

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';
import { InvoiceData } from '@/lib/type/printer.type';
import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';


// Define interfaces for the output structure
interface VariantForDisplay {
    variantId: string;
    variantName: string;
    unit: string;
    price: number;
    barcode?: string;
    SKU: string;
    image?: string;
}

interface ProductForDisplay {
    productId: string;
    name: string;
    image?: string;
    variants: VariantForDisplay[];
}

/**
 * Fetches all products with their variants, including name, image, unit, price, barcode, and SKU.
 * Results are cached for 24 hours to optimize performance.
 * @returns Promise<ProductForDisplay[]> - Array of products with their variant details
 */
export async function getProductsForDisplay(): Promise<ProductForDisplay[]> {
    const cacheKey = `products-for-display`;

    try {
        // Check if data is available in cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // Fetch products with their variants from the database
        const products = await prisma.product.findMany({
            include: {
                variants: true
            }
        });

        // Transform the data into the required format
        const productsForDisplay: ProductForDisplay[] = products
            .filter(product => product.variants.length > 0) // Ensure products have at least one variant
            .map(product => ({
                productId: product.productId.toString(),
                name: product.name,
                image: product.variants[0]?.imageUrl || undefined, // Use the first variant's image for the product
                variants: product.variants.map(variant => ({
                    variantId: variant.variantId.toString(),
                    variantName: variant.variantName,
                    unit: variant.unit,
                    price: variant.retailPrice,
                    barcode: variant.barcode ?? undefined,
                    SKU: variant.sku,
                    image: variant.imageUrl ?? undefined
                }))
            }));

        // Cache the result for 24 hours (3600 seconds * 24)
        await redis.setEx(cacheKey, 3600 * 24, JSON.stringify(productsForDisplay));

        return productsForDisplay;
    } catch (error) {
        console.error("Error fetching products for display:", error);
        throw error;
    }
}

const formatInvoiceData = (data: InvoiceData): string => {
    const { logo, storeName, address, phoneNumber, products, totalAmount, additionalMessages } = data;

    let invoice = "";
    invoice += `Logo: ${logo}\n\n`;
    invoice += `${storeName}\n`;
    invoice += `${address}\n`;
    invoice += `Phone: ${phoneNumber}\n\n`;
    invoice += "Products:\n";
    products.forEach(product => {
        invoice += `${product.name} (SKU: ${product.SKU}) - ${product.quantity} x ${product.price.toLocaleString('vi-VN')}₫ = ${product.amount.toLocaleString('vi-VN')}₫\n`;
    });
    invoice += `\nTotal: ${totalAmount.toLocaleString('vi-VN')}₫\n`;
    if (additionalMessages) {
        invoice += `\n${additionalMessages}\n`;
    }
    return invoice;
};

export async function printInvoice(invoiceData: InvoiceData) {
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON, // Hoặc STAR tùy máy in
        interface: 'usb',
        characterSet: CharacterSet.TCVN_VIETNAMESE, // Hỗ trợ UTF-8 cho tiếng Việt
        removeSpecialCharacters: false,
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        throw new Error('Máy in không được kết nối');
    }

    printer.alignCenter();
    printer.bold(true);
    printer.setTextDoubleHeight();
    printer.println(invoiceData.storeName);
    printer.println(invoiceData.address);
    printer.println(`Phone: ${invoiceData.phoneNumber}`);
    printer.newLine();

    printer.alignLeft();
    printer.println('Products:');
    printer.drawLine();

    invoiceData.products.forEach(product => {
        printer.tableCustom([
            { text: `${product.name} (SKU: ${product.SKU})`, align: 'LEFT', width: 0.5 },
            { text: `${product.quantity} x ${product.price.toLocaleString('vi-VN')}₫`, align: 'RIGHT', width: 0.3 },
            { text: `${product.amount.toLocaleString('vi-VN')}₫`, align: 'RIGHT', width: 0.2 },
        ]);
    });

    printer.drawLine();
    printer.alignRight();
    printer.println(`Total: ${invoiceData.totalAmount.toLocaleString('vi-VN')}₫`);
    printer.newLine();

    if (invoiceData.additionalMessages) {
        printer.alignCenter();
        printer.println(invoiceData.additionalMessages);
    }

    printer.cut();
    await printer.execute();
    printer.clear();

    console.log("Printing invoice:\n", formatInvoiceData(invoiceData));
    return { success: true, message: 'Đã gửi lệnh in hóa đơn' };
}