// SEED FILE - 100 Hộ khẩu, 300 Cư dân, 36 Khoản thu
import { PrismaClient, HangCanHo } from "@prisma/client";
const db = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  // Sử dụng bcrypt từ Bun built-in
  const bcrypt = await import('bcrypt');
  return await bcrypt.hash(password, 10);
}

// Danh sách tên họ và tên đệm phổ biến
const hoTenList = {
  ho: ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"],
  tenDem: ["Văn", "Thị", "Hữu", "Đức", "Minh", "Thanh", "Thành", "Quốc", "Hoàng", "Anh", "Công", "Tuấn"],
  ten: ["An", "Bình", "Cường", "Dũng", "Hải", "Hùng", "Khoa", "Long", "Nam", "Phong", "Quân", "Sơn", "Tùng", "Việt", 
        "Lan", "Linh", "Mai", "Nga", "Phương", "Hương", "Thu", "Thảo", "Trang", "Vy", "Yến"]
};

const quanHe = ["Chủ hộ", "Vợ/Chồng", "Con", "Con", "Cha/Mẹ", "Anh/Chị/Em"];
const gioiTinh = ["Nam", "Nữ"];

// Hàm tạo tên ngẫu nhiên
function randomName(): string {
  const ho = hoTenList.ho[Math.floor(Math.random() * hoTenList.ho.length)];
  const tenDem = hoTenList.tenDem[Math.floor(Math.random() * hoTenList.tenDem.length)];
  const ten = hoTenList.ten[Math.floor(Math.random() * hoTenList.ten.length)];
  return `${ho} ${tenDem} ${ten}`;
}

