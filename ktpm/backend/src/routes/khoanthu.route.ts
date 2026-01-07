import { Elysia, t } from "elysia";
import {
  createKhoanThu,
  deleteKhoanThu,
  getAllKhoanThu,
  getLichSuNopTien,
  ghiNhanNopTien,
  khoanThuDto,
  nopTienDto,
  updateKhoanThu,
} from "@/services/khoanthu.service";
import { authMiddleware, adminMiddleware } from "@/middleware/auth.middleware";

export const khoanThuRoutes = new Elysia({ prefix: "/khoanthu" })
  .use(authMiddleware)
  .use(adminMiddleware)

  // --- KHOẢN THU ---

  // 1. Lấy danh sách khoản thu
  .get("/", async () => {
    const list = await getAllKhoanThu();
    return { status: "success", data: list };
  }, { detail: { tags: ["KhoanThu"], summary: "Lấy danh sách khoản thu" } })

  // 2. Tạo khoản thu mới
  .post("/", async ({ body, set }) => {
    try {
      const newItem = await createKhoanThu(body);
      return { status: "success", data: newItem };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    isAdmin: true,
    body: khoanThuDto,
    detail: { tags: ["KhoanThu"], summary: "Tạo khoản thu mới (Admin)" }
  })

  // 3. Cập nhật khoản thu
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
      const updated = await updateKhoanThu(id, body);
      return { status: "success", data: updated };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    isAdmin: true,
    body: t.Partial(khoanThuDto),
    detail: { tags: ["KhoanThu"], summary: "Sửa khoản thu (Admin)" }
  })

  // 4. Xóa khoản thu
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteKhoanThu(id);
      return { status: "success", message: "Đã xóa khoản thu" };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    isAdmin: true,
    detail: { tags: ["KhoanThu"], summary: "Xóa khoản thu (Admin)" }
  })

  // --- NỘP TIỀN ---

  // 5. Ghi nhận nộp tiền
  .post("/nop-tien", async ({ body, set }) => {
    try {
      const result = await ghiNhanNopTien(body);
      return { status: "success", data: result, message: "Ghi nhận nộp tiền thành công" };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: nopTienDto,
    detail: { tags: ["NopTien"], summary: "Ghi nhận hộ dân nộp tiền" }
  })

  // 6. Xem lịch sử nộp tiền (có thể lọc theo query params)
  .get("/lich-su-nop-tien", async ({ query }) => {
    const filter: any = {};
    if (query.hoKhauId) filter.hoKhauId = query.hoKhauId;
    if (query.khoanThuId) filter.khoanThuId = query.khoanThuId;

    const list = await getLichSuNopTien(filter);
    return { status: "success", data: list };
  }, {
    query: t.Object({
      hoKhauId: t.Optional(t.String()),
      khoanThuId: t.Optional(t.String()),
    }),
    detail: { tags: ["NopTien"], summary: "Xem lịch sử nộp tiền" }
  })

  // --- SỬ DỤNG ĐIỆN/NƯỚC ---

  // 7. Nhập số điện/nước cho 1 hộ
  .post("/chi-tiet-su-dung", async ({ body, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => m.nhapChiTietSuDung(body));
      return { status: "success", data: result };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: t.Object({
      hoKhauId: t.String(),
      khoanThuId: t.String(),
      chiSoCu: t.Optional(t.Number()),
      chiSoMoi: t.Number(),
    }),
    detail: { tags: ["SuDung"], summary: "Nhập số điện/nước cho 1 hộ" }
  })

  // 8. Lấy danh sách chi tiết sử dụng theo khoản thu
  .get("/chi-tiet-su-dung/:khoanThuId", async ({ params: { khoanThuId } }) => {
    const list = await import("@/services/khoanthu.service").then(m => m.getChiTietSuDung(khoanThuId));
    return { status: "success", data: list };
  }, {
    detail: { tags: ["SuDung"], summary: "Xem chi tiết sử dụng theo khoản thu" }
  })

  // 9. Import hàng loạt từ Excel
  .post("/import-su-dung/:khoanThuId", async ({ params: { khoanThuId }, body, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.importChiTietSuDung(khoanThuId, body)
      );
      return { status: "success", data: result };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: t.Array(t.Object({
      soCanHo: t.String(),
      chiSoCu: t.Optional(t.Number()),
      chiSoMoi: t.Number(),
    })),
    detail: { tags: ["SuDung"], summary: "Import hàng loạt số điện/nước" }
  })

  // 10. Tính tổng tiền phải thu cho 1 hộ
  .get("/tinh-tien/:hoKhauId", async ({ params: { hoKhauId }, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.tinhTongTienPhaiThu(hoKhauId)
      );
      return { status: "success", data: result };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    detail: { tags: ["SuDung"], summary: "Tính tổng tiền phải thu cho 1 hộ" }
  })

  // 11. Lấy chi tiết sử dụng điện/nước theo khoản thu
  .get("/:id/usage", async ({ params: { id }, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.getUsageByKhoanThu(id)
      );
      return { status: "success", data: result };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    detail: { tags: ["Usage"], summary: "Lấy chi tiết sử dụng theo khoản thu" }
  })

  // 12. Nhập hàng loạt chỉ số điện/nước (hỗ trợ cả nhập trực tiếp số tiền)
  .post("/:id/bulk-usage", async ({ params: { id }, body, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.saveBulkUsage(id, body)
      );
      return { status: "success", data: result, message: "Lưu thành công" };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: t.Object({
      usageData: t.Array(t.Object({
        soCanHo: t.Optional(t.String()), // Dùng số căn hộ thay vì hoKhauId
        hoKhauId: t.Optional(t.String()), // Backward compatible
        chiSoCu: t.Optional(t.Union([t.Number(), t.Null()])),
        chiSoMoi: t.Optional(t.Union([t.Number(), t.Null()])),
        directAmount: t.Optional(t.Union([t.Number(), t.Null()])) // Nhập trực tiếp số tiền
      }))
    }),
    detail: { tags: ["Usage"], summary: "Nhập hàng loạt chỉ số điện/nước hoặc số tiền trực tiếp" }
  })

  // 13. Export template Excel cho nhập liệu (kèm số cũ từ kỳ trước)
  .get("/:id/export-template", async ({ params: { id }, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.getExportTemplate(id)
      );
      return { status: "success", data: result };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    detail: { tags: ["Usage"], summary: "Lấy template để export Excel nhập liệu" }
  })

  // 14. Import từ Excel/CSV (parse và lưu)
  .post("/:id/import-usage", async ({ params: { id }, body, set }) => {
    try {
      const result = await import("@/services/khoanthu.service").then(m => 
        m.importChiTietSuDung(id, body)
      );
      return { status: "success", data: result, message: `Import thành công ${result.success} hộ` };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: t.Array(t.Object({
      soCanHo: t.String(),
      chiSoCu: t.Optional(t.Number()),
      chiSoMoi: t.Number(),
    })),
    detail: { tags: ["Usage"], summary: "Import chỉ số từ Excel/CSV" }
  });