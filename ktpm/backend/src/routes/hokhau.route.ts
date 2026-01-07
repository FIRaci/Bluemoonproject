import { Elysia, t } from "elysia";
import {
  createHoKhau,
  deleteHoKhau,
  getAllHoKhau,
  getHoKhauById,
  hoKhauDto,
  updateHoKhau,
  addChuHoToNhanKhau,
} from "@/services/hokhau.service";
import { authMiddleware, adminMiddleware } from "@/middleware/auth.middleware";

export const hoKhauRoutes = new Elysia({ prefix: "/hokhau" })
  .use(authMiddleware)
  .use(adminMiddleware)

  // 2. GET /hokhau - Lấy danh sách
  .get("/", async ({ query }) => {
    const skip = query.skip ? parseInt(query.skip as string) : 0;
    const take = query.take ? parseInt(query.take as string) : 100;
    const search = query.search as string | undefined;
    
    const result = await getAllHoKhau({ skip, take, search });
    return { status: "success", ...result };
  }, {
    detail: { tags: ["HoKhau"], summary: "Lấy danh sách hộ khẩu" }
  })

  // 3. GET /hokhau/detail/:id - Lấy một hộ khẩu theo ID
  .get("/detail/:id", async ({ params: { id }, set }) => {
    try {
      const hokhau = await getHoKhauById(id);
      if (!hokhau) {
        set.status = 404;
        return { status: "error", message: "Không tìm thấy hộ khẩu" };
      }
      return { status: "success", data: hokhau };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    detail: { tags: ["HoKhau"], summary: "Lấy thông tin một hộ khẩu" }
  })

  // 4. POST /hokhau - Thêm mới
  .post("/", async ({ body, set }) => {
    try {
      const newHoKhau = await createHoKhau(body);
      return { status: "success", data: newHoKhau };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    isAdmin: true,
    body: hoKhauDto,
    detail: { tags: ["HoKhau"], summary: "Tạo hộ khẩu mới (Admin)" }
  })

  // 5. PUT /hokhau/:id - Cập nhật
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
        const updated = await updateHoKhau(id, body);
      return { status: "success", data: updated };
    } catch (e: any) {
      console.error('Update error:', e);
      set.status = 400;
      return { status: "error", message: e.message || "Không tìm thấy hộ khẩu hoặc lỗi dữ liệu" };
    }
  }, {
    isAdmin: true,
    body: t.Partial(hoKhauDto), // Cho phép gửi lên một phần dữ liệu để sửa
    detail: { tags: ["HoKhau"], summary: "Cập nhật thông tin hộ khẩu (Admin)" }
  })

  // 6. POST /hokhau/:id/add-chu-ho - Thêm chủ hộ vào nhân khẩu
  .post("/:id/add-chu-ho", async ({ params: { id }, body, set }) => {
    try {
      const nhanKhau = await addChuHoToNhanKhau(id, body);
      return { status: "success", data: nhanKhau };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    body: t.Object({
      cccd: t.String({ minLength: 9, maxLength: 12, error: "CCCD/CMND phải từ 9-12 chữ số" }),
      ngaySinh: t.String(),
      email: t.Optional(t.String()),
      gioiTinh: t.Union([t.Literal('Nam'), t.Literal('Nữ'), t.Literal('Khác')])
    }),
    detail: { tags: ["HoKhau"], summary: "Thêm chủ hộ vào nhân khẩu" }
  })

  // 7. DELETE /hokhau/:id - Xóa
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteHoKhau(id);
      return { status: "success", message: "Đã xóa hộ khẩu" };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message || "Không thể xóa (có thể do ràng buộc dữ liệu)" };
    }
  }, {
    isAdmin: true,
    detail: { tags: ["HoKhau"], summary: "Xóa hộ khẩu (Admin)" }
  });