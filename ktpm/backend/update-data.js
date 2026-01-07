// UTILITY FILE - MANUAL EXECUTION ONLY
// Updates database schema/data - use with caution
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateData() {
  try {
    console.log('🔍 Checking for THEO_VI_TRI records...');
    
    const existingRecords = await prisma.khoanThu.findMany({
      where: { phanLoaiPhi: 'THEO_VI_TRI' },
      select: { id: true, tenKhoanThu: true, phanLoaiPhi: true }
    });
    
    console.log(`Found ${existingRecords.length} records with THEO_VI_TRI`);
    
    if (existingRecords.length > 0) {
      console.log('📝 Records to be updated:');
      existingRecords.forEach(record => {
        console.log(`  - ${record.tenKhoanThu} (${record.id})`);
      });
      
      const result = await prisma.khoanThu.updateMany({
        where: { phanLoaiPhi: 'THEO_VI_TRI' },
        data: { phanLoaiPhi: 'CO_DINH' }
      });
      
      console.log(`✅ Successfully updated ${result.count} records`);
    } else {
      console.log('✅ No THEO_VI_TRI records found, safe to migrate');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

updateData();