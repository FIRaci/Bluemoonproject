// SIMPLE SEED FILE
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const db = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log("Bắt đầu seeding dữ liệu...");

  // 1. Tạo admin
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
  console.log(`Đã tạo/cập nhật tài khoản admin: ${adminUser.username}`);

  // 2. Tạo hộ khẩu test cho registration
  const hoKhauTest = await db.hoKhau.upsert({
    where: { soCanHo: "BM-A1201" },
    update: {},
    create: {
      soCanHo: "BM-A1201",
      tenChuHo: "Trần Thị B",
      dienTich: 75,
    },
  });
  console.log(`Đã tạo/cập nhật hộ khẩu test: ${hoKhauTest.soCanHo}`);

  // 3. Tạo căn hộ khác để test
  const hoKhauTest2 = await db.hoKhau.upsert({
    where: { soCanHo: "BM-B1202" },
    update: {},
    create: {
      soCanHo: "BM-B1202",
      tenChuHo: "Nguyễn Văn C",
      dienTich: 85,
    },
  });
  console.log(`Đã tạo/cập nhật hộ khẩu test 2: ${hoKhauTest2.soCanHo}`);

  // 3. Tạo một số khoản thu test
  const khoanThu1 = await db.khoanThu.upsert({
    where: { id: "test-fee-1" },
    update: {},
    create: {
      id: "test-fee-1",
      tenKhoanThu: "Phí quản lý tháng 12/2025",
      soTien: 300000,
      moTa: "Phí quản lý chung cư",
      loaiPhi: "BAT_BUOC",
      phanLoaiPhi: "CO_DINH",
    },
  });

  const khoanThu2 = await db.khoanThu.upsert({
    where: { id: "test-fee-2" },
    update: {},
    create: {
      id: "test-fee-2", 
      tenKhoanThu: "Phí dịch vụ tháng 12/2025",
      soTien: 250000,
      moTa: "Phí dịch vụ chung cư",
      loaiPhi: "BAT_BUOC",
      phanLoaiPhi: "CO_DINH",
    },
  });

  console.log(`Đã tạo ${2} khoản thu test`);
  console.log("✅ Seeding hoàn tất!");
  console.log("\n🔑 Thông tin test:");
  console.log("- Admin: admin / admin123");
  console.log("- Căn hộ để test registration: BM-A1201");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });