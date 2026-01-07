import { db } from "@/utils/db";
import { t } from "elysia";

// DTO tạo Khoản Thu - flexible to accept both string and number for some fields
export const khoanThuDto = t.Object({
  tenKhoanThu: t.String({ minLength: 1, error: "Tên khoản thu không được để trống" }),
  moTa: t.Optional(t.Union([t.String(), t.Null()])),
  loaiPhi: t.Union([t.Literal("BAT_BUOC"), t.Literal("TU_NGUYEN")]),
  phanLoaiPhi: t.Union([t.Literal("CO_DINH"), t.Literal("THEO_MUC_SU_DUNG")]),
  
  // Phí cố định
  soTien: t.Optional(t.Union([t.Number(), t.Null()])),
  
  // Phí theo vị trí (mở rộng)
  phamViApDung: t.Optional(t.Union([t.String(), t.Null()])), // TAT_CA, THEO_TOA, THEO_TANG, THEO_PHONG, HANG_CAN_HO
  ghiChuPhamVi: t.Optional(t.Union([t.String(), t.Null()])), // Ghi chú phạm vi
  toa: t.Optional(t.Union([t.String(), t.Null()])), // A, B, C...
  tang: t.Optional(t.Union([t.String(), t.Number(), t.Null()])), // Số tầng - accept both string and number
  phong: t.Optional(t.Union([t.String(), t.Number(), t.Null()])), // Số phòng - accept both
  soTienViTri: t.Optional(t.Union([t.Number(), t.Null()])), // Số tiền cho vị trí này
  
  // Phí theo mức sử dụng - cải thiện
  loaiDichVu: t.Optional(t.Union([t.String(), t.Null()])), // DIEN, NUOC, MANG, GAS, KHAC
  donGiaDichVu: t.Optional(t.Union([t.Number(), t.Null()])), // Đơn giá điện/nước/mạng
  donViTinh: t.Optional(t.Union([t.String(), t.Null()])), // "kWh", "m3", "thang", "kg", "luot"
  nhaCungCap: t.Optional(t.Union([t.String(), t.Null()])), // "EVN", "FPT", "Viettel"...
  phiCoDinh: t.Optional(t.Union([t.Number(), t.Null()])), // Phí cố định thêm (abonnement)
  ghiChuGia: t.Optional(t.Union([t.String(), t.Null()])), // Ghi chú về giá
  
  hanNop: t.Optional(t.Union([t.String(), t.Null()])), // ISO Date string
});

// DTO nhập số điện/nước cho 1 hộ
export const chiTietSuDungDto = t.Object({
  hoKhauId: t.String(),
  khoanThuId: t.String(),
  chiSoCu: t.Optional(t.Number()),
  chiSoMoi: t.Number(),
});

// DTO import Excel hàng loạt
export const importSuDungDto = t.Array(t.Object({
  soCanHo: t.String(), // Số căn hộ để tìm hộ khẩu
  chiSoCu: t.Optional(t.Number()),
  chiSoMoi: t.Number(),
}));

// DTO ghi nhận Nộp Tiền
export const nopTienDto = t.Object({
  khoanThuId: t.String({ minLength: 1, error: "Phải chọn khoản thu" }),
  hoKhauId: t.String({ minLength: 1, error: "Phải chọn hộ khẩu nộp tiền" }),
  soTienDaNop: t.Number({ min: 0, error: "Số tiền nộp phải lớn hơn 0" }),
  nguoiNop: t.Optional(t.String()), // Ai đi nộp?
  ghiChu: t.Optional(t.String()),
});

// --- QUẢN LÝ KHOẢN THU ---

// Lấy danh sách tất cả khoản thu
export async function getAllKhoanThu() {
  return await db.khoanThu.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tenKhoanThu: true,
      moTa: true,
      loaiPhi: true,
      soTien: true,
      hanNop: true,
      createdAt: true,
      updatedAt: true,
      donGiaDichVu: true,
      donViTinh: true,
      nhaCungCap: true,
      phanLoaiPhi: true,
      phiCoDinh: true,
      // Thêm các trường phạm vi áp dụng
      phamViApDung: true,
      ghiChuPhamVi: true,
      toa: true,
      tang: true,
      phong: true,
      loaiDichVu: true,
      ghiChuGia: true,
      _count: {
        select: { lichSuNopTien: true },
      },
    },
  });
}

// Tạo khoản thu mới
export async function createKhoanThu(data: any) {
  if (data.hanNop) {
    data.hanNop = new Date(data.hanNop);
  }
  return await db.khoanThu.create({ data });
}

// Cập nhật khoản thu
export async function updateKhoanThu(id: string, data: any) {
  if (data.hanNop) data.hanNop = new Date(data.hanNop);
  return await db.khoanThu.update({ where: { id }, data });
}

