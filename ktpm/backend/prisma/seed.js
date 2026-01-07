// DISABLED SEED FILE - Renamed to prevent auto-seeding
// Original seed functionality moved to manual scripts
/*
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

/**
 * Hàm này dùng để hash mật khẩu an toàn
 * Chúng ta dùng Bun.password (nhanh hơn bcrypt)
 */
async function hashPassword(password) {
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
    // Tạo hộ khẩu test
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
    // Tạo khoản thu test
    let khoanThu1 = await db.khoanThu.findFirst({
        where: { tenKhoanThu: "Phí dịch vụ tháng 11" }
    });
    if (!khoanThu1) {
        khoanThu1 = await db.khoanThu.create({
            data: {
                tenKhoanThu: "Phí dịch vụ tháng 11",
                soTien: 500000,
                moTa: "Phí dịch vụ chung cư tháng 11/2025",
                loaiPhi: "BAT_BUOC",
                phanLoaiPhi: "CO_DINH",
                hanNop: new Date(2025, 10, 30), // 30/11/2025
            }
        });
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
export {};
