import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function checkData() {
  console.log('=== CHECKING DATABASE ===\n');
  
  // Check users
  const users = await db.user.findMany({
    include: { hoKhau: true }
  });
  console.log('Users found:', users.length);
  users.forEach(u => {
    console.log(`- ${u.username} (${u.role}) -> ${u.hoKhau?.soCanHo || 'No apartment'}`);
  });
  
  // Check hokhau
  const hoKhau = await db.hoKhau.findMany();
  console.log('\nHoKhau found:', hoKhau.length);
  
  // Check khoanthu
  const khoanThu = await db.khoanThu.findMany();
  console.log('KhoanThu found:', khoanThu.length);
  
  await db.$disconnect();
}

checkData();
