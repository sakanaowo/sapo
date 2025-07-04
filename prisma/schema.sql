-- Tạo cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS RetailManagement;
USE RetailManagement;
-- Bảng Product: Lưu thông tin sản phẩm
CREATE TABLE Product (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã sản phẩm, tự động tăng
    name VARCHAR(255) NOT NULL,
    -- Tên sản phẩm (ví dụ: Hạt nêm Knorr thịt thăn 400g)
    description TEXT,
    -- Mô tả sản phẩm (description: mô tả chi tiết)
    brand VARCHAR(100),
    -- Nhãn hiệu (brand: thương hiệu)
    product_type VARCHAR(50),
    -- Loại sản phẩm (product_type: phân loại sản phẩm)
    tags VARCHAR(255),
    -- Thẻ (tags: từ khóa liên quan)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    INDEX idx_product_name (name) -- Chỉ mục để tìm kiếm theo tên sản phẩm
);
-- Bảng ProductVariant: Lưu thông tin phiên bản sản phẩm
CREATE TABLE ProductVariant (
    variant_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã phiên bản, tự động tăng
    product_id INT NOT NULL,
    -- Mã sản phẩm, khóa ngoại
    sku VARCHAR(50) NOT NULL UNIQUE,
    -- Mã SKU (Stock Keeping Unit: mã định danh sản phẩm)
    barcode VARCHAR(50),
    -- Mã vạch (barcode: mã nhận diện sản phẩm)
    variant_name VARCHAR(255) NOT NULL,
    -- Tên phiên bản (ví dụ: Tú tráng nhựa - hộp)
    weight DECIMAL(10, 2) DEFAULT 0,
    -- Khối lượng (weight: trọng lượng sản phẩm)
    weight_unit VARCHAR(20) DEFAULT 'g',
    -- Đơn vị khối lượng (thường là gram)
    unit VARCHAR(50) NOT NULL,
    -- Đơn vị tính (unit: gói, chai, lốc, thùng, ...)
    image_url VARCHAR(500),
    -- URL ảnh đại diện (image_url: liên kết ảnh)
    retail_price DECIMAL(15, 2) DEFAULT 0,
    -- Giá bán lẻ (retail_price: giá bán cho khách lẻ)
    wholesale_price DECIMAL(15, 2) DEFAULT 0,
    -- Giá bán buôn (wholesale_price: giá bán số lượng lớn)
    import_price DECIMAL(15, 2) DEFAULT 0,
    -- Giá nhập (import_price: giá nhập từ nhà cung cấp)
    tax_applied BOOLEAN DEFAULT FALSE,
    -- Áp dụng thuế (tax_applied: có tính thuế hay không)
    input_tax DECIMAL(5, 2) DEFAULT 0,
    -- Thuế đầu vào (input_tax: % thuế nhập hàng)
    output_tax DECIMAL(5, 2) DEFAULT 0,
    -- Thuế đầu ra (output_tax: % thuế bán hàng)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với Product
    INDEX idx_sku (sku),
    -- Chỉ mục cho mã SKU
    INDEX idx_barcode (barcode) -- Chỉ mục cho mã vạch
);
-- Bảng Inventory: Lưu thông tin tồn kho
CREATE TABLE Inventory (
    inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã tồn kho, tự động tăng
    variant_id INT NOT NULL,
    -- Mã phiên bản, khóa ngoại
    initial_stock DECIMAL(10, 2) DEFAULT 0,
    -- Tồn kho ban đầu (initial_stock: số lượng ban đầu)
    current_stock DECIMAL(10, 2) DEFAULT 0,
    -- Tồn kho hiện tại (current_stock: số lượng hiện có)
    min_stock DECIMAL(10, 2) DEFAULT 0,
    -- Tồn kho tối thiểu (min_stock: ngưỡng tối thiểu)
    max_stock DECIMAL(10, 2) DEFAULT 0,
    -- Tồn kho tối đa (max_stock: ngưỡng tối đa)
    warehouse_location VARCHAR(100),
    -- Điểm lưu kho (warehouse_location: vị trí kho)
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Ngày cập nhật
    FOREIGN KEY (variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    CONSTRAINT positive_stock CHECK (
        initial_stock >= 0
        AND current_stock >= 0
    ),
    -- Ràng buộc tồn kho không âm
    INDEX idx_variant_id (variant_id) -- Chỉ mục cho mã phiên bản
);
-- Bảng UnitConversion: Lưu tỷ lệ quy đổi đơn vị giữa các phiên bản
CREATE TABLE UnitConversion (
    conversion_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã quy đổi, tự động tăng
    from_variant_id INT NOT NULL,
    -- Mã phiên bản nguồn, khóa ngoại
    to_variant_id INT NOT NULL,
    -- Mã phiên bản đích, khóa ngoại
    conversion_rate DECIMAL(10, 2) NOT NULL,
    -- Tỷ lệ quy đổi (conversion_rate: số lượng đơn vị nguồn tương ứng với 1 đơn vị đích)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    FOREIGN KEY (from_variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    FOREIGN KEY (to_variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    CONSTRAINT unique_conversion UNIQUE (from_variant_id, to_variant_id),
    -- Đảm bảo mỗi cặp phiên bản chỉ có 1 quy đổi
    CONSTRAINT positive_conversion CHECK (conversion_rate > 0) -- Ràng buộc tỷ lệ quy đổi phải dương
);
-- Bảng Warranty: Lưu thông tin bảo hành và cảnh báo hết hạn
CREATE TABLE Warranty (
    warranty_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã bảo hành, tự động tăng
    variant_id INT NOT NULL,
    -- Mã phiên bản, khóa ngoại
    expiration_warning_days INT DEFAULT 0,
    -- Số ngày cảnh báo hết hạn (expiration_warning_days: ngày cảnh báo trước khi hết hạn)
    warranty_policy TEXT,
    -- Chính sách bảo hành (warranty_policy: mô tả bảo hành)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    FOREIGN KEY (variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    INDEX idx_variant_id (variant_id) -- Chỉ mục cho mã phiên bản
);
-- Bảng CustomerGroup: Lưu thông tin nhóm khách hàng
CREATE TABLE CustomerGroup (
    customer_group_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã nhóm khách, tự động tăng
    group_code VARCHAR(50) NOT NULL UNIQUE,
    -- Mã nhóm (group_code: mã định danh nhóm)
    name VARCHAR(100) NOT NULL,
    -- Tên nhóm (ví dụ: vip, buôn, lẻ)
    description TEXT,
    -- Mô tả nhóm
    customer_count INT DEFAULT 0,
    -- Số lượng khách trong nhóm
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    INDEX idx_group_code (group_code) -- Chỉ mục cho mã nhóm
);
-- Bảng Customer: Lưu thông tin khách hàng
CREATE TABLE Customer (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã khách hàng, tự động tăng
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    -- Mã khách (customer_code: mã định danh khách)
    name VARCHAR(255) NOT NULL,
    -- Tên khách hàng
    phone VARCHAR(20),
    -- Số điện thoại
    email VARCHAR(100),
    -- Email
    address TEXT,
    -- Địa chỉ
    customer_group_id INT,
    -- Mã nhóm khách, khóa ngoại
    debt DECIMAL(15, 2) DEFAULT 0,
    -- Công nợ (debt: số tiền khách còn nợ)
    total_spent DECIMAL(15, 2) DEFAULT 0,
    -- Tổng chi tiêu (total_spent: tổng tiền đã mua)
    total_orders INT DEFAULT 0,
    -- Tổng số đơn (total_orders: số lượng đơn hàng)
    birth_date DATE,
    -- Ngày sinh
    gender VARCHAR(20),
    -- Giới tính
    tax_code VARCHAR(50),
    -- Mã thuế (tax_code: mã số thuế)
    description TEXT,
    -- Mô tả khách hàng
    last_purchase_date DATETIME,
    -- Ngày mua cuối (last_purchase_date: ngày đặt đơn gần nhất)
    total_items_bought DECIMAL(10, 2) DEFAULT 0,
    -- Tổng số lượng sản phẩm đã mua
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    FOREIGN KEY (customer_group_id) REFERENCES CustomerGroup(customer_group_id) ON DELETE
    SET NULL,
        -- Khóa ngoại liên kết với CustomerGroup
        INDEX idx_customer_code (customer_code) -- Chỉ mục cho mã khách
);
-- Bảng Order: Lưu thông tin đơn hàng
CREATE TABLE `Order` (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã đơn hàng, tự động tăng
    order_code VARCHAR(50) NOT NULL UNIQUE,
    -- Mã đơn hàng (order_code: mã định danh đơn)
    customer_id INT,
    -- Mã khách hàng, khóa ngoại
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    status VARCHAR(50),
    -- Trạng thái đơn (status: mới, hủy, ...)
    payment_status VARCHAR(50),
    -- Trạng thái thanh toán (payment_status: đã thanh toán, chưa thanh toán, ...)
    total_amount DECIMAL(15, 2) DEFAULT 0,
    -- Tổng tiền (total_amount: tổng giá trị đơn)
    note TEXT,
    -- Ghi chú đơn
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE
    SET NULL,
        -- Khóa ngoại liên kết với Customer
        INDEX idx_order_code (order_code) -- Chỉ mục cho mã đơn hàng
);
-- Bảng OrderDetail: Lưu chi tiết đơn hàng
CREATE TABLE OrderDetail (
    order_detail_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã chi tiết đơn, tự động tăng
    order_id INT NOT NULL,
    -- Mã đơn hàng, khóa ngoại
    variant_id INT NOT NULL,
    -- Mã phiên bản, khóa ngoại
    quantity DECIMAL(10, 2) NOT NULL,
    -- Số lượng
    unit_price DECIMAL(15, 2) NOT NULL,
    -- Đơn giá (unit_price: giá mỗi đơn vị)
    discount DECIMAL(15, 2) DEFAULT 0,
    -- Chiết khấu (discount: giảm giá)
    total_amount DECIMAL(15, 2) NOT NULL,
    -- Thành tiền (total_amount: số tiền sau chiết khấu)
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với Order
    FOREIGN KEY (variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    CONSTRAINT positive_quantity CHECK (quantity > 0) -- Ràng buộc số lượng phải dương
);
-- Bảng Supplier: Lưu thông tin nhà cung cấp
CREATE TABLE Supplier (
    supplier_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã nhà cung cấp, tự động tăng
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    -- Mã nhà cung cấp (supplier_code: mã định danh)
    name VARCHAR(255) NOT NULL,
    -- Tên nhà cung cấp
    email VARCHAR(100),
    -- Email
    phone VARCHAR(20),
    -- Số điện thoại
    address TEXT,
    -- Địa chỉ
    tax_code VARCHAR(50),
    -- Mã thuế (tax_code: mã số thuế)
    website VARCHAR(255),
    -- Website
    status VARCHAR(50),
    -- Trạng thái (status: đang giao dịch, ...)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    INDEX idx_supplier_code (supplier_code) -- Chỉ mục cho mã nhà cung cấp
);
-- Bảng PurchaseOrder: Lưu thông tin đơn đặt hàng nhập
CREATE TABLE PurchaseOrder (
    purchase_order_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã đơn nhập, tự động tăng
    purchase_order_code VARCHAR(50) NOT NULL UNIQUE,
    -- Mã đơn nhập (purchase_order_code: mã định danh)
    supplier_id INT NOT NULL,
    -- Mã nhà cung cấp, khóa ngoại
    created_by INT,
    -- Người tạo đơn (created_by: ID người dùng)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    import_date DATETIME,
    -- Ngày nhập (import_date: ngày nhập hàng)
    status VARCHAR(50),
    -- Trạng thái đơn (status: mới, hoàn thành, ...)
    import_status VARCHAR(50),
    -- Trạng thái nhập (import_status: đã nhập, đang nhập, ...)
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE RESTRICT,
    -- Khóa ngoại liên kết với Supplier
    INDEX idx_purchase_order_code (purchase_order_code) -- Chỉ mục cho mã đơn nhập
);
-- Bảng PurchaseOrderDetail: Lưu chi tiết đơn nhập
CREATE TABLE PurchaseOrderDetail (
    purchase_order_detail_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã chi tiết đơn nhập, tự động tăng
    purchase_order_id INT NOT NULL,
    -- Mã đơn nhập, khóa ngoại
    variant_id INT NOT NULL,
    -- Mã phiên bản, khóa ngoại
    quantity DECIMAL(10, 2) NOT NULL,
    -- Số lượng
    unit_price DECIMAL(15, 2) NOT NULL,
    -- Đơn giá (unit_price: giá mỗi đơn vị)
    discount DECIMAL(15, 2) DEFAULT 0,
    -- Chiết khấu (discount: giảm giá)
    total_amount DECIMAL(15, 2) NOT NULL,
    -- Thành tiền (total_amount: số tiền sau chiết khấu)
    FOREIGN KEY (purchase_order_id) REFERENCES PurchaseOrder(purchase_order_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với PurchaseOrder
    FOREIGN KEY (variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    CONSTRAINT positive_quantity CHECK (quantity > 0) -- Ràng buộc số lượng phải dương
);
-- Bảng ReportSales: Lưu báo cáo bán hàng (dùng cho báo cáo doanh thu)
CREATE TABLE ReportSales (
    report_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã báo cáo, tự động tăng
    report_date DATE NOT NULL,
    -- Ngày báo cáo
    period_type VARCHAR(20) NOT NULL,
    -- Loại kỳ (period_type: ngày, tuần, tháng, năm)
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    -- Tổng doanh thu (total_revenue: tổng tiền bán hàng)
    total_orders INT DEFAULT 0,
    -- Tổng số đơn
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    INDEX idx_report_date (report_date, period_type) -- Chỉ mục cho tìm kiếm theo ngày và kỳ
);
-- Bảng ReportInventory: Lưu báo cáo kho
CREATE TABLE ReportInventory (
    report_inventory_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã báo cáo kho, tự động tăng
    variant_id INT NOT NULL,
    -- Mã phiên bản, khóa ngoại
    report_date DATE NOT NULL,
    -- Ngày báo cáo
    unit VARCHAR(50) NOT NULL,
    -- Đơn vị tính
    product_type VARCHAR(50),
    -- Loại sản phẩm
    sku VARCHAR(50) NOT NULL,
    -- Mã SKU
    current_stock DECIMAL(10, 2) DEFAULT 0,
    -- Tồn kho hiện tại
    inventory_value DECIMAL(15, 2) DEFAULT 0,
    -- Giá trị tồn kho (inventory_value: giá trị tiền của tồn kho)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    FOREIGN KEY (variant_id) REFERENCES ProductVariant(variant_id) ON DELETE CASCADE,
    -- Khóa ngoại liên kết với ProductVariant
    INDEX idx_report_date (report_date) -- Chỉ mục cho ngày báo cáo
);
-- Bảng ReportFinance: Lưu báo cáo tài chính
CREATE TABLE ReportFinance (
    report_finance_id INT PRIMARY KEY AUTO_INCREMENT,
    -- Mã báo cáo tài chính, tự động tăng
    report_date DATE NOT NULL,
    -- Ngày báo cáo
    report_type VARCHAR(50) NOT NULL,
    -- Loại báo cáo (report_type: lãi lỗ, công nợ khách, công nợ nhà cung cấp, sổ quỹ)
    total_amount DECIMAL(15, 2) DEFAULT 0,
    -- Tổng số tiền (total_amount: giá trị báo cáo)
    details TEXT,
    -- Chi tiết báo cáo
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Ngày tạo
    INDEX idx_report_date (report_date, report_type) -- Chỉ mục cho ngày và loại báo cáo
);