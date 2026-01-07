import { Elysia, t } from "elysia";
import {
  createNhanKhau,
  deleteNhanKhau,
  getAllNhanKhau,
  nhanKhauDto,
  updateNhanKhau,
} from "@/services/nhankhau.service";
import { authMiddleware, adminMiddleware } from "@/middleware/auth.middleware";

export const nhanKhauRoutes = new Elysia({ prefix: "/nhankhau" })
  .use(authMiddleware)
  .use(adminMiddleware)

  // 2. GET /nhankhau - Lấy danh sách
  .get("/", async () => {
    const list = await getAllNhanKhau();
    return { status: "success", data: list };
  }, {
    detail: { tags: ["NhanKhau"], summary: "Lấy danh sách nhân khẩu" }
  })

  // 3. POST /nhankhau - Thêm mới
  .post("/", async ({ body, set }) => {
    try {
      const newNhanKhau = await createNhanKhau(body);
      return { status: "success", data: newNhanKhau };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: e.message };
    }
  }, {
    isAdmin: true,
    body: nhanKhauDto,
    detail: { tags: ["NhanKhau"], summary: "Thêm nhân khẩu vào hộ (Admin)" }
  })

  // 4. PUT /nhankhau/:id - Sửa
  .put("/:id", async ({ params: { id }, body, set }) => {
    try {
      const updated = await updateNhanKhau(id, body);
      return { status: "success", data: updated };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: "Lỗi khi cập nhật nhân khẩu" };
    }
  }, {
    isAdmin: true,
    body: t.Partial(nhanKhauDto),
    detail: { tags: ["NhanKhau"], summary: "Cập nhật nhân khẩu (Admin)" }
  })

  // 5. DELETE /nhankhau/:id - Xóa
  .delete("/:id", async ({ params: { id }, set }) => {
    try {
      await deleteNhanKhau(id);
      return { status: "success", message: "Đã xóa nhân khẩu" };
    } catch (e: any) {
      set.status = 400;
      return { status: "error", message: "Không thể xóa nhân khẩu" };
    }
  }, {
    isAdmin: true,
    detail: { tags: ["NhanKhau"], summary: "Xóa nhân khẩu (Admin)" }
  });