// Hàm tạo ngày sinh ngẫu nhiên
function randomBirthDate(minAge: number, maxAge: number): Date {
  const today = new Date();
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const year = today.getFullYear() - age;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

// Hàm tạo CCCD ngẫu nhiên (12 số)
function randomCCCD(): string {
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
}

// Hàm tạo số điện thoại
function randomPhone(): string {
  return '09' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
}

async function main() {
  console.log("🌱 Bắt đầu seeding dữ liệu lớn...");
  console.log("📦 Tạo 100 hộ khẩu, 300 cư dân, 36 khoản thu");

  // 1. Tạo tài khoản admin
  const hashedPassword = await hashPassword("admin123");
  const adminUser = await db.user.upsert({
    where: { username: "admin" },
    update: {
      password: hashedPassword,
      role: "ADMIN",
    },
    create: {
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin: ${adminUser.username} / admin123`);

  // 2. Tạo 100 hộ khẩu
  console.log("\n🏠 Tạo 100 hộ khẩu...");
  const toaNha = ["A", "B", "C", "D"];
  const hoKhauIds: string[] = [];
  const hoKhauData = [];

  for (let i = 1; i <= 100; i++) {
    const toa = toaNha[Math.floor(Math.random() * toaNha.length)];
    const tang = Math.floor(Math.random() * 20) + 1; // Tầng 1-20
    const soPhong = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0'); // 01-12
    const soCanHo = `BM-${toa}${String(tang).padStart(2, '0')}${soPhong}`;
    const tenChuHo = randomName();
    const dienTich = Math.floor(Math.random() * 60) + 50; // 50-110 m2
    const hangCanHo: HangCanHo = Math.random() > 0.8 ? HangCanHo.CAO_CAP : Math.random() > 0.5 ? HangCanHo.TRUNG_CAP : HangCanHo.BINH_THUONG;

    hoKhauData.push({
      soCanHo,
      tenChuHo,
      soDienThoai: randomPhone(),
      dienTich,
      hangCanHo,
      ownerCccd: randomCCCD(),
      ownerEmail: `${soCanHo.toLowerCase().replace(/-/g, '')}@gmail.com`,
      ownerGioiTinh: gioiTinh[Math.floor(Math.random() * gioiTinh.length)],
      ownerNgaySinh: randomBirthDate(25, 65),
    });
  }

  // Batch insert hộ khẩu
  const createdHoKhaus = await db.hoKhau.createMany({
    data: hoKhauData,
    skipDuplicates: true,
  });
  console.log(`✅ Đã tạo ${createdHoKhaus.count} hộ khẩu`);

  // Lấy danh sách ID hộ khẩu vừa tạo kèm thông tin chủ hộ
  const allHoKhaus = await db.hoKhau.findMany({
    select: { 
      id: true, 
      tenChuHo: true, 
      soCanHo: true,
      ownerCccd: true,
      ownerEmail: true,
      ownerGioiTinh: true,
      ownerNgaySinh: true
    }
  });

  // 3. Tạo 300 cư dân (trung bình 3 người/hộ)
  console.log("\n👥 Tạo 300 cư dân...");
  const nhanKhauData = [];
  let cuDanCount = 0;

  for (const hoKhau of allHoKhaus) {
    // Mỗi hộ có 2-5 người
    const soNguoi = Math.floor(Math.random() * 4) + 2;
    
    for (let j = 0; j < soNguoi && cuDanCount < 300; j++) {
      const isOwner = j === 0;
      nhanKhauData.push({
        hoTen: isOwner ? hoKhau.tenChuHo : randomName(),
        // Sử dụng thông tin từ hộ khẩu cho chủ hộ để đảm bảo dữ liệu nhất quán
        cccd: isOwner ? hoKhau.ownerCccd : randomCCCD(),
        ngaySinh: isOwner ? hoKhau.ownerNgaySinh : randomBirthDate(0, 70),
        gioiTinh: isOwner ? hoKhau.ownerGioiTinh : gioiTinh[Math.floor(Math.random() * gioiTinh.length)],
        quanHeVoiChuHo: isOwner ? "Chủ hộ" : quanHe[Math.floor(Math.random() * (quanHe.length - 1)) + 1],
        hoKhauId: hoKhau.id,
        email: isOwner ? hoKhau.ownerEmail : `cudan${cuDanCount + 1}@gmail.com`,
      });
      cuDanCount++;
    }

    if (cuDanCount >= 300) break;
  }

  const createdNhanKhau = await db.nhanKhau.createMany({
    data: nhanKhauData,
    skipDuplicates: true,
  });
  console.log(`✅ Đã tạo ${createdNhanKhau.count} cư dân`);

  // 4. Tạo khoản thu phí cho năm 2025
  console.log("\n💰 Tạo khoản thu phí năm 2025...");
  
  // Hàm tạo khoản thu cho một năm
  const taoKhoanThuTheoNam = (nam: number) => [
    // Phí quản lý cố định (12 tháng)
    ...Array.from({ length: 12 }, (_, i) => ({
      tenKhoanThu: `Phí quản lý tháng ${i + 1}/${nam}`,
      soTien: 350000,
      moTa: `Phí quản lý chung cư tháng ${i + 1}/${nam}`,
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "CO_DINH" as const,
      phiCoDinh: 350000,
      phamViApDung: "TAT_CA",
      hanNop: new Date(nam, i, 15),
      createdAt: new Date(nam, i, 1), // Ngày tạo đầu tháng tương ứng
    })),

    // Phí điện (4 quý)
    ...Array.from({ length: 4 }, (_, i) => ({
      tenKhoanThu: `Tiền điện quý ${i + 1}/${nam}`,
      donGiaDichVu: 2500,
      donViTinh: "kWh",
      moTa: `Tiền điện sinh hoạt quý ${i + 1}/${nam}`,
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "THEO_MUC_SU_DUNG" as const,
      loaiDichVu: "DIEN",
      nhaCungCap: "EVN HCMC",
      phamViApDung: "TAT_CA",
      hanNop: new Date(nam, i * 3 + 2, 20),
      createdAt: new Date(nam, i * 3, 1),
    })),

    // Phí nước (4 quý)
    ...Array.from({ length: 4 }, (_, i) => ({
      tenKhoanThu: `Tiền nước quý ${i + 1}/${nam}`,
      donGiaDichVu: 15000,
      donViTinh: "m³",
      moTa: `Tiền nước sinh hoạt quý ${i + 1}/${nam}`,
      loaiPhi: "BAT_BUOC" as const,
      phanLoaiPhi: "THEO_MUC_SU_DUNG" as const,
      loaiDichVu: "NUOC",
      nhaCungCap: "Saigon Water",
      phamViApDung: "TAT_CA",
      hanNop: new Date(nam, i * 3 + 2, 25),
      createdAt: new Date(nam, i * 3, 1),
    })),

    // Phí đặc biệt theo tòa (4 tòa x 2 kỳ = 8)
    ...["A", "B", "C", "D"].flatMap(toa => [
      {
        tenKhoanThu: `Phí bảo trì thang máy tòa ${toa} - Kỳ 1/${nam}`,
        soTien: 200000,
        moTa: `Chi phí bảo trì thang máy tòa ${toa} - 6 tháng đầu năm ${nam}`,
        loaiPhi: "BAT_BUOC" as const,
        phanLoaiPhi: "CO_DINH" as const,
        phiCoDinh: 200000,
        phamViApDung: "THEO_TOA",
        toa: toa,
        hanNop: new Date(nam, 5, 30),
        createdAt: new Date(nam, 0, 1),
      },
      {
        tenKhoanThu: `Phí bảo trì thang máy tòa ${toa} - Kỳ 2/${nam}`,
        soTien: 200000,
        moTa: `Chi phí bảo trì thang máy tòa ${toa} - 6 tháng cuối năm ${nam}`,
        loaiPhi: "BAT_BUOC" as const,
        phanLoaiPhi: "CO_DINH" as const,
        phiCoDinh: 200000,
        phamViApDung: "THEO_TOA",
        toa: toa,
        hanNop: new Date(nam, 11, 30),
        createdAt: new Date(nam, 6, 1),
      },
    ]),
  ];

  // Tạo khoản thu cho năm 2025 (ưu tiên dữ liệu 2025 trước)
  const khoanThuData = [
    ...taoKhoanThuTheoNam(2025),
  ];

  const createdKhoanThu = await db.khoanThu.createMany({
    data: khoanThuData,
    skipDuplicates: true,
  });
  console.log(`✅ Đã tạo ${createdKhoanThu.count} khoản thu phí`);

  // 5. Tạo chi tiết sử dụng cho các khoản thu theo mức sử dụng
  console.log("\n📊 Tạo chi tiết sử dụng điện nước...");
  
  const khoanThuDienNuoc = await db.khoanThu.findMany({
    where: {
      phanLoaiPhi: "THEO_MUC_SU_DUNG"
    }
  });

  const chiTietSuDungData = [];
  for (const hoKhau of allHoKhaus) {
    for (const khoanThu of khoanThuDienNuoc) {
      const isDien = khoanThu.loaiDichVu === "DIEN";
      const soLuong = isDien 
        ? Math.floor(Math.random() * 200) + 100  // Điện: 100-300 kWh
        : Math.floor(Math.random() * 15) + 5;    // Nước: 5-20 m³
      
      chiTietSuDungData.push({
        hoKhauId: hoKhau.id,
        khoanThuId: khoanThu.id,
        chiSoCu: isDien ? Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 100),
        chiSoMoi: isDien ? Math.floor(Math.random() * 1000) + 1000 : Math.floor(Math.random() * 100) + 100,
        soLuongSuDung: soLuong,
        thanhTien: soLuong * (khoanThu.donGiaDichVu || 0),
      });
    }
  }

  await db.chiTietSuDung.createMany({
    data: chiTietSuDungData,
    skipDuplicates: true,
  });
  console.log(`✅ Đã tạo ${chiTietSuDungData.length} chi tiết sử dụng`);

  // 6. Tạo lịch sử nộp tiền ngẫu nhiên
  console.log("\n💵 Tạo lịch sử nộp tiền...");
  
  const khoanThuCoDinh = await db.khoanThu.findMany({
    where: { phanLoaiPhi: "CO_DINH" }
  });

  const lichSuNopTienData = [];
  for (const hoKhau of allHoKhaus.slice(0, 80)) { // 80% hộ đã đóng
    // Đóng một số khoản phí cố định năm 2025
    const khoanPhiDaDong = khoanThuCoDinh.slice(0, Math.floor(Math.random() * 15) + 8);
    
    for (const khoanThu of khoanPhiDaDong) {
      // Tất cả thanh toán đều trong năm 2025
      const thang = Math.floor(Math.random() * 12);
      
      lichSuNopTienData.push({
        hoKhauId: hoKhau.id,
        khoanThuId: khoanThu.id,
        soTienDaNop: khoanThu.soTien || khoanThu.phiCoDinh || 0,
        ngayNop: new Date(2025, thang, Math.floor(Math.random() * 28) + 1),
        nguoiNop: hoKhau.tenChuHo,
        ghiChu: "Đã thanh toán",
      });
    }
  }

  await db.lichSuNopTien.createMany({
    data: lichSuNopTienData,
    skipDuplicates: true,
  });
  console.log(`✅ Đã tạo ${lichSuNopTienData.length} lịch sử nộp tiền`);

  console.log("\n✨ Seeding hoàn tất!");
  console.log("📊 Tổng kết:");
  console.log(`   - 100 hộ khẩu`);
  console.log(`   - ${cuDanCount} cư dân`);
  console.log(`   - ${createdKhoanThu.count} khoản thu phí (năm 2025)`);
  console.log(`   - ${chiTietSuDungData.length} chi tiết sử dụng`);
  console.log(`   - ${lichSuNopTienData.length} lịch sử thanh toán (năm 2025)`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
