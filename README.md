# CinemaGo - Nền tảng đặt vé xem phim hiện đại

CinemaGo là một dự án hệ thống đặt vé xem phim trực tuyến đầy đủ tính năng, được xây dựng với kiến trúc client-server hiện đại. Dự án bao gồm một backend mạnh mẽ sử dụng Node.js và một frontend linh hoạt (dự kiến sử dụng React), cung cấp trải nghiệm mượt mà cho cả người dùng cuối và quản trị viên.

## ✨ Tính năng nổi bật

Hệ thống được phân chia thành các vai trò rõ rệt với những chức năng chuyên biệt: Khách hàng, Nhân viên (LV1, LV2), và Quản trị viên (Admin).

### 👤 Dành cho Khách hàng (Customer)

-   **Xác thực & Tài khoản:**
    -   Đăng ký, đăng nhập tài khoản truyền thống (username/password).
    -   Đăng nhập nhanh chóng qua mạng xã hội (Google).
    -   Quản lý thông tin cá nhân (email, họ tên, SĐT, ngày sinh...).
    -   Thay đổi mật khẩu an toàn.
    -   Khôi phục mật khẩu qua hai phương thức:
        -   Mã OTP gửi về email (có giới hạn thời gian và số lần nhập sai).
        -   Link đặt lại mật khẩu bảo mật (sử dụng JWT, hết hạn sau 15 phút).
-   **Đặt vé:**
    -   Xem danh sách phim, rạp, và các suất chiếu hiện có.
    -   Chọn ghế ngồi theo sơ đồ phòng chiếu.
    -   Thực hiện quy trình đặt vé.
    -   Xem lại lịch sử các vé đã đặt.
-   **Thanh toán:**
    -   Tích hợp cổng thanh toán PayOS để tạo link thanh toán an toàn.
    -   Xử lý và cập nhật trạng thái thanh toán qua Webhook.

### ⚙️ Dành cho Nhân viên & Quản trị viên (Staff & Admin)

-   **Cổng đăng nhập riêng biệt** dành cho nhân viên và quản trị viên.
-   **Quản lý người dùng (Admin):**
    -   Tạo tài khoản nhân viên với các cấp độ (LV1, LV2).
    -   Cập nhật vai trò (role) cho nhân viên.
    -   Thay đổi trạng thái tài khoản (active, locked, suspended).
    -   Xem danh sách người dùng với bộ lọc, phân trang và sắp xếp linh hoạt.
-   **Quản lý Rạp chiếu (Theater), Phòng chiếu (Room), Suất chiếu (Showtime):**
    -   Các middleware validation chặt chẽ cho việc tạo và cập nhật thông tin.
    -   Quản lý vòng đời của rạp, phòng và các suất chiếu.
-   **Quản lý Đặt vé (Admin):**
    -   Xem toàn bộ lịch sử đặt vé của hệ thống.
    -   Xem danh sách vé đã đặt của một người dùng cụ thể.
    -   Cập nhật trạng thái đặt vé (e.g., `confirmed`, `cancelled`).
    -   Hủy vé của người dùng.

## 🚀 Công nghệ sử dụng

### Backend

-   **Nền tảng:** Node.js
-   **Framework:** Express.js
-   **Cơ sở dữ liệu:** MongoDB với Mongoose ODM
-   **Xác thực:** JSON Web Tokens (JWT)
-   **Bảo mật:** `bcryptjs` để mã hóa mật khẩu
-   **Gửi Email:** `Nodemailer` với các mẫu HTML chuyên nghiệp
-   **Thanh toán:** Tích hợp `payOS`
-   **Validation:** Middleware tùy chỉnh để xác thực dữ liệu đầu vào
-   **ES Modules:** Sử dụng cú pháp `import/export` hiện đại

### Frontend (Dựa trên các file hiện có)

-   **Thư viện:** React
-   **UI Components:** Chakra UI
-   **Routing:** React Router
-   **Giao tiếp API:** `axios` hoặc `fetch` (thông qua `authService`)

## 📦 Cài đặt & Khởi chạy

### Yêu cầu

-   Node.js (v16 trở lên)
-   npm hoặc yarn
-   MongoDB (local hoặc Atlas)

### Cài đặt Backend

1.  **Clone repository:**
    ```bash
    git clone <your-repository-url>
    cd CinemaGo/backend
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Tạo file môi trường `.env`:**
    Tạo một file `.env` ở thư mục gốc của dự án (ngang hàng với `backend` và `frontend`) và sao chép nội dung từ file `.env.example` (nếu có) hoặc điền các biến sau:

    ```env
    # Server
    PORT=8080

    # MongoDB
    MONGO_URI=mongodb://localhost:27017/cinemago

    # JWT
    JWT_SECRET=your_super_secret_jwt_key
    JWT_EXPIRES_IN=1h

    # Email (Nodemailer with Gmail)
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-gmail-app-password

    # Frontend URL
    FRONTEND_URL=http://localhost:3000

    # PayOS
    PAYOS_CLIENT_ID=your-payos-client-id
    PAYOS_API_KEY=your-payos-api-key
    PAYOS_CHECKSUM_KEY=your-payos-checksum-key

    # Social Login (Google)
    GOOGLE_CLIENT_ID=your-google-client-id
    GOOGLE_CLIENT_SECRET=your-google-client-secret
    ```
    > **Lưu ý:** `EMAIL_PASS` nên là mật khẩu ứng dụng (App Password) nếu bạn dùng Gmail và bật 2FA.

4.  **Khởi chạy server:**
    ```bash
    npm start
    # hoặc chế độ development với nodemon
    npm run dev
    ```
    Server sẽ chạy tại `http://localhost:8080`.

### Cài đặt Frontend

1.  **Điều hướng đến thư mục frontend:**
    ```bash
    cd ../frontend
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    # hoặc
    yarn install
    ```

3.  **Khởi chạy ứng dụng React:**
    ```bash
    npm start
    # hoặc
    yarn start
    ```
    Ứng dụng sẽ chạy tại `http://localhost:3000`.

## API Endpoints

(Phần này có thể được bổ sung chi tiết hơn với Swagger/Postman)

-   `POST /api/auth/register-staff`
-   `POST /api/auth/login-staff`
-   `POST /api/auth/register-customer`
-   `POST /api/auth/login-customer`
-   `GET /api/auth/google` (Chuyển hướng đến trang đăng nhập Google)
-   `GET /api/auth/google/callback` (Xử lý callback từ Google)
-   `POST /api/auth/forgot-password` (Gửi OTP)
-   `POST /api/auth/reset-password` (Đặt lại mật khẩu với OTP)
-   `POST /api/auth/forgot-password-link` (Gửi link reset)
-   `POST /api/auth/reset-password-token` (Đặt lại mật khẩu với token)
-   `GET /api/users/me`
-   `PUT /api/users/me/profile`
-   `POST /api/bookings`
-   `GET /api/bookings/my-bookings`
-   `POST /api/payments/create-payment-link`
-   ... và nhiều endpoints khác cho việc quản lý.

---
© 2025 CinemaGo.
