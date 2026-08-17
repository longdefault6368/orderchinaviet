# OrderChinaViet Extension (Manifest V3) — Professional Procurement Tool v2.0

Tiện ích mở rộng chính thức của **OrderChinaViet Logistics Platform**, hỗ trợ tự động bóc tách thông tin sản phẩm, quy đổi giá tiền Nhân Dân Tệ (CNY) sang Việt Nam Đồng (VND), lưu giỏ hàng và gửi yêu cầu mua hộ trực tiếp về hệ thống.

---

## 🌟 Tính Năng Nổi Bật

1. **Floating Panel Xuyên Suốt Trên Trang Thương Mại Điện Tử**:
   - Khi người dùng truy cập bất kỳ trang sản phẩm nào thuộc các nền tảng **1688, Taobao, Tmall, Pinduoduo (Yangkeduo), Alibaba, AliExpress**, một bảng điều khiển thương hiệu **OrderChinaViet** tự động hiển thị bên mép phải màn hình.
   - Bảng điều khiển này hoạt động xuyên suốt, có thể thu gọn (minimize) thành icon tab hoặc mở rộng linh hoạt.

2. **Tự Động Nhận Diện Thông Tin Sản Phẩm**:
   - Tự bóc tách tên sản phẩm, giá niêm yết Nhân Dân Tệ (¥).
   - Quy đổi ngay lập tức sang VNĐ theo tỷ giá thực tế (1 ¥ = 3.650 ₫).
   - Tùy chỉnh số lượng, ghi chú màu sắc / size / lưu ý đặc biệt.

3. **Thêm Sản Phẩm Qua Đường Link (Paste Link)**:
   - Dán link sản phẩm từ bất kỳ nền tảng nào được hỗ trợ trực tiếp từ Popup hoặc Floating Panel.
   - Hệ thống tự động phân loại nền tảng và đưa vào giỏ hàng mua hộ.

4. **Quản Lý Giỏ Hàng Mua Hộ Ngay Tại Extension**:
   - Lưu trữ giỏ hàng trong bộ nhớ cục bộ (`chrome.storage`).
   - Hiển thị tổng số lượng sản phẩm, tổng tiền CNY (¥) và tổng tiền VNĐ (₫).
   - Cho phép xóa từng sản phẩm hoặc làm sạch toàn bộ giỏ hàng.

5. **1-Click Chuyển Đơn Về Hệ Thống OrderChinaViet**:
   - Bấm nút **"Gửi Đơn Mua Hộ Về OrderChinaViet"** để tự động mở trang Tạo Đơn Mua Hộ trên `http://localhost:3000/vi/orders` với toàn bộ danh sách sản phẩm trong giỏ.

---

## 🛍️ Các Nền Tảng Được Hỗ Trợ

- **1688.com** (Bán buôn, xưởng sản xuất Trung Quốc)
- **Taobao.com** (Bán lẻ nội địa Trung Quốc)
- **Tmall.com** (Thương hiệu chính hãng Trung Quốc)
- **Pinduoduo / Yangkeduo.com** (Mua chung, hàng xưởng giá rẻ)
- **Alibaba.com** (Bán buôn quốc tế)
- **AliExpress.com** (Bán lẻ quốc tế)

---

## 📦 Hướng Dẫn Cài Đặt Vào Trình Duyệt Chrome / Cốc Cốc / Edge

1. Mở trình duyệt Chrome hoặc Cốc Cốc, truy cập đường dẫn: `chrome://extensions` (hoặc `coccoc://extensions`).
2. Bật chế độ **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải.
3. Giải nén file `orderchinaviet-extension.zip` hoặc trỏ trực tiếp tới thư mục:
   `C:\Work\VANCHUYEN\frontend\public\extension`
4. Bấm nút **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục `extension`.
5. Extension **OrderChinaViet** sẽ xuất hiện trên thanh công cụ trình duyệt với logo chính thức!

---

© 2026 **OrderChinaViet Logistics Management Platform**. All rights reserved.
