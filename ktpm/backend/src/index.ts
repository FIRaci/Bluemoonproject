import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { authRoutes } from "@/routes/auth.route";
import { hoKhauRoutes } from "@/routes/hokhau.route";
import { nhanKhauRoutes } from "@/routes/nhankhau.route";
import { khoanThuRoutes } from "@/routes/khoanthu.route";
import { thongKeRoutes } from "@/routes/thongke.route";
import { residentRoutes } from "@/routes/resident.route";
import { exportRoute } from "@/routes/export.route";

// Khởi tạo ứng dụng Elysia
const app = new Elysia()
  .use(cors())
  .onRequest(({ request }) => {
    console.log(`📥 ${request.method} ${new URL(request.url).pathname}`);
  })
  .onError(({ error, code }) => {
    console.error(`❌ Error [${code}]:`, error.message);
    return {
      status: "error",
      message: error.message || "Internal server error"
    };
  })
  .use(
    swagger({
      documentation: {
        info: {
          title: "BlueMoon Apartment Management API",
          version: "1.0.0",
          description: "API backend cho phần mềm quản lý chung cư",
        },
        tags: [
          { name: "Auth", description: "Các endpoints về xác thực" },
          { name: "HoKhau", description: "Quản lý Hộ Khẩu" },
          { name: "NhanKhau", description: "Quản lý Nhân Khẩu" },
          { name: "KhoanThu", description: "Quản lý Khoản Thu" },
          { name: "NopTien", description: "Quản lý Nộp Tiền" },
          { name: "ThongKe", description: "Báo cáo thống kê" },
          { name: "Resident", description: "API cho Cư dân" },
        ],
      },
    })
  )
  .get("/", () => {
    return {
      status: "success",
      message: "Xin chào! Backend BlueMoon đang chạy ngon lành.",
      timestamp: new Date(),
    };
  })
  
  // 2. Gắn các route
  .use(authRoutes)
  .use(hoKhauRoutes)
  .use(nhanKhauRoutes)
  .use(khoanThuRoutes)
  .use(thongKeRoutes)
  .use(residentRoutes) // API cho Cư dân
  .use(exportRoute) // API xuất Excel

  .listen(3000);

console.log(
  `🦊 Elysia BlueMoon API đang chạy tại http://localhost:3000`
);

export type App = typeof app;