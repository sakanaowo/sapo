

import { InvoiceData } from '@/lib/type/printer.type';

export const formatInvoiceData = (data: InvoiceData): string => {
    const { logo, storeName, address, phoneNumber, products, totalAmount, additionalMessages } = data;

    let invoice = "";

    // Add logo
    invoice += `Logo: ${logo}\n\n`;

    // Store details
    invoice += `${storeName}\n`;
    invoice += `${address}\n`;
    invoice += `Phone: ${phoneNumber}\n\n`;

    // Product details
    invoice += "Products:\n";
    products.forEach(product => {
        invoice += `${product.name} (SKU: ${product.SKU}) - ${product.quantity} x ${product.price.toLocaleString('vi-VN')}₫ = ${product.amount.toLocaleString('vi-VN')}₫\n`;
    });

    // Total amount
    invoice += `\nTotal: ${totalAmount.toLocaleString('vi-VN')}₫\n`;

    // Additional messages
    if (additionalMessages) {
        invoice += `\n${additionalMessages}\n`;
    }

    return invoice;
};

export const printInvoice = (invoiceData: InvoiceData) => {
    const formattedData = formatInvoiceData(invoiceData);
    // Here you would integrate with the thermal printer API to send the formatted data for printing
    console.log("Printing invoice:\n", formattedData);
};