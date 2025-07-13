"use server"

import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

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

export const printInvoice = async (invoiceData: {
    storeName: string;
    address: string;
    phoneNumber: string;
    products: { name: string; quantity: number; price: number }[];
    totalAmount: number;
    additionalMessage?: string;
}) => {
    const { storeName, address, phoneNumber, products, totalAmount, additionalMessage } = invoiceData;

    // Format invoice content for thermal printer
    let invoiceContent = `
${storeName}
${address}
${phoneNumber}
--------------------------
`;

    products.forEach(product => {
        invoiceContent += `${product.name} x ${product.quantity} - ${product.price.toLocaleString('vi-VN')}₫\n`;
    });

    invoiceContent += `--------------------------\n`;
    invoiceContent += `Total: ${totalAmount.toLocaleString('vi-VN')}₫\n`;
    invoiceContent += `Thời gian: ${new Date().toLocaleString('vi-VN')}\n`;

    if (additionalMessage) {
        invoiceContent += `${additionalMessage}\n`;
    }

    invoiceContent += `--------------------------\n`;
    invoiceContent += `Cảm ơn quý khách!\n`;

    // For now, we'll use browser print API
    // In production, this would integrate with thermal printer SDK
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Hóa đơn</title>
                    <style>
                        body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px; 
                            width: 58mm; 
                            margin: 0; 
                            padding: 10px;
                        }
                        .center { text-align: center; }
                        .bold { font-weight: bold; }
                        .line { border-top: 1px dashed #000; margin: 5px 0; }
                        pre { margin: 0; white-space: pre-wrap; }
                    </style>
                </head>
                <body>
                    <pre class="center bold">${storeName}</pre>
                    <pre class="center">${address}</pre>
                    <pre class="center">${phoneNumber}</pre>
                    <div class="line"></div>
                    ${products.map(product =>
            `<pre>${product.name} x ${product.quantity}</pre><pre style="text-align: right;">${product.price.toLocaleString('vi-VN')}₫</pre>`
        ).join('')}
                    <div class="line"></div>
                    <pre class="bold">Tổng cộng: ${totalAmount.toLocaleString('vi-VN')}₫</pre>
                    <pre>Thời gian: ${new Date().toLocaleString('vi-VN')}</pre>
                    ${additionalMessage ? `<pre>${additionalMessage}</pre>` : ''}
                    <div class="line"></div>
                    <pre class="center">Cảm ơn quý khách!</pre>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    return invoiceContent;
};