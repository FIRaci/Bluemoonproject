// DANGER UTILITY FILE - MANUAL EXECUTION ONLY
// This script DELETES ALL DATA - use with extreme caution
// Only run when you want to completely reset the database
console.log('⚠️  DANGER: This will reset the entire database!');
console.log('🔄 Resetting database...');

import { db } from "./src/utils/db.js";

async function resetDatabase() {
    try {
        console.log('⚠️  Deleting all data...');
        
        // 1. Xóa tất cả dữ liệu theo thứ tự (foreign key constraints)
        await db.chiTietSuDung.deleteMany({});
        console.log('✅ Deleted ChiTietSuDung');
        
        await db.lichSuNopTien.deleteMany({});
        console.log('✅ Deleted LichSuNopTien');
        
        await db.khoanThu.deleteMany({});
        console.log('✅ Deleted KhoanThu');
        
        await db.nhanKhau.deleteMany({});
        console.log('✅ Deleted NhanKhau');
        
        await db.hoKhau.deleteMany({});
        console.log('✅ Deleted HoKhau');
        
        // Xóa tất cả users trừ admin
        await db.user.deleteMany({
            where: {
                username: {
                    not: 'admin'
                }
            }
        });
        console.log('✅ Deleted all users except admin');
        
        // 2. Đảm bảo admin account tồn tại
        const adminExists = await db.user.findUnique({
            where: { username: 'admin' }
        });
        
        if (!adminExists) {
            console.log('➕ Creating admin account...');
            const hashedPassword = await Bun.password.hash('admin123');
            await db.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    role: 'ADMIN'
                }
            });
            console.log('✅ Admin account created');
        } else {
            console.log('✅ Admin account exists');
        }
        
        // 3. Thống kê
        const stats = {
            users: await db.user.count(),
            hoKhau: await db.hoKhau.count(),
            nhanKhau: await db.nhanKhau.count(),
            khoanThu: await db.khoanThu.count(),
            lichSuNopTien: await db.lichSuNopTien.count()
        };
        
        console.log('\n📊 Database reset complete!');
        console.log('Current state:', stats);
        console.log('\n👤 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        
    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await db.$disconnect();
    }
}

resetDatabase();