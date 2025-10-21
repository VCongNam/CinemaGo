# Hướng dẫn Test PayOS Backend nhanh với Postman

## 🚀 Setup nhanh (5 phút)

### 1. Import Collection và Environment
1. Mở Postman
2. Import file `CinemaGo_PayOS_Testing.postman_collection.json`
3. Import file `CinemaGo_Environment.postman_environment.json`
4. Chọn environment "CinemaGo PayOS Environment"

### 2. Cập nhật Environment Variables
- `baseUrl`: `http://localhost:5000` (hoặc URL server của bạn)

### 3. Đảm bảo backend server đang chạy
```bash
cd backend
npm run dev
```

### 4. Cấu hình file .env
Đảm bảo file `.env` có đầy đủ biến PayOS:
```env
PAYOS_CLIENT_ID=your_client_id
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
FRONTEND_URL=http://localhost:3000
```

---

## 📋 Test Flow (Thực hiện theo thứ tự)

### ✅ Bước 1: Login
- Chạy request: **Authentication > Login**
- Kiểm tra: Token được tự động lưu vào environment

### ✅ Bước 2: Tạo Booking
- Chạy request: **Booking Management > Create Booking**
- ⚠️ **Lưu ý**: Cập nhật `showtime_id` và `seat_ids` với ID thực tế từ database
- Kiểm tra: Booking ID được tự động lưu vào environment

### ✅ Bước 3: Tạo Payment Link
- Chạy request: **Payment Integration > Create Payment Link**
- Kiểm tra: 
  - Response có `paymentLink` URL
  - `paymentLinkId` và `orderCode` được tự động lưu

### ✅ Bước 4: Kiểm tra trạng thái
- Chạy request: **Payment Integration > Check Payment Status by Booking**
- Kiểm tra: Booking có `order_code` và `payment_link_id`

### ✅ Bước 5: Simulate Webhook Success
- Chạy request: **Webhook Testing > Simulate Webhook - Payment Success**
- Kiểm tra: Response status 200

### ✅ Bước 6: Verify Booking sau webhook
- Chạy lại request: **Payment Integration > Check Payment Status by Booking**
- Kiểm tra: `payment_status` = "success", `status` = "confirmed"

### ✅ Bước 7: Test Admin Functions
- Chạy request: **Booking Management > Get All Bookings (Admin)**
- Chạy request: **Booking Management > Update Booking Status (Admin)**
- Kiểm tra: Admin có quyền truy cập và cập nhật booking

---

## 🔧 Troubleshooting nhanh

### Lỗi 401 Unauthorized
- Kiểm tra token có hợp lệ không
- Chạy lại request Login

### Lỗi 404 Not Found
- Kiểm tra `bookingId` có đúng không
- Kiểm tra server có đang chạy không

### Lỗi 500 Internal Server Error
- Kiểm tra file `.env` có đầy đủ biến PayOS không:
  ```
  PAYOS_CLIENT_ID=your_client_id
  PAYOS_API_KEY=your_api_key
  PAYOS_CHECKSUM_KEY=your_checksum_key
  FRONTEND_URL=http://localhost:3000
  ```

### Webhook không hoạt động
- Kiểm tra `PAYOS_CHECKSUM_KEY` có đúng không
- Kiểm tra logs server để xem chi tiết lỗi

---

## 📊 Expected Results

### Tạo Payment Link thành công:
```json
{
  "message": "Tạo link thanh toán thành công",
  "data": {
    "paymentLink": "https://pay.payos.vn/web/...",
    "paymentLinkId": "1234567890",
    "orderCode": 123456,
    "amount": 240000
  }
}
```

### Webhook Success Response:
```json
{
  "success": true,
  "message": "Webhook received successfully"
}
```

### Booking sau webhook:
```json
{
  "booking": {
    "status": "confirmed",
    "payment_status": "success",
    "payment_method": "online",
    "order_code": 123456,
    "payment_link_id": "1234567890"
  }
}
```

---

## 🎯 Backend Test Cases quan trọng

1. ✅ **Happy Path**: Login → Create Booking → Create Payment Link → Webhook Success
2. ✅ **Error Handling**: Invalid Booking ID, Missing Parameters
3. ✅ **Webhook Scenarios**: Success, Failed, Cancelled
4. ✅ **Status Checking**: Before và sau webhook
5. ✅ **Admin Functions**: Get All Bookings, Update Booking Status
6. ✅ **Authorization**: User vs Admin permissions

---

## 💡 Backend Testing Tips

- Sử dụng **Tests** tab trong Postman để tự động lưu variables
- Kiểm tra **Console** để debug
- Test với booking ID thực tế từ database
- Backup environment variables trước khi test
- Test với cả user và admin roles
- Kiểm tra database trực tiếp để verify data
- Test webhook với cả success và failure scenarios
