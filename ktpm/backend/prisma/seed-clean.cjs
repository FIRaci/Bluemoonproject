const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
    console.log('🧹 Bắt đầu seeding dữ liệu clean...');

    try {
        // Xóa dữ liệu cũ
        console.log('🗑️ Xóa dữ liệu cũ...');
        await db.lichSuNopTien.deleteMany({});
        await db.chiTietSuDung.deleteMany({});
        await db.khoanThu.deleteMany({});
        await db.nhanKhau.deleteMany({});
        await db.hoKhau.deleteMany({});
        await db.user.deleteMany({});

        // 1. Tạo admin user
        const adminUser = await db.user.create({
            data: {
                username: 'admin',
                password: '$2b$10$AsVZpVi3Oetdq8dgSa7QhuMzgqRCqZ8dMYJfLO.LxgwDn54.idRVO', // admin123
                role: 'ADMIN'
            }
        });
        console.log('✅ Đã tạo admin user:', adminUser.username);
        
        // Tạo thêm user cư dân cho căn hộ BM-A1201
        const bcrypt = require('bcrypt');
        const residentUser = await db.user.create({
            data: {
                username: 'BM-A1201',
                password: await bcrypt.hash('BM-A1201', 10), // Mật khẩu mặc định = username
                role: 'RESIDENT'
            }
        });
        console.log('✅ Đã tạo resident user:', residentUser.username);

        // 2. Tạo vài hộ khẩu test với thông tin đầy đủ
        const hoKhau1 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-A1201',
                tenChuHo: 'Nguyễn Văn An',
                soDienThoai: '0901234567',
                dienTich: 75.5,
                hangCanHo: 'BINH_THUONG',
                // Thông tin chủ hộ đầy đủ
                ownerCccd: '012345678901',
                ownerNgaySinh: new Date('1985-03-15'),
                ownerGioiTinh: 'Nam',
                ownerEmail: 'nguyenvanan@gmail.com'
            }
        });

        const hoKhau2 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-B0503',
                tenChuHo: 'Trần Thị Bình',
                soDienThoai: '0912345678',
                dienTich: 68.0,
                hangCanHo: 'BINH_THUONG',
                // Thông tin chủ hộ đầy đủ
                ownerCccd: '012345678902',
                ownerNgaySinh: new Date('1990-07-22'),
                ownerGioiTinh: 'Nữ',
                ownerEmail: 'ttbinh@gmail.com'
            }
        });

        const hoKhau3 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-C1505',
                tenChuHo: 'Lê Văn Cường',
                soDienThoai: '0923456789',
                dienTich: 120.0,
                hangCanHo: 'CAO_CAP',
                // Thông tin chủ hộ đầy đủ
                ownerCccd: '012345678903',
                ownerNgaySinh: new Date('1982-12-05'),
                ownerGioiTinh: 'Nam',
                ownerEmail: 'lvcuong@gmail.com'
            }
        });

        console.log('✅ Đã tạo 3 hộ khẩu test');

        // 2.1 Tạo nhân khẩu cho các hộ khẩu
        const nhanKhau1 = await db.nhanKhau.create({
            data: {
                hoTen: 'Nguyễn Văn An',
                cccd: '012345678901',
                ngaySinh: new Date('1985-05-15'),
                gioiTinh: 'Nam',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau1.id,
                email: 'nguyenvanan@email.com'
            }
        });

        const nhanKhau2 = await db.nhanKhau.create({
            data: {
                hoTen: 'Trần Thị B',
                cccd: '012345678902',
                ngaySinh: new Date('1990-08-22'),
                gioiTinh: 'Nữ',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau2.id,
                email: 'tranthib@email.com'
            }
        });

        const nhanKhau3 = await db.nhanKhau.create({
            data: {
                hoTen: 'Lê Minh C',
                cccd: '012345678903',
                ngaySinh: new Date('1988-12-10'),
                gioiTinh: 'Nam',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau3.id,
                email: 'leminhc@email.com'
            }
        });

        console.log('✅ Đã tạo 3 nhân khẩu test');

        // Liên kết user BM-A1201 với hộ khẩu BM-A1201
        await db.user.update({
            where: { username: 'BM-A1201' },
            data: { hoKhauId: hoKhau1.id }
        });
        console.log('✅ Đã liên kết user BM-A1201 với hộ khẩu');

        // 3. Tạo các khoản thu đơn giản
        const khoanThu1 = await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Phí quản lý tháng 12/2025',
                moTa: 'Phí quản lý chung cư tháng 12/2025',
                loaiPhi: 'BAT_BUOC',
                phanLoaiPhi: 'CO_DINH',
                soTien: 350000,
                hanNop: new Date('2025-12-31')
            }
        });

        const khoanThu2 = await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Tiền điện tháng 12/2025',
                moTa: 'Tiền điện theo số đo công tơ',
                loaiPhi: 'BAT_BUOC',
                phanLoaiPhi: 'THEO_MUC_SU_DUNG',
                donGiaDichVu: 2500,
                donViTinh: 'kWh',
                nhaCungCap: 'EVN',
                hanNop: new Date('2025-12-25')
            }
        });

        const khoanThu3 = await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Phí đặc biệt tòa A',
                moTa: 'Phí dành riêng cho các căn hộ tòa A',
                loaiPhi: 'BAT_BUOC',
                phanLoaiPhi: 'CO_DINH',
                soTien: 200000,
                hanNop: new Date('2025-12-31')
            }
        });

        console.log('✅ Đã tạo 3 khoản thu test');

        // 4. Tạo nhiều lịch sử nộp tiền cho cả 3 hộ khẩu
        
        // Hộ khẩu 1 - Nộp phí quản lý
        await db.lichSuNopTien.create({
            data: {
                hoKhauId: hoKhau1.id,
                khoanThuId: khoanThu1.id,
                soTienDaNop: 350000,
                nguoiNop: 'Nguyễn Văn An',
                ghiChu: 'Nộp đầy đủ phí quản lý',
                ngayNop: new Date('2025-12-01')
            }
        });
        
        // Hộ khẩu 2 - Nộp phí quản lý
        await db.lichSuNopTien.create({
            data: {
                hoKhauId: hoKhau2.id,
                khoanThuId: khoanThu1.id,
                soTienDaNop: 350000,
                nguoiNop: 'Trần Thị Bình',
                ghiChu: 'Nộp qua chuyển khoản',
                ngayNop: new Date('2025-12-02')
            }
        });
        
        // Hộ khẩu 1 - Nộp tiền điện
        await db.lichSuNopTien.create({
            data: {
                hoKhauId: hoKhau1.id,
                khoanThuId: khoanThu2.id,
                soTienDaNop: 425000,
                nguoiNop: 'Nguyễn Văn An',
                ghiChu: '150 kWh x 2500 + 50k cố định',
                ngayNop: new Date('2025-12-03')
            }
        });
        
        // Hộ khẩu 3 - Nộp phí tòa A (không áp dụng vì ở tòa C)
        
        console.log('✅ Đã tạo nhiều lịch sử nộp tiền test');

        // 5. Tạo chi tiết sử dụng điện cho các hộ khẩu
        await db.chiTietSuDung.create({
            data: {
                hoKhauId: hoKhau1.id,
                khoanThuId: khoanThu2.id,
                chiSoCu: 1200,
                chiSoMoi: 1350,
                soLuongSuDung: 150,
                thanhTien: 425000
            }
        });
        
        await db.chiTietSuDung.create({
            data: {
                hoKhauId: hoKhau2.id,
                khoanThuId: khoanThu2.id,
                chiSoCu: 800,
                chiSoMoi: 920,
                soLuongSuDung: 120,
                thanhTien: 350000
            }
        });
        
        await db.chiTietSuDung.create({
            data: {
                hoKhauId: hoKhau3.id,
                khoanThuId: khoanThu2.id,
                chiSoCu: 1500,
                chiSoMoi: 1720,
                soLuongSuDung: 220,
                thanhTien: 600000
            }
        });
        
        console.log('✅ Đã tạo chi tiết sử dụng điện');

        console.log('🎉 Seeding hoàn tất với dữ liệu đầy đủ!');
        console.log('=== Tóm tắt dữ liệu đã tạo ===');
        console.log('- 1 admin user: admin/admin123');
        console.log('- 3 hộ khẩu với CCCD đầy đủ: BM-A1201, BM-B0503, BM-C1505');
        console.log('- 3 khoản thu: Phí quản lý, Tiền điện, Phí tòa A');
        console.log('- 3 lịch sử nộp tiền');
        console.log('- 3 chi tiết sử dụng điện');

    } catch (error) {
        console.error('❌ Lỗi seeding:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });