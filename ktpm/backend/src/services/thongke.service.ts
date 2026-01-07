import { db } from "@/utils/db";

// 1. Lấy số liệu tổng quan cho Dashboard (Trang chủ)
export async function getThongKeTongQuan(year?: number) {
  // Fetching dashboard statistics
  
  const selectedYear = year || new Date().getFullYear();
  
  // Đếm song song cho nhanh
  const [soHoKhau, soNhanKhau, soKhoanThu, tongThuResult, availableYears] = await Promise.all([
    db.hoKhau.count(),
    db.nhanKhau.count(),
    db.khoanThu.count(),
    db.lichSuNopTien.aggregate({
      _sum: { soTienDaNop: true },
    }),
    // Lấy danh sách các năm có dữ liệu
    db.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM "ngayNop")::int as year
      FROM "LichSuNopTien"
      ORDER BY year DESC
    `,
  ]);
  
  // Dashboard data calculated

  // Lấy dữ liệu theo tháng cho biểu đồ
  const monthlyData = await db.$queryRaw<Array<{ month: number; total: bigint }>>`
    SELECT 
      EXTRACT(MONTH FROM "ngayNop")::int as month,
      SUM("soTienDaNop") as total
    FROM "LichSuNopTien"
    WHERE EXTRACT(YEAR FROM "ngayNop") = ${selectedYear}
    GROUP BY month
    ORDER BY month
  `;

  // Chuyển đổi dữ liệu tháng thành mảng 12 tháng
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const monthRecord = monthlyData.find(m => m.month === i + 1);
    return monthRecord ? Number(monthRecord.total) / 1000000 : 0; // Chuyển sang triệu đồng
  });

  return {
    soHoKhau,
    soNhanKhau,
    soKhoanThu,
    tongTienDaThu: tongThuResult._sum.soTienDaNop || 0,
    chartData, // Thêm dữ liệu biểu đồ
    selectedYear,
    availableYears: availableYears.map(y => y.year),
  };
}

// 2. Lấy hoạt động thu phí gần đây
export async function getRecentPayments() {
  const recentPayments = await db.lichSuNopTien.findMany({
    take: 10,
    orderBy: { ngayNop: "desc" },
    include: {
      hoKhau: {
        select: { soCanHo: true, tenChuHo: true }
      },
      khoanThu: {
        select: { tenKhoanThu: true }
      }
    }
  });

  return recentPayments.map(payment => ({
    id: payment.id,
    soCanHo: payment.hoKhau.soCanHo,
    tenChuHo: payment.hoKhau.tenChuHo,
    tenKhoanThu: payment.khoanThu.tenKhoanThu,
    soTienDaNop: payment.soTienDaNop,
    ngayNop: payment.ngayNop,
  }));
}

// 3. Thống kê chi tiết theo một Khoản Thu cụ thể
export async function getThongKeTheoKhoanThu(khoanThuId: string) {
  // Kiểm tra khoản thu có tồn tại không
  const khoanThu = await db.khoanThu.findUnique({
    where: { id: khoanThuId },
  });
  if (!khoanThu) throw new Error("Khoản thu không tồn tại.");

  // Build filter cho hộ khẩu dựa trên phạm vi áp dụng của khoản thu
  let hoKhauFilter: any = {};
  
  if (khoanThu.phamViApDung) {
    switch (khoanThu.phamViApDung) {
      case 'THEO_TOA':
        if (khoanThu.toa) {
          // Lọc căn hộ thuộc tòa, VD: BM-A* -> tòa A
          hoKhauFilter.soCanHo = { startsWith: `BM-${khoanThu.toa}` };
        }
        break;
      case 'THEO_TANG':
        if (khoanThu.toa && khoanThu.tang) {
          // Lọc căn hộ thuộc tòa + tầng, VD: BM-A05* -> tòa A tầng 5
          const tangStr = String(khoanThu.tang).padStart(2, '0');
          hoKhauFilter.soCanHo = { startsWith: `BM-${khoanThu.toa}${tangStr}` };
        }
        break;
      case 'THEO_PHONG':
        if (khoanThu.toa && khoanThu.tang && khoanThu.phong) {
          // Lọc căn hộ cụ thể, VD: BM-A0501
          const tangStr = String(khoanThu.tang).padStart(2, '0');
          const phongStr = String(khoanThu.phong).padStart(2, '0');
          hoKhauFilter.soCanHo = `BM-${khoanThu.toa}${tangStr}${phongStr}`;
        }
        break;
      case 'HANG_CAN_HO':
        if (khoanThu.ghiChuPhamVi) {
          // Lọc theo hạng căn hộ
          hoKhauFilter.hangCanHo = khoanThu.ghiChuPhamVi;
        }
        break;
      // TAT_CA hoặc không có phạm vi -> không lọc
    }
  }

  // Lấy tổng số hộ khẩu trong phạm vi
  const tongSoHo = await db.hoKhau.count({ where: hoKhauFilter });
  
  // Lấy danh sách hộ khẩu trong phạm vi
  const hoKhauTrongPhamVi = await db.hoKhau.findMany({
    where: hoKhauFilter,
    select: { id: true, soCanHo: true, tenChuHo: true },
  });
  const hoKhauIdsTrongPhamVi = hoKhauTrongPhamVi.map(h => h.id);

  // Lấy danh sách các lần nộp tiền cho khoản này (chỉ từ các hộ trong phạm vi)
  const lichSuNop = await db.lichSuNopTien.findMany({
    where: { 
      khoanThuId,
      hoKhauId: { in: hoKhauIdsTrongPhamVi }
    },
    include: {
      hoKhau: {
        select: { id: true, soCanHo: true, tenChuHo: true },
      },
    },
    orderBy: { ngayNop: "desc" },
  });

  // Tính số hộ đã nộp (unique theo hoKhauId để xử lý trường hợp nộp nhiều lần)
  const uniqueHoKhauIds = new Set(lichSuNop.map(item => item.hoKhauId));
  const soHoDaNop = uniqueHoKhauIds.size;
  
  const soHoChuaNop = tongSoHo - soHoDaNop;
  const tongTienDaThu = lichSuNop.reduce((sum, item) => sum + item.soTienDaNop, 0);

  // Lấy danh sách hộ chưa nộp (trong phạm vi)
  const daNopHoKhauIds = Array.from(uniqueHoKhauIds);
  const danhSachChuaNop = hoKhauTrongPhamVi.filter(h => !daNopHoKhauIds.includes(h.id));

  return {
    khoanThu,
    tongSoHo,
    soHoDaNop,
    soHoChuaNop: soHoChuaNop > 0 ? soHoChuaNop : 0,
    tongTienDaThu,
    danhSachDaNop: lichSuNop,
    danhSachChuaNop: danhSachChuaNop,
  };
}