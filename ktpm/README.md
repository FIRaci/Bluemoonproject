# 🌙 BlueMoon — Hệ Thống Quản Lý Chung Cư

> Phần mềm quản lý chung cư dành cho Ban Quản Trị và Cư Dân  
> **Tác giả:** FIRaci

---

## 📋 Mục Lục

- [Tổng quan](#-tổng-quan)
- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Biến môi trường](#-biến-môi-trường)
- [API Endpoints](#-api-endpoints)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)

---

## 🏢 Tổng quan

BlueMoon là ứng dụng desktop quản lý chung cư gồm 2 phần:

| Phần | Mô tả |
|------|-------|
| **Backend** | REST API chạy trên Bun + Elysia + PostgreSQL |
| **Frontend** | Ứng dụng desktop Electron |

**2 vai trò người dùng:**
- 👮 **Admin (BQT)** — Quản lý toàn bộ hệ thống
- 🏠 **Cư Dân** — Xem thông tin hộ, đóng tiền online

---

## ✨ Tính năng

### Dành cho Admin
- ✅ Quản lý **Hộ Khẩu** (thêm/sửa/xóa, tìm kiếm)
- ✅ Quản lý **Nhân Khẩu** trong từng hộ
- ✅ Quản lý **Khoản Thu** (phí cố định, phí điện/nước)
- ✅ Ghi nhận **Nộp Tiền**, xem lịch sử thanh toán
- ✅ Nhập chỉ số điện/nước hàng loạt (import Excel)
- ✅ **Dashboard thống kê** — biểu đồ thu phí theo tháng/năm
- ✅ **Xuất báo cáo** Excel
- ✅ Reset mật khẩu cư dân qua CCCD

### Dành cho Cư Dân
- ✅ Xem thông tin hộ khẩu, danh sách nhân khẩu
- ✅ Xem các khoản phí cần đóng + số tiền thực tế
- ✅ Tạo **QR Code VietQR** để thanh toán
- ✅ Xem lịch sử đã đóng tiền
- ✅ Đổi mật khẩu

---

## 🛠 Công nghệ sử dụng

### Backend
| Công nghệ | Mục đích |
|-----------|----------|
| [Bun](https://bun.sh) | Runtime + package manager |
| [Elysia](https://elysiajs.com) | Web framework |
| [Prisma](https://prisma.io) | ORM |
| [PostgreSQL](https://postgresql.org) | Database |
| JWT | Xác thực |
| bcrypt/argon2 | Hash mật khẩu |
| ExcelJS | Xuất file Excel |

### Frontend
| Công nghệ | Mục đích |
|-----------|----------|
| [Electron](https://electronjs.org) | Desktop app framework |
| Tailwind CSS | Styling |
| Vanilla JS | Logic UI |

### DevOps
| Công nghệ | Mục đích |
|-----------|----------|
| Docker + Docker Compose | Container hóa |
| GitHub Actions | CI/CD |

---

## 📁 Cấu trúc dự án

```
ktpm/
├── backend/                  # API server
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── routes/           # Định nghĩa API routes
│   │   │   ├── auth.route.ts
│   │   │   ├── hokhau.route.ts
│   │   │   ├── nhankhau.route.ts
│   │   │   ├── khoanthu.route.ts
│   │   │   ├── thongke.route.ts
│   │   │   ├── resident.route.ts
│   │   │   └── export.route.ts
│   │   ├── services/         # Business logic
│   │   │   ├── auth.service.ts
│   │   │   ├── hokhau.service.ts
│   │   │   ├── nhankhau.service.ts
│   │   │   ├── khoanthu.service.ts
│   │   │   └── thongke.service.ts
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts  # JWT auth + phân quyền
│   │   └── utils/
│   │       └── db.ts         # Prisma client
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Electron app
│   ├── main.js               # Electron main process
│   ├── dashboard.html/js     # Trang tổng quan Admin
│   ├── hokhau.html/js        # Quản lý hộ khẩu
│   ├── nhankhau.html/js      # Quản lý nhân khẩu
│   ├── khoanthu.html/js      # Quản lý khoản thu
│   ├── thongke.html/js       # Thống kê báo cáo
│   ├── resident.html/js      # Portal cư dân
│   └── package.json
│
├── docker-compose.yml        # Chạy toàn bộ hệ thống
├── RUN.bat                   # Script chạy nhanh (Windows)
└── run.ps1                   # Script chạy PowerShell
```

---

## 🚀 Cài đặt & Chạy

### Cách 1: Docker (Khuyến nghị)

> Yêu cầu: [Docker Desktop](https://docker.com/products/docker-desktop)

```bash
# Clone repo
git clone https://github.com/FIRaci/Bluemoonproject.git
cd Bluemoonproject/ktpm

# Tạo file .env cho backend
cp backend/.env.example backend/.env
# Chỉnh sửa JWT_SECRET và các biến môi trường trong .env

# Khởi chạy Database + Backend
docker-compose up -d

# Backend sẽ chạy tại: http://localhost:3000
# Swagger docs tại:    http://localhost:3000/swagger
```

### Cách 2: Chạy thủ công

**Yêu cầu:**
- [Bun](https://bun.sh) >= 1.0
- [PostgreSQL](https://postgresql.org) >= 14
- [Node.js](https://nodejs.org) >= 18

**Bước 1 — Backend:**
```bash
cd backend

# Cài dependencies
bun install

# Tạo file .env
# DATABASE_URL="postgresql://user:password@localhost:5432/bluemoon_db"
# JWT_SECRET="your-secret-key-here"

# Chạy migration database
bun run db:migrate

# Seed dữ liệu mẫu (tuỳ chọn)
bun run db:seed

# Khởi động server
bun run dev
# → http://localhost:3000
```

**Bước 2 — Frontend:**
```bash
cd frontend

# Cài dependencies
npm install

# Chạy ứng dụng Electron
npm start
```

### Cách 3: Script tự động (Windows)

```bat
# Chạy file RUN.bat hoặc
.\run.ps1
```

---

## 🔐 Biến môi trường

Tạo file `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://bluemoon:bluemoon2025@localhost:5433/bluemoon_db?schema=public"

# JWT - BẮT BUỘC phải đặt, không để trống
JWT_SECRET="your-very-secure-secret-key-minimum-32-chars"

# QR thanh toán VietQR (tuỳ chọn)
BANK_ACCOUNT="so-tai-khoan-bql"
BANK_CODE="MB"
```

> ⚠️ **Lưu ý:** `JWT_SECRET` là bắt buộc. Server sẽ **không khởi động** nếu thiếu biến này.

---

## 📡 API Endpoints

Truy cập Swagger UI tại: **`http://localhost:3000/swagger`**

| Module | Prefix | Mô tả |
|--------|--------|-------|
| Auth | `/auth` | Đăng nhập, đăng ký, đổi mật khẩu |
| Hộ Khẩu | `/hokhau` | CRUD hộ khẩu |
| Nhân Khẩu | `/nhankhau` | CRUD nhân khẩu |
| Khoản Thu | `/khoanthu` | CRUD khoản thu, ghi nhận nộp tiền |
| Thống Kê | `/thongke` | Dashboard, báo cáo |
| Cư Dân | `/resident` | API cho cư dân |
| Xuất file | `/export` | Xuất Excel |

**Xác thực:** Tất cả API (trừ `/auth/login`, `/auth/register`) yêu cầu header:
```
Authorization: Bearer <jwt_token>
```

---

## 👤 Tài khoản mặc định

Sau khi chạy `bun run db:seed`:

| Vai trò | Username | Password |
|---------|----------|----------|
| Admin | `admin` | `admin123` |
| Cư dân mẫu | `BM-A1201` | `resident123` |

> ⚠️ Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

---

## 📊 Database Schema

```
User ──────── HoKhau ──── NhanKhau
                │
                ├── LichSuNopTien ── KhoanThu
                └── ChiTietSuDung ── KhoanThu
```

**Các enum quan trọng:**
- `Role`: `ADMIN` | `RESIDENT`
- `LoaiPhi`: `BAT_BUOC` | `TU_NGUYEN`
- `PhanLoaiPhi`: `CO_DINH` | `THEO_MUC_SU_DUNG`
- `HangCanHo`: `BINH_THUONG` | `TRUNG_CAP` | `CAO_CAP` | `PENTHOUSE`

---

## 🐛 Troubleshooting

**Lỗi "JWT_SECRET not set"**
→ Kiểm tra file `.env` đã có `JWT_SECRET` chưa

**Lỗi kết nối database**
→ Kiểm tra PostgreSQL đang chạy và `DATABASE_URL` đúng

**Frontend không kết nối được backend**
→ Đảm bảo backend đang chạy tại `http://localhost:3000`  
→ Kiểm tra file `frontend/config.js` có đúng API URL không

**Electron không mở được**
→ Chạy `npm install` lại trong thư mục `frontend/`

---

## 📝 License

MIT © 2025 FIRaci