// Xóa khoản thu (Cẩn thận: Chỉ xóa được nếu chưa có ai nộp tiền)
export async function deleteKhoanThu(id: string) {
  // Kiểm tra xem đã có ai nộp tiền chưa
  const count = await db.lichSuNopTien.count({ where: { khoanThuId: id } });
  if (count > 0) {
    throw new Error("Không thể xóa khoản thu này vì đã có dữ liệu nộp tiền.");
  }
  return await db.khoanThu.delete({ where: { id } });
}

// --- QUẢN LÝ NỘP TIỀN ---

// Ghi nhận nộp tiền
export async function ghiNhanNopTien(data: {
  khoanThuId: string;
  hoKhauId: string;
  soTienDaNop: number;
  nguoiNop?: string;
  ghiChu?: string;
}) {
  // Kiểm tra song song khoản thu và hộ khẩu
  const [khoanThu, hoKhau] = await Promise.all([
    db.khoanThu.findUnique({
      where: { id: data.khoanThuId },
      select: { id: true, tenKhoanThu: true },
    }),
    db.hoKhau.findUnique({
      where: { id: data.hoKhauId },
      select: { id: true, soCanHo: true },
    }),
  ]);

  if (!khoanThu) throw new Error("Khoản thu không tồn tại.");
  if (!hoKhau) throw new Error("Hộ khẩu không tồn tại.");

  // Tạo record nộp tiền
  return await db.lichSuNopTien.create({
    data: {
      ...data,
      ngayNop: new Date(),
    },
  });
}

// Lấy lịch sử nộp tiền (có thể lọc theo khoanThuId hoặc hoKhauId)
export async function getLichSuNopTien(filter?: { khoanThuId?: string; hoKhauId?: string }) {
  return await db.lichSuNopTien.findMany({
    where: filter,
    orderBy: { ngayNop: "desc" },
    select: {
      id: true,
      soTienDaNop: true,
      ngayNop: true,
      nguoiNop: true,
      ghiChu: true,
      hoKhau: { select: { soCanHo: true, tenChuHo: true } },
      khoanThu: { select: { tenKhoanThu: true, loaiPhi: true } },
    },
  });
}

// --- QUẢN LÝ SỬ DỤNG ĐIỆN/NƯỚC ---

// Nhập số điện/nước cho 1 hộ
export async function nhapChiTietSuDung(data: {
  hoKhauId: string;
  khoanThuId: string;
  chiSoCu?: number;
  chiSoMoi: number;
}) {
  // Kiểm tra khoản thu
  const khoanThu = await db.khoanThu.findUnique({
    where: { id: data.khoanThuId },
  });
  if (!khoanThu) throw new Error("Khoản thu không tồn tại");
  
  // Kiểm tra phanLoaiPhi phải là THEO_MUC_SU_DUNG
  if (khoanThu.phanLoaiPhi !== "THEO_MUC_SU_DUNG") {
    throw new Error("Khoản thu này không phải loại theo mức sử dụng");
  }

  // Tính số lượng sử dụng
  const soLuongSuDung = data.chiSoCu 
    ? data.chiSoMoi - data.chiSoCu 
    : data.chiSoMoi;
  
  if (soLuongSuDung < 0) {
    throw new Error("Chỉ số mới phải lớn hơn chỉ số cũ");
  }

  // Tính thành tiền
  const thanhTien = soLuongSuDung * (khoanThu.donGiaDichVu || 0);

  // Upsert (update nếu có, create nếu chưa)
  return await db.chiTietSuDung.upsert({
    where: {
      hoKhauId_khoanThuId: {
        hoKhauId: data.hoKhauId,
        khoanThuId: data.khoanThuId,
      },
    },
    update: {
      chiSoCu: data.chiSoCu,
      chiSoMoi: data.chiSoMoi,
      soLuongSuDung,
      thanhTien,
    },
    create: {
      hoKhauId: data.hoKhauId,
      khoanThuId: data.khoanThuId,
      chiSoCu: data.chiSoCu,
      chiSoMoi: data.chiSoMoi,
      soLuongSuDung,
      thanhTien,
    },
  });
}

// Lấy danh sách chi tiết sử dụng theo khoản thu
export async function getChiTietSuDung(khoanThuId: string) {
  return await db.chiTietSuDung.findMany({
    where: { khoanThuId },
    include: {
      hoKhau: {
        select: {
          id: true,
          soCanHo: true,
          tenChuHo: true,
        },
      },
    },
    orderBy: {
      hoKhau: {
        soCanHo: 'asc',
      },
    },
  });
}

