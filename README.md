# OrderChinaViet Logistics

## Chạy trực tiếp không dùng Docker

Backend:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npx prisma generate
npx prisma db push
$env:SEED_PASSWORD='mat-khau-khoi-tao-an-toan'
npm run prisma:seed
npm run build
npm start
```

Frontend, trong terminal khác:

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run build
npm start
```

Database thật được lưu tại `backend/prisma/dev.db`. Sao lưu file này khi cả backend và các tác vụ ghi dữ liệu đã dừng.

Tạo bản sao lưu SQLite nhất quán khi hệ thống vẫn đang chạy:

```powershell
cd backend
npm run db:backup
```

Các bản sao nằm trong `backend/backups`; hệ thống tự giữ 14 bản mới nhất.

Hệ thống quản lý khách hàng, kiện hàng, chuyến Trung–Việt, giao dịch ví, khiếu nại, rút tiền, CMS và affiliate.

## Chạy bằng Docker

1. Sao chép `.env.example` thành `.env`, thay hai JWT secret và `SEED_PASSWORD` bằng giá trị mạnh.
2. Chạy `docker compose up --build -d`.
3. Mở `http://localhost:3000`; health API tại `http://localhost:5000/health`.

Database nằm trong Docker volume `logistics_data`. Cần sao lưu volume này định kỳ.

## Chạy phát triển

Backend:

```powershell
cd backend
Copy-Item .env.example .env
npm ci
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run dev
```

Frontend (terminal khác):

```powershell
cd frontend
Copy-Item .env.example .env.local
npm ci
npm run dev
```

## Kiểm tra trước khi phát hành

```powershell
cd backend
npm run build
npm test
cd ../frontend
npm run build
```

Không đưa `.env`, database, token, khóa PayOS/PayPal hoặc thông tin ngân hàng bí mật vào source control. Mọi API quản trị phải dùng JWT có đúng vai trò.
