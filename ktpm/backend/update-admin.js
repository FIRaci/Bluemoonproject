// UTILITY FILE - MANUAL EXECUTION ONLY
// Updates admin password hash - use with caution
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function updateAdmin() {
    try {
        // Hash mới cho admin123
        const newHash = '$2b$10$F8s0zvfYAaw9kCa1yR/ybeUQEg2.KAMDDz42QXv7iHsMAudrMBNaq';
        
        const updatedUser = await db.user.update({
            where: { username: 'admin' },
            data: { password: newHash }
        });
        
        console.log('✅ Đã cập nhật password cho admin');
        
        // Test ngay
        const testUser = await db.user.findUnique({
            where: { username: 'admin' }
        });
        console.log('📝 User admin:', { username: testUser.username, role: testUser.role });
        
    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await db.$disconnect();
    }
}

updateAdmin();