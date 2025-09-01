
# Flow v2 (2-phase, an toàn & idempotent)

1. **Upload ➜ Tạo Job (client)**

* Client upload file (xlsx/csv) lên object storage → nhận `storageKey`, `size`, `mime`, `originalName`.
* Client gọi `POST /api/imports` tạo `ImportJob` với trạng thái `UPLOADED` (chỉ metadata, **chưa** đọc nội dung).

2. **Yêu cầu validate (client ➜ server)**

* Client gọi `POST /api/imports/:jobId/validate`.
* Server chuyển job sang `VALIDATING`, đẩy vào hàng đợi validate (job async), trả ngay `{jobId}` cho client.

3. **Validate (worker)**

* Worker đọc **lại** file từ storage (không tin client-parse), tính `sha256` và cập nhật vào job.
* Kiểm tra: header bắt buộc, kiểu dữ liệu, quy tắc nghiệp vụ (SKU/Barcode unique, giá ≥ 0, …), trùng trong file, trùng với DB (tuỳ chế độ), map category/supplier…
* Ghi `ImportError` theo từng dòng (row, column, code, message, hint) và (tuỳ chọn) ghi bảng staging để preview.
* Kết thúc: cập nhật `VALIDATED_OK` (không lỗi nghiêm trọng) hoặc `VALIDATED_ERR` (có lỗi).

4. **Hiển thị kết quả validate (client)**

* Client poll/SSE `GET /api/imports/:jobId/status` hiển thị: tổng dòng, số OK/Lỗi, 20 lỗi gần nhất + nút “Tải file lỗi (.csv)”.
* Nếu `VALIDATED_ERR` → dừng tại đây (user sửa file rồi upload job mới).
* Nếu `VALIDATED_OK` → cho phép bật nút **Bulk import**.

5. **Chọn tuỳ chọn import (client)**

* Người dùng chọn **chế độ ghi**: `insert_only` / `update_if_exists` / `skip_duplicates`, map cột→field nếu cần.
* Client gọi `POST /api/imports/:jobId/commit` truyền `options`, `mapping`.
* Server đặt `IMPORTING`, đẩy job vào hàng đợi import.

6. **Import (worker)**

* Worker xác nhận `sha256` không đổi (đúng file đã validate).
* Chia chunk (vd. 500–1,000 dòng/transaction), `createMany`/`upsert` theo `options`, cập nhật counters & tiến độ.
* Xong: `IMPORTED_OK` kèm summary (nInserted, nUpdated, nSkipped) hoặc `IMPORTED_ERR` nếu có lỗi hệ thống.

7. **Theo dõi tiến trình (client)**

* Poll/SSE status trong lúc import để thấy % tiến độ, counters.
* Hoàn tất: hiển thị summary + nút “Xuất log lỗi” (nếu có).

8. **Idempotency & điều khiển**

* Mỗi job có `jobId` + `file.sha256`. Commit lại cùng job **không** nhân bản (idempotent).
* Có `POST /api/imports/:jobId/cancel` để huỷ khi đang `VALIDATING/IMPORTING`.

---

## Trạng thái `ImportJob`

`UPLOADED` → `VALIDATING` → (`VALIDATED_OK` | `VALIDATED_ERR`) → (`IMPORTING` → `IMPORTED_OK` | `IMPORTED_ERR`)
(Ngoại lệ: `FAILED`, `CANCELED`)

## API tối thiểu

* `POST /api/imports` → `{ jobId }`  (input: `{type, storageKey, originalName, mime, size}`)
* `POST /api/imports/:jobId/validate` → 202 Accepted
* `GET  /api/imports/:jobId/status` → `{ status, progress, summary, recentErrors[] }`
* `GET  /api/imports/:jobId/errors?format=csv` → tải log lỗi
* `POST /api/imports/:jobId/commit` (input: `{ options, mapping }`) → 202
* `POST /api/imports/:jobId/cancel` → 200

## Log lỗi & preview

* Lỗi ở mức **dòng** (rowNumber) + **cột** (nếu xác định được) + `code`, `message`, `hint`, `rawRow`.
* (Tuỳ chọn) Lưu bảng staging để: preview 50 dòng đầu, đánh dấu duplicate-in-file, duplicate-in-DB.

## Bảo toàn dữ liệu & idempotency

* So khớp `sha256` giữa validate & import để đảm bảo “đúng cùng một file”.
* `jobId` + `sha256` là khóa logic: cùng file, cùng lựa chọn → commit lại vẫn cho ra cùng kết quả (không nhân bản).
* Import theo chunk + transaction để tránh lock dài trên Neon.

## Bảo mật & phân quyền

* Job gắn `uploadedByUserId`/`tenantId`.
* Storage dùng signed URL ngắn hạn.
* Rate limit theo user + job để chống double-click.

