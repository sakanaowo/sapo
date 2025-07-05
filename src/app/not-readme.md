```lua
app/
├── dashboard/
│   └── page.tsx              # Route: /dashboard (Tổng quan)
├── orders/
│   ├── create/
│   │   └── page.tsx          # Route: /orders/create (Tạo đơn)
│   ├── [id]/
│   │   └── page.tsx          # Route: /orders/:id (Chi tiết đơn hàng, dynamic route)
│   └── page.tsx              # Route: /orders (Danh sách đơn hàng)
├── products/
│   ├── inventory/
│   │   └── page.tsx          # Route: /products/inventory (Quản lý kho)
│   ├── purchase-orders/
│   │   └── page.tsx          # Route: /products/purchase-orders (Đặt hàng nhập)
│   ├── receive/
│   │   └── page.tsx          # Route: /products/receive (Nhập hàng)
│   ├── inspect/
│   │   └── page.tsx          # Route: /products/inspect (Kiểm hàng)
│   ├── transfer/
│   │   └── page.tsx          # Route: /products/transfer (Chuyển hàng)
│   ├── suppliers/
│   │   └── page.tsx          # Route: /products/suppliers (Nhà cung cấp)
│   ├── cost-adjustments/
│   │   └── page.tsx          # Route: /products/cost-adjustments (Điều chỉnh giá vốn)
│   ├── [id]/
│   │   └── page.tsx          # Route: /products/:id (Chi tiết sản phẩm, dynamic route)
│   └── page.tsx              # Route: /products (Danh sách sản phẩm)
├── customers/
│   ├── groups/
│   │   └── page.tsx          # Route: /customers/groups (Nhóm khách hàng)
│   ├── [id]/
│   │   └── page.tsx          # Route: /customers/:id (Chi tiết khách hàng, dynamic route)
│   └── page.tsx              # Route: /customers (Danh sách khách hàng)
├── reports/
│   ├── sales/
│   │   └── page.tsx          # Route: /reports/sales (Báo cáo bán hàng)
│   ├── purchases/
│   │   └── page.tsx          # Route: /reports/purchases (Báo cáo nhập hàng)
│   ├── inventory/
│   │   └── page.tsx          # Route: /reports/inventory (Báo cáo kho)
│   ├── financial/
│   │   └── page.tsx          # Route: /reports/financial (Báo cáo tài chính)
│   ├── customers/
│   │   └── page.tsx          # Route: /reports/customers (Báo cáo khách hàng)
│   └── page.tsx              # Route: /reports (Tổng quan báo cáo, optional landing page)
├── pos/
│   └── page.tsx              # Route: /pos (POS)
├── settings/
│   └── page.tsx              # Route: /settings (Cấu hình)
├── layout.tsx                # Root layout with SidebarProvider and AppSidebar
└── page.tsx                  # Root route: / (Optional, could redirect to /dashboard)
```
