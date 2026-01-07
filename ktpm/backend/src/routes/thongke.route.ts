import { Elysia } from "elysia";
import { getThongKeTheoKhoanThu, getThongKeTongQuan, getRecentPayments } from "@/services/thongke.service";
import { authMiddleware } from "@/middleware/auth.middleware";

export const thongKeRoutes = new Elysia({ prefix: "/thongke" })
  .use(authMiddleware)

  // 1. Dashboard Stats
  .get("/dashboard", async ({ query }) => {
    const year = query.year ? parseInt(query.year as string) : undefined;
    const stats = await getThongKeTongQuan(year);
    return { status: "success", data: stats };
  }, {
    detail: { tags: ["ThongKe"], summary: "Lấy số liệu tổng quan Dashboard" }
  })

  // 2. Recent Payments
  .get("/recent-payments", async () => {
    const payments = await getRecentPayments();
    return { status: "success", data: payments };
  }, {
    detail: { tags: ["ThongKe"], summary: "Lấy hoạt động thu phí gần đây" }
  })

  // 3. Chi tiết khoản thu
  .get("/:id", async ({ params: { id }, set }) => {
    try {
      const data = await getThongKeTheoKhoanThu(id);
      return { status: "success", data };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    detail: { tags: ["ThongKe"], summary: "Thống kê chi tiết theo khoản thu" }
  });