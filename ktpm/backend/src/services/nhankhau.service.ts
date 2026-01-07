import { db } from "@/utils/db";
import { t } from "elysia";

// DTO cho tạo/sửa Nhân Khẩu
export const nhanKhauDto = t.Object({
  hoTen: t.String({ minLength: 1, error: "Họ tên không được để trống" }),
  cccd: t.Optional(t.String()),      // Căn cước công dân (tùy chọn)
  ngaySinh: t.Optional(t.String()),  // Dạng chuỗi ISO (YYYY-MM-DD)
  gioiTinh: t.Optional(t.String()),  // Nam/Nữ/Khác
  quanHeVoiChuHo: t.Optional(t.String()),
  hoKhauId: t.String({ minLength: 1, error: "Phải thuộc về một hộ khẩu" }), // ID của hộ khẩu
});

// Lấy danh sách tất cả nhân khẩu (kèm thông tin hộ khẩu)
export async function getAllNhanKhau() {
  return await db.nhanKhau.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      hoKhau: true, // Lấy luôn thông tin hộ khẩu tương ứng
    },
  });
}

// Tạo nhân khẩu mới
export async function createNhanKhau(data: {
  hoTen: string;
  hoKhauId: string;
  cccd?: string;
  ngaySinh?: string;
  gioiTinh?: string;
  quanHeVoiChuHo?: string;
}) {
  // Kiểm tra xem Hộ khẩu có tồn tại không
  const hoKhau = await db.hoKhau.findUnique({
    where: { id: data.hoKhauId },
  });
  
  if (!hoKhau) {
    throw new Error("Hộ khẩu không tồn tại.");
  }

  // Kiểm tra CCCD trùng lặp (nếu có nhập)
  if (data.cccd) {
    const existing = await db.nhanKhau.findUnique({
      where: { cccd: data.cccd },
    });
    if (existing) {
      throw new Error(`CCCD ${data.cccd} đã tồn tại.`);
    }
  }

  return await db.nhanKhau.create({
    data: {
      ...data,
      ngaySinh: data.ngaySinh ? new Date(data.ngaySinh) : null, // Chuyển string sang Date
    },
  });
}

// Cập nhật nhân khẩu
export async function updateNhanKhau(id: string, data: any) {
  // Kiểm tra tồn tại
  const existing = await db.nhanKhau.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Nhân khẩu không tồn tại hoặc đã bị xóa");
  }
  
  // Kiểm tra CCCD trùng lặp nếu thay đổi
  if (data.cccd && data.cccd !== existing.cccd) {
    const cccdConflict = await db.nhanKhau.findUnique({
      where: { cccd: data.cccd }
    });
    if (cccdConflict) {
      throw new Error(`CCCD ${data.cccd} đã được sử dụng bởi nhân khẩu khác`);
    }
  }
  
  // Xử lý ngày sinh nếu có
  if (data.ngaySinh) {
    data.ngaySinh = new Date(data.ngaySinh);
  }

  return await db.nhanKhau.update({
    where: { id },
    data,
  });
}

// Xóa nhân khẩu
export async function deleteNhanKhau(id: string) {
  // Kiểm tra tồn tại
  const existing = await db.nhanKhau.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Nhân khẩu không tồn tại");
  }
  
  // Kiểm tra nếu là chủ hộ
  if (existing.quanHeVoiChuHo === 'Chủ hộ') {
    throw new Error("Không thể xóa chủ hộ. Hãy chuyển chủ hộ sang người khác hoặc xóa toàn bộ hộ khẩu.");
  }
  
  return await db.nhanKhau.delete({
    where: { id },
  });
}