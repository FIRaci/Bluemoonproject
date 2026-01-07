// SEED FILE
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/*
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * Hàm này dùng để hash mật khẩu an toàn
 * Chúng ta dùng Bun.password (nhanh hơn bcrypt)
 */
async function hashPassword(password: string): Promise<string> {
  // Hash mật khẩu với độ an toàn (cost) là 10
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

/**
 * Hàm main để chạy seed
 */
async function main() {
  console.log("Bắt đầu seeding dữ liệu...");

  // 1. Hash mật khẩu cho admin
  const hashedPassword = await hashPassword("admin123");

  // 2. Tạo tài khoản admin mẫu
  // (upsert = update or insert: cập nhật nếu đã tồn tại, nếu chưa thì tạo mới)
  const adminUser = await db.user.upsert({
    where: { username: "admin" }, // Tìm user có username là 'admin'
    update: {
      // Nếu tồn tại thì cập nhật
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      // Nếu chưa tồn tại thì tạo mới
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Đã tạo/cập nhật tài khoản admin: ${adminUser.username}`);
  console.log(`Mật khẩu (để test): admin123`);

  // 3. Tạo dữ liệu test cho biểu đồ dashboard
  console.log("Tạo dữ liệu test...");

  // Tạo hộ khẩu test cho registration (đơn giản)
  let hoKhauTest = await db.hoKhau.findUnique({
    where: { soCanHo: "BM-A1201" }
  });
  
  if (!hoKhauTest) {
    hoKhauTest = await db.hoKhau.create({
      data: {
        soCanHo: "BM-A1201",
        tenChuHo: "Trần Thị B",
        dienTich: 75
      }
    });
    console.log(`Đã tạo hộ khẩu test: ${hoKhauTest.soCanHo} - ${hoKhauTest.tenChuHo}`);
  }

  // Tạo hộ khẩu test khác
  let hoKhau1 = await db.hoKhau.findUnique({
    where: { soCanHo: "BM-B0203" }
  });
  
  if (!hoKhau1) {
    hoKhau1 = await db.hoKhau.create({
      data: {
        soCanHo: "BM-B0203",
        tenChuHo: "Nguyễn Văn A",
        dienTich: 67,
        nhanKhaus: {
          create: {
            hoTen: "Nguyễn Văn A",
            quanHeVoiChuHo: "Chủ hộ",
            ngaySinh: new Date("1980-01-15"),
            gioiTinh: "Nam",
            cccd: "123456789012"
          }
        }
      }
    });
  }

  // Tạo các khoản thu test
  const khoanThuData = [
    {
      tenKhoanThu: "Phí quản lý tháng 12/2025",
      soTien: 350000,
      moTa: "Phí quản lý chung cư tháng 12/2025 - áp dụng toàn tòa nhà",
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "CO_DINH" as const,
      hanNop: new Date(2025, 11, 30),
    },
    {
      tenKhoanThu: "Phí đặc biệt tòa A - tầng cao",
      soTien: 500000,
      moTa: "Phí dịch vụ đặc biệt cho tòa A từ tầng 10 trở lên",
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "CO_DINH" as const,
      phamViApDung: "THEO_TOA",
      toa: "A",
      tang: null,
      hanNop: new Date(2025, 11, 30),
    },
    {
      tenKhoanThu: "Tiền điện tháng 12/2025",
      moTa: "Tiền điện theo mức sử dụng - EVN",
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "THEO_MUC_SU_DUNG" as const,
      loaiDichVu: "DIEN",
      donGiaDichVu: 2500,
      donViTinh: "kWh",
      nhaCungCap: "EVN - Điện lực Thành phố",
      phiCoDinh: 50000,
      ghiChuGia: "Bao gồm VAT, phí dịch vụ khách hàng",
      hanNop: new Date(2025, 11, 30),
    },
    {
      tenKhoanThu: "Tiền nước tháng 12/2025", 
      moTa: "Tiền nước theo mức sử dụng",
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "THEO_MUC_SU_DUNG" as const,
      loaiDichVu: "NUOC",
      donGiaDichVu: 15000,
      donViTinh: "m3",
      nhaCungCap: "Công ty CP Cấp nước Sài Gòn",
      phiCoDinh: 30000,
      ghiChuGia: "Giá theo bậc thang, bao gồm thuế môi trường",
      hanNop: new Date(2025, 11, 30),
    }
  ];

  let khoanThu1;
  for (const khoanData of khoanThuData) {
    let existingKhoan = await db.khoanThu.findFirst({
      where: { tenKhoanThu: khoanData.tenKhoanThu }
    });
    
    if (!existingKhoan) {
      existingKhoan = await db.khoanThu.create({
        data: khoanData
      });
      console.log(`Đã tạo khoản thu: ${existingKhoan.tenKhoanThu}`);
    }
    
    if (!khoanThu1) khoanThu1 = existingKhoan; // Lấy khoản đầu tiên để test
  }

  // Tạo lịch sử nộp tiền test cho các tháng khác nhau
  const currentYear = new Date().getFullYear();
  const testPayments = [
    { month: 1, amount: 1500000 },
    { month: 2, amount: 1800000 },
    { month: 3, amount: 2100000 },
    { month: 4, amount: 1900000 },
    { month: 5, amount: 2300000 },
    { month: 6, amount: 2000000 },
    { month: 7, amount: 1700000 },
    { month: 8, amount: 2200000 },
    { month: 9, amount: 1950000 },
    { month: 10, amount: 2400000 },
    { month: 11, amount: 2100000 },
  ];

  for (const payment of testPayments) {
    // Kiểm tra khoanThu1 exists
    if (!khoanThu1) {
      console.warn('⚠️ khoanThu1 not found, skipping payment records');
      continue;
    }

    // Kiểm tra xem đã có record này chưa
    const existing = await db.lichSuNopTien.findFirst({
      where: {
        hoKhauId: hoKhau1.id,
        khoanThuId: khoanThu1.id,
        ngayNop: {
          gte: new Date(currentYear, payment.month - 1, 1),
          lt: new Date(currentYear, payment.month, 1)
        }
      }
    });

    if (!existing) {
      await db.lichSuNopTien.create({
        data: {
          hoKhauId: hoKhau1.id,
          khoanThuId: khoanThu1.id,
          soTienDaNop: payment.amount,
          ngayNop: new Date(currentYear, payment.month - 1, 15), // Giữa tháng
          ghiChu: `Thanh toán tháng ${payment.month}/${currentYear}`
        }
      });
    }
  }

  console.log("Đã tạo dữ liệu test cho dashboard");
  console.log("Seeding hoàn tất.");
}

// Thực thi hàm main và xử lý kết quả
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Đóng kết nối CSDL
    await db.$disconnect();
  });