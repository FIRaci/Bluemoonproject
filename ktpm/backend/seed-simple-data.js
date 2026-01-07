// UTILITY FILE - MANUAL EXECUTION ONLY
// This file contains seed data logic but should not be auto-executed
// Use with caution and only when needed

/*
// COMMENTED OUT TO PREVENT ACCIDENTAL EXECUTION
console.log('🌱 Seeding simple demo data...');

import { db } from "./src/utils/db.js";

async function seedData() {
    try {
        console.log('➕ Adding demo households...');
        
        // 1. Thêm hộ khẩu
        const hoKhau1 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-A0101',
                tenChuHo: 'Nguyễn Văn A',
                soDienThoai: '0987654321',
                dienTich: 75
            }
        });
        
        const hoKhau2 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-B0203',
                tenChuHo: 'Trần Thị B',
                soDienThoai: '0912345678',
                dienTich: 85
            }
        });
        
        const hoKhau3 = await db.hoKhau.create({
            data: {
                soCanHo: 'BM-C0305',
                tenChuHo: 'Lê Văn C',
                soDienThoai: '0909123456',
                dienTich: 65
            }
        });
        
        console.log('✅ Added 3 households');
        
        // 2. Thêm nhân khẩu
        await db.nhanKhau.create({
            data: {
                hoTen: 'Nguyễn Văn A',
                cccd: '001234567890',
                ngaySinh: new Date('1985-05-15'),
                gioiTinh: 'Nam',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau1.id
            }
        });
        
        await db.nhanKhau.create({
            data: {
                hoTen: 'Nguyễn Thị D',
                cccd: '001234567891',
                ngaySinh: new Date('1987-08-20'),
                gioiTinh: 'Nữ',
                quanHeVoiChuHo: 'Vợ',
                hoKhauId: hoKhau1.id
            }
        });
        
        await db.nhanKhau.create({
            data: {
                hoTen: 'Trần Thị B',
                cccd: '002234567890',
                ngaySinh: new Date('1990-03-10'),
                gioiTinh: 'Nữ',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau2.id
            }
        });
        
        await db.nhanKhau.create({
            data: {
                hoTen: 'Lê Văn C',
                cccd: '003234567890',
                ngaySinh: new Date('1982-12-25'),
                gioiTinh: 'Nam',
                quanHeVoiChuHo: 'Chủ hộ',
                hoKhauId: hoKhau3.id
            }
        });
        
        console.log('✅ Added 4 residents');
        
        // 3. Thêm khoản thu đơn giản
        await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Phí dịch vụ tháng 11/2025',
                moTa: 'Phí dịch vụ chung cư tháng 11',
                loaiPhi: 'BAT_BUOC',
                soTien: 500000,
                hanNop: new Date('2025-11-30')
            }
        });
        
        await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Phí quản lý tháng 11/2025',
                moTa: 'Phí quản lý chung cư',
                loaiPhi: 'BAT_BUOC',
                soTien: 300000,
                hanNop: new Date('2025-11-30')
            }
        });
        
        await db.khoanThu.create({
            data: {
                tenKhoanThu: 'Phí gửi xe tháng 11/2025',
                moTa: 'Phí gửi xe ô tô và xe máy',
                loaiPhi: 'BAT_BUOC',
                soTien: 200000,
                hanNop: new Date('2025-11-30')
            }
        });
        
        console.log('✅ Added 3 fees');
        
        // 4. Thống kê
        const stats = {
            users: await db.user.count(),
            hoKhau: await db.hoKhau.count(),
            nhanKhau: await db.nhanKhau.count(),
            khoanThu: await db.khoanThu.count()
        };
        
        console.log('\n📊 Demo data seeded successfully!');
        console.log('Stats:', stats);
        
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await db.$disconnect();
    }
}

// seedData(); // DISABLED
*/