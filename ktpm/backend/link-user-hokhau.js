// UTILITY FILE - MANUAL EXECUTION ONLY
// Links user to household - use with caution
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function linkUserToHoKhau() {
    try {
        // Tìm user BM-A1201 và hộ khẩu tương ứng
        const user = await db.user.findUnique({
            where: { username: 'BM-A1201' }
        });
        
        const hoKhau = await db.hoKhau.findUnique({
            where: { soCanHo: 'BM-A1201' }
        });
        
        if (user && hoKhau) {
            // Cập nhật user với hoKhauId
            await db.user.update({
                where: { username: 'BM-A1201' },
                data: { hoKhauId: hoKhau.id }
            });
            
            console.log('✅ Đã liên kết user BM-A1201 với hộ khẩu');
            console.log('📝 User:', user.username);
            console.log('🏠 Hộ khẩu:', hoKhau.soCanHo, '-', hoKhau.tenChuHo);
        } else {
            console.log('❌ Không tìm thấy user hoặc hộ khẩu');
        }
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await db.$disconnect();
    }
}

linkUserToHoKhau();