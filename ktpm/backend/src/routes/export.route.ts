import { Elysia } from "elysia";
import ExcelJS from "exceljs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

export const exportRoute = new Elysia({ prefix: "/export" })
  .get("/police-report", async ({ set }) => {
    try {
      // Tạo workbook và worksheet
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "BlueMoon Management System";
      workbook.created = new Date();
      
      // Thời điểm hiện tại để check dữ liệu mới
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // ============ SHEET 1: HỘ KHẨU ============
      const sheetHoKhau = workbook.addWorksheet("Hộ Khẩu");
      
      sheetHoKhau.columns = [
        { header: "Số căn hộ", key: "soCanHo", width: 15 },
        { header: "Tên chủ hộ", key: "tenChuHo", width: 25 },
        { header: "Số điện thoại", key: "soDienThoai", width: 15 },
        { header: "CCCD chủ hộ", key: "ownerCccd", width: 15 },
        { header: "Email", key: "ownerEmail", width: 30 },
        { header: "Giới tính", key: "ownerGioiTinh", width: 10 },
        { header: "Ngày sinh", key: "ownerNgaySinh", width: 15 },
        { header: "Diện tích (m²)", key: "dienTich", width: 12 },
        { header: "Hạng căn hộ", key: "hangCanHo", width: 15 },
        { header: "Số nhân khẩu", key: "soNhanKhau", width: 12 },
        { header: "Ngày tạo", key: "createdAt", width: 18 },
        { header: "Cập nhật", key: "updatedAt", width: 18 },
        { header: "Trạng thái", key: "trangThai", width: 15 },
      ];

      // Style header
      sheetHoKhau.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheetHoKhau.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      sheetHoKhau.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const hoKhauList = await db.hoKhau.findMany({
        include: {
          nhanKhaus: true,
        },
        orderBy: { soCanHo: "asc" },
      });

      for (const hk of hoKhauList) {
        const isNew = hk.createdAt >= firstDayOfMonth;
        const isUpdated = hk.updatedAt >= firstDayOfMonth && hk.updatedAt > hk.createdAt;

        const row = sheetHoKhau.addRow({
          soCanHo: hk.soCanHo,
          tenChuHo: hk.tenChuHo,
          soDienThoai: hk.soDienThoai || "",
          ownerCccd: hk.ownerCccd ? `'${hk.ownerCccd}` : "", // Thêm ' để Excel hiểu là text
          ownerEmail: hk.ownerEmail || "",
          ownerGioiTinh: hk.ownerGioiTinh || "",
          ownerNgaySinh: hk.ownerNgaySinh ? hk.ownerNgaySinh.toLocaleDateString("vi-VN") : "",
          dienTich: hk.dienTich || 0,
          hangCanHo: hk.hangCanHo,
          soNhanKhau: hk.nhanKhaus.length,
          createdAt: hk.createdAt.toLocaleString("vi-VN"),
          updatedAt: hk.updatedAt.toLocaleString("vi-VN"),
          trangThai: isNew ? "MỚI" : isUpdated ? "CẬP NHẬT" : "",
        });

        // Highlight hàng mới/cập nhật
        if (isNew) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD4EDDA" }, // Xanh lá nhạt
          };
          row.font = { bold: true };
        } else if (isUpdated) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFF3CD" }, // Vàng nhạt
          };
        }
      }

      // ============ SHEET 2: NHÂN KHẨU ============
      const sheetNhanKhau = workbook.addWorksheet("Nhân Khẩu");
      
      sheetNhanKhau.columns = [
        { header: "Họ tên", key: "hoTen", width: 25 },
        { header: "CCCD", key: "cccd", width: 15 },
        { header: "Ngày sinh", key: "ngaySinh", width: 15 },
        { header: "Giới tính", key: "gioiTinh", width: 10 },
        { header: "Quan hệ với chủ hộ", key: "quanHeVoiChuHo", width: 18 },
        { header: "Email", key: "email", width: 30 },
        { header: "Số căn hộ", key: "soCanHo", width: 15 },
        { header: "Chủ hộ", key: "chuHo", width: 25 },
        { header: "Ngày tạo", key: "createdAt", width: 18 },
        { header: "Cập nhật", key: "updatedAt", width: 18 },
        { header: "Trạng thái", key: "trangThai", width: 15 },
      ];

      sheetNhanKhau.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheetNhanKhau.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      sheetNhanKhau.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const nhanKhauList = await db.nhanKhau.findMany({
        include: {
          hoKhau: true,
        },
        orderBy: [{ hoKhauId: "asc" }, { quanHeVoiChuHo: "asc" }],
      });

      for (const nk of nhanKhauList) {
        const isNew = nk.createdAt >= firstDayOfMonth;
        const isUpdated = nk.updatedAt >= firstDayOfMonth && nk.updatedAt > nk.createdAt;

        const row = sheetNhanKhau.addRow({
          hoTen: nk.hoTen,
          cccd: nk.cccd ? `'${nk.cccd}` : "", // Thêm ' để Excel hiểu là text
          ngaySinh: nk.ngaySinh ? nk.ngaySinh.toLocaleDateString("vi-VN") : "",
          gioiTinh: nk.gioiTinh || "",
          quanHeVoiChuHo: nk.quanHeVoiChuHo || "",
          email: nk.email || "",
          soCanHo: nk.hoKhau.soCanHo,
          chuHo: nk.hoKhau.tenChuHo,
          createdAt: nk.createdAt.toLocaleString("vi-VN"),
          updatedAt: nk.updatedAt.toLocaleString("vi-VN"),
          trangThai: isNew ? "MỚI" : isUpdated ? "CẬP NHẬT" : "",
        });

        if (isNew) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
          row.font = { bold: true };
        } else if (isUpdated) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } };
        }
      }

      // ============ SHEET 3: KHOẢN THU ============
      const sheetKhoanThu = workbook.addWorksheet("Khoản Thu");
      
      sheetKhoanThu.columns = [
        { header: "Tên khoản thu", key: "tenKhoanThu", width: 35 },
        { header: "Mô tả", key: "moTa", width: 40 },
        { header: "Loại phí", key: "loaiPhi", width: 12 },
        { header: "Phân loại", key: "phanLoaiPhi", width: 18 },
        { header: "Số tiền", key: "soTien", width: 15 },
        { header: "Đơn giá", key: "donGiaDichVu", width: 12 },
        { header: "Đơn vị", key: "donViTinh", width: 10 },
        { header: "Phạm vi", key: "phamViApDung", width: 12 },
        { header: "Tòa/Tầng/Phòng", key: "viTri", width: 15 },
        { header: "Hạn nộp", key: "hanNop", width: 15 },
        { header: "Ngày tạo", key: "createdAt", width: 18 },
        { header: "Trạng thái", key: "trangThai", width: 15 },
      ];

      sheetKhoanThu.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheetKhoanThu.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFC000" },
      };
      sheetKhoanThu.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const khoanThuList = await db.khoanThu.findMany({
        orderBy: { createdAt: "desc" },
      });

      for (const kt of khoanThuList) {
        const isNew = kt.createdAt >= firstDayOfMonth;

        const viTri = [kt.toa, kt.tang, kt.phong].filter(Boolean).join(" - ") || "Tất cả";

        const row = sheetKhoanThu.addRow({
          tenKhoanThu: kt.tenKhoanThu,
          moTa: kt.moTa || "",
          loaiPhi: kt.loaiPhi,
          phanLoaiPhi: kt.phanLoaiPhi,
          soTien: kt.soTien || kt.phiCoDinh || 0,
          donGiaDichVu: kt.donGiaDichVu || 0,
          donViTinh: kt.donViTinh || "",
          phamViApDung: kt.phamViApDung || "TAT_CA",
          viTri: viTri,
          hanNop: kt.hanNop ? kt.hanNop.toLocaleDateString("vi-VN") : "",
          createdAt: kt.createdAt.toLocaleString("vi-VN"),
          trangThai: isNew ? "MỚI" : "",
        });

        if (isNew) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
          row.font = { bold: true };
        }
      }

      // ============ SHEET 4: LỊCH SỬ THANH TOÁN ============
      const sheetLichSu = workbook.addWorksheet("Lịch Sử Thanh Toán");
      
      sheetLichSu.columns = [
        { header: "Ngày nộp", key: "ngayNop", width: 18 },
        { header: "Số căn hộ", key: "soCanHo", width: 15 },
        { header: "Chủ hộ", key: "chuHo", width: 25 },
        { header: "Khoản thu", key: "khoanThu", width: 35 },
        { header: "Số tiền", key: "soTienDaNop", width: 15 },
        { header: "Người nộp", key: "nguoiNop", width: 25 },
        { header: "Ghi chú", key: "ghiChu", width: 30 },
        { header: "Trạng thái", key: "trangThai", width: 15 },
      ];

      sheetLichSu.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheetLichSu.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF5B9BD5" },
      };
      sheetLichSu.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const lichSuList = await db.lichSuNopTien.findMany({
        include: {
          hoKhau: true,
          khoanThu: true,
        },
        orderBy: { ngayNop: "desc" },
        take: 5000, // Giới hạn 5000 bản ghi gần nhất
      });

      for (const ls of lichSuList) {
        const isNew = ls.ngayNop >= firstDayOfMonth;

        const row = sheetLichSu.addRow({
          ngayNop: ls.ngayNop.toLocaleString("vi-VN"),
          soCanHo: ls.hoKhau.soCanHo,
          chuHo: ls.hoKhau.tenChuHo,
          khoanThu: ls.khoanThu.tenKhoanThu,
          soTienDaNop: ls.soTienDaNop,
          nguoiNop: ls.nguoiNop || "",
          ghiChu: ls.ghiChu || "",
          trangThai: isNew ? "MỚI" : "",
        });

        if (isNew) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } };
          row.font = { bold: true };
        }
      }

      // ============ SHEET 5: THỐNG KÊ TỔNG HỢP ============
      const sheetThongKe = workbook.addWorksheet("Thống Kê");
      
      sheetThongKe.columns = [
        { header: "Chỉ tiêu", key: "chiTieu", width: 30 },
        { header: "Giá trị", key: "giaTri", width: 20 },
      ];

      sheetThongKe.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheetThongKe.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF9E480E" },
      };
      sheetThongKe.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

      const stats = {
        tongHoKhau: await db.hoKhau.count(),
        hoKhauMoi: await db.hoKhau.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
        tongNhanKhau: await db.nhanKhau.count(),
        nhanKhauMoi: await db.nhanKhau.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
        tongKhoanThu: await db.khoanThu.count(),
        tongTienDaThu: (await db.lichSuNopTien.aggregate({ _sum: { soTienDaNop: true } }))._sum.soTienDaNop || 0,
        tienThuThangNay: (await db.lichSuNopTien.aggregate({ 
          where: { ngayNop: { gte: firstDayOfMonth } },
          _sum: { soTienDaNop: true } 
        }))._sum.soTienDaNop || 0,
      };

      sheetThongKe.addRow({ chiTieu: "Tổng số hộ khẩu", giaTri: stats.tongHoKhau });
      sheetThongKe.addRow({ chiTieu: "Hộ khẩu mới tháng này", giaTri: stats.hoKhauMoi });
      sheetThongKe.addRow({ chiTieu: "Tổng số nhân khẩu", giaTri: stats.tongNhanKhau });
      sheetThongKe.addRow({ chiTieu: "Nhân khẩu mới tháng này", giaTri: stats.nhanKhauMoi });
      sheetThongKe.addRow({ chiTieu: "Tổng số khoản thu", giaTri: stats.tongKhoanThu });
      sheetThongKe.addRow({ chiTieu: "Tổng tiền đã thu (VNĐ)", giaTri: stats.tongTienDaThu });
      sheetThongKe.addRow({ chiTieu: "Tiền thu tháng này (VNĐ)", giaTri: stats.tienThuThangNay });

      // Format số tiền
      sheetThongKe.getColumn("giaTri").numFmt = "#,##0";

      // Export to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Set headers cho file download
      set.headers = {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BaoCaoCongAn_${new Date().toISOString().split("T")[0]}.xlsx"`,
      };

      return new Response(buffer);
    } catch (error) {
      console.error("Lỗi xuất Excel:", error);
      set.status = 500;
      return {
        status: "error",
        message: "Lỗi khi tạo file Excel",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