// Import hàng loạt từ Excel
export async function importChiTietSuDung(
  khoanThuId: string,
  data: Array<{
    soCanHo: string;
    chiSoCu?: number;
    chiSoMoi: number;
  }>
) {
  const khoanThu = await db.khoanThu.findUnique({
    where: { id: khoanThuId },
  });
  if (!khoanThu) throw new Error("Khoản thu không tồn tại");
  if (khoanThu.phanLoaiPhi !== "THEO_MUC_SU_DUNG") {
    throw new Error("Khoản thu này không phải loại theo mức sử dụng");
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of data) {
    try {
      // Tìm hộ khẩu theo số căn hộ
      const hoKhau = await db.hoKhau.findUnique({
        where: { soCanHo: item.soCanHo },
      });

      if (!hoKhau) {
        results.failed++;
        results.errors.push(`Không tìm thấy căn hộ ${item.soCanHo}`);
        continue;
      }

      await nhapChiTietSuDung({
        hoKhauId: hoKhau.id,
        khoanThuId,
        chiSoCu: item.chiSoCu,
        chiSoMoi: item.chiSoMoi,
      });

      results.success++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${item.soCanHo}: ${error.message}`);
    }
  }

  return results;
}

// Tính tổng số tiền phải thu cho 1 hộ khẩu (bao gồm tất cả các khoản)
export async function tinhTongTienPhaiThu(hoKhauId: string) {
  const hoKhau = await db.hoKhau.findUnique({
    where: { id: hoKhauId },
  });
  if (!hoKhau) throw new Error("Hộ khẩu không tồn tại");

  // Lấy tất cả các khoản thu
  const cacKhoanThu = await db.khoanThu.findMany();
  
  let tongTien = 0;
  const chiTiet = [];

  for (const khoanThu of cacKhoanThu) {
    let soTienKhoanNay = 0;

    // Xử lý theo phanLoaiPhi (sync với schema.prisma enum PhanLoaiPhi)
    switch (khoanThu.phanLoaiPhi) {
      case 'CO_DINH':
        // Phí cố định
        soTienKhoanNay = khoanThu.soTien || 0;
        break;
        
      case 'THEO_MUC_SU_DUNG':
        // Phí theo mức sử dụng (điện/nước)
        const suDung = await db.chiTietSuDung.findUnique({
          where: {
            hoKhauId_khoanThuId: {
              hoKhauId,
              khoanThuId: khoanThu.id,
            },
          },
        });
        soTienKhoanNay = suDung?.thanhTien || 0;
        break;
        
      default:
        // Fallback: sử dụng soTien nếu có
        soTienKhoanNay = khoanThu.soTien || 0;
    }

    chiTiet.push({
      khoanThu: {
        id: khoanThu.id,
        tenKhoanThu: khoanThu.tenKhoanThu,
        phanLoaiPhi: khoanThu.phanLoaiPhi,
      },
      soTien: soTienKhoanNay,
    });

    tongTien += soTienKhoanNay;
  }

  return {
    hoKhau: {
      id: hoKhau.id,
      soCanHo: hoKhau.soCanHo,
      tenChuHo: hoKhau.tenChuHo,
      dienTich: hoKhau.dienTich,
    },
    chiTiet,
    tongTien,
  };
}

// Lấy chi tiết sử dụng theo khoản thu
export async function getUsageByKhoanThu(khoanThuId: string) {
  return await db.chiTietSuDung.findMany({
    where: { khoanThuId },
    include: {
      hoKhau: {
        select: { soCanHo: true, tenChuHo: true }
      }
    },
    orderBy: { hoKhau: { soCanHo: 'asc' } }
  });
}

// Lưu hàng loạt chỉ số điện/nước
export async function saveBulkUsage(khoanThuId: string, data: {
  usageData: Array<{
    hoKhauId: string;
    chiSoCu: number | null;
    chiSoMoi: number | null;
    directAmount?: number | null; // Nhập trực tiếp số tiền
    soCanHo?: string; // Dùng soCanHo thay vì hoKhauId
    hoKhauId?: string; // Giữ lại để backward compatible
  }>
}) {
  // Lấy thông tin khoản thu để tính giá
  const khoanThu = await db.khoanThu.findUnique({
    where: { id: khoanThuId }
  });

  if (!khoanThu) {
    throw new Error("Không tìm thấy khoản thu");
  }

  if (khoanThu.phanLoaiPhi !== 'THEO_MUC_SU_DUNG') {
    throw new Error("Khoản thu này không phải theo mức sử dụng");
  }

  const results = [];

  for (const usage of data.usageData) {
    let soLuongSuDung = 0;
    let thanhTien = 0;
    let chiSoCu = usage.chiSoCu;
    let chiSoMoi = usage.chiSoMoi;
    
    // Tìm hoKhauId từ soCanHo nếu có
    let hoKhauId = usage.hoKhauId;
    if (!hoKhauId && usage.soCanHo) {
      const hoKhau = await db.hoKhau.findFirst({
        where: { soCanHo: usage.soCanHo }
      });
      if (!hoKhau) {
        console.log(`Không tìm thấy hộ khẩu với soCanHo: ${usage.soCanHo}`);
        continue;
      }
      hoKhauId = hoKhau.id;
    }
    
    if (!hoKhauId) {
      console.log('Thiếu hoKhauId hoặc soCanHo');
      continue;
    }
    
    // Cách 1: Nhập trực tiếp số tiền (đơn giản nhất)
    if (usage.directAmount && usage.directAmount > 0) {
      thanhTien = usage.directAmount;
      soLuongSuDung = 0; // Không cần tính
      chiSoCu = null;
      chiSoMoi = null;
    } 
    // Cách 2: Tính từ chỉ số cũ/mới
    else if (chiSoMoi !== null && chiSoMoi !== undefined) {
      soLuongSuDung = chiSoMoi - (chiSoCu || 0);
      if (soLuongSuDung < 0) {
        continue; // Skip invalid data
      }
      thanhTien = (soLuongSuDung * (khoanThu.donGiaDichVu || 0)) + (khoanThu.phiCoDinh || 0);
    } else {
      continue; // Skip if no valid data
    }

    // Upsert chi tiết sử dụng
    const result = await db.chiTietSuDung.upsert({
      where: {
        hoKhauId_khoanThuId: {
          hoKhauId: hoKhauId,
          khoanThuId: khoanThuId
        }
      },
      update: {
        chiSoCu: chiSoCu,
        chiSoMoi: chiSoMoi,
        soLuongSuDung,
        thanhTien
      },
      create: {
        hoKhauId: hoKhauId,
        khoanThuId: khoanThuId,
        chiSoCu: chiSoCu,
        chiSoMoi: chiSoMoi || 0,
        soLuongSuDung,
        thanhTien
      },
      include: {
        hoKhau: { select: { soCanHo: true } }
      }
    });

    results.push(result);
  }

  return {
    saved: results.length,
    total: data.usageData.length,
    results
  };
}

// Export danh sách căn hộ kèm số cũ (nếu có) để làm template nhập liệu
export async function getExportTemplate(khoanThuId: string) {
  const khoanThu = await db.khoanThu.findUnique({
    where: { id: khoanThuId },
  });
  
  if (!khoanThu) throw new Error("Không tìm thấy khoản thu");
  
  // Build filter cho hộ khẩu dựa trên phạm vi áp dụng
  let hoKhauFilter: any = {};
  
  if (khoanThu.phamViApDung) {
    switch (khoanThu.phamViApDung) {
      case 'THEO_TOA':
        if (khoanThu.toa) {
          hoKhauFilter.soCanHo = { startsWith: `BM-${khoanThu.toa}` };
        }
        break;
      case 'THEO_TANG':
        if (khoanThu.toa && khoanThu.tang) {
          const tangStr = String(khoanThu.tang).padStart(2, '0');
          hoKhauFilter.soCanHo = { startsWith: `BM-${khoanThu.toa}${tangStr}` };
        }
        break;
      case 'HANG_CAN_HO':
        if (khoanThu.ghiChuPhamVi) {
          hoKhauFilter.hangCanHo = khoanThu.ghiChuPhamVi;
        }
        break;
    }
  }
  
  // Lấy danh sách hộ khẩu trong phạm vi
  const hoKhauList = await db.hoKhau.findMany({
    where: hoKhauFilter,
    select: { id: true, soCanHo: true, tenChuHo: true },
    orderBy: { soCanHo: 'asc' }
  });
  
  // Lấy chi tiết sử dụng đã có (để pre-fill số cũ)
  const existingUsage = await db.chiTietSuDung.findMany({
    where: { khoanThuId },
    select: { hoKhauId: true, chiSoCu: true, chiSoMoi: true, thanhTien: true }
  });
  
  const usageMap = new Map(existingUsage.map(u => [u.hoKhauId, u]));
  
  // Tạo template data
  const templateData = hoKhauList.map(hh => {
    const existing = usageMap.get(hh.id);
    return {
      soCanHo: hh.soCanHo,
      tenChuHo: hh.tenChuHo,
      // Số cũ lấy từ số mới kỳ trước (nếu có)
      chiSoCu: existing?.chiSoMoi || 0,
      chiSoMoi: '', // User sẽ điền
      thanhTienKyTruoc: existing?.thanhTien || 0,
    };
  });
  
  return {
    khoanThu: {
      tenKhoanThu: khoanThu.tenKhoanThu,
      loaiDichVu: khoanThu.loaiDichVu,
      donGiaDichVu: khoanThu.donGiaDichVu,
      donViTinh: khoanThu.donViTinh,
      phiCoDinh: khoanThu.phiCoDinh,
      phamViApDung: khoanThu.phamViApDung,
    },
    templateData
  };
}