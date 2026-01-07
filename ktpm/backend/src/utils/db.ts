import { PrismaClient } from "@prisma/client";

// Khai báo một biến global để lưu trữ Prisma Client
// Điều này giúp tránh tạo quá nhiều kết nối CSDL khi hot-reload trong môi trường dev
declare global {
  var prisma: PrismaClient | undefined;
}

// Khởi tạo db:
// 1. Nếu đang ở môi trường production, tạo 1 instance mới.
// 2. Nếu đang ở dev, kiểm tra xem globalThis.prisma đã có chưa, nếu chưa thì tạo mới.
export const db = globalThis.prisma || new PrismaClient();

// Chỉ gán vào globalThis khi không ở production
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// Prisma Client initialized