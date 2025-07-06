import fs from 'fs';
import XLSX from 'xlsx';

// Đọc file Excel
const workbook = XLSX.readFile('danh_sach_san_pham_06.07.2025_f6b462561d0688588322dae96843d4fd.xlsx');
const sheet = workbook.Sheets['Xuất file sản phẩm'];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Chuyển đổi dữ liệu thành JSON
const headers = data[0];
const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
        obj[header] = row[index] || null;
    });
    return obj;
});

// Ghi dữ liệu JSON ra file
const jsonFileName = 'products.json';
fs.writeFileSync(jsonFileName, JSON.stringify(rows, null, 2));

// Ghi log ra file TXT
const logMessage = `--- LOG CHUYỂN ĐỔI DỮ LIỆU ---\n` +
    `Tổng số dòng: ${rows.length}\n` +
    `Headers: ${headers.join(', ')}\n` +
    `JSON đã được ghi vào file: ${jsonFileName}\n` +
    `Thời gian: ${new Date().toLocaleString()}\n\n`;

fs.appendFileSync('log.txt', logMessage);  // Dùng append để không ghi đè

console.log('✅ Dữ liệu đã được chuyển thành JSON:', rows.length, 'dòng');
console.log('📄 Log đã được ghi vào log.txt');
