import { db } from "@/utils/db";
import { t } from "elysia";

/**
 * DTO (Data Transfer Object) cho Đăng nhập
 */
export const loginDto = t.Object({
  username: t.String({
    minLength: 3,
    maxLength: 50,
    error: "Tên đăng nhập phải từ 3 đến 50 ký tự",
  }),
  password: t.String({
    minLength: 6,
    maxLength: 100,
    error: "Mật khẩu phải từ 6 đến 100 ký tự",
  }),
});

/**
 * DTO cho Đăng ký (Cư dân)
 */
export const registerDto = t.Object({
  username: t.String({
    pattern: "^BM-[A-Z][0-9]{4}$", // Format: BM-A1201
    error: "Username phải có format BM-[Tòa][Tầng Phòng]. VD: BM-A1201",
  }),
  password: t.String({
    minLength: 6,
    error: "Mật khẩu phải từ 6 ký tự trở lên",
  }),
});

/**
 * Hàm kiểm tra đăng nhập
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu (chưa hash)
 * @returns {Promise<Omit<User, 'password'>>} - Thông tin user (đã bỏ mật khẩu)
 * @throws {Error} - Ném lỗi nếu sai thông tin
 */
export async function validateUser(username: string, password: string) {
  // 1. Tìm user trong CSDL
  const user = await db.user.findUnique({
    where: { username },
  });

  // 2. Nếu không tìm thấy user
  if (!user) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  // 3. Kiểm tra mật khẩu (dùng Bun.password)
  const isMatch = await Bun.password.verify(password, user.password);

  // 4. Nếu mật khẩu sai
  if (!isMatch) {
    throw new Error("Tên đăng nhập hoặc mật khẩu không đúng.");
  }

  // 5. Nếu thành công, loại bỏ mật khẩu khỏi đối tượng trả về
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Hàm đăng ký tài khoản Cư dân
 * @param {string} username - Username format BM-A1201
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object>} - Thông tin user mới
 */
export async function registerResident(username: string, password: string) {
  // 1. Validate username phải có prefix BM-
  if (!username.startsWith("BM-")) {
    throw new Error("Username phải bắt đầu bằng BM-. VD: BM-A1201");
  }

  // 2. Username chính là mã căn hộ (BẮT BUỘC giữ nguyên BM-)
  const soCanHo = username; // VD: BM-A1201

  // 3. Kiểm tra hộ khẩu có tồn tại không (BẮT BUỘC phải có BM- trong database)
  const hoKhau = await db.hoKhau.findUnique({
    where: { soCanHo }, // Tìm căn hộ có mã BM-A1201
  });

  if (!hoKhau) {
    throw new Error(
      `Căn hộ ${soCanHo} không tồn tại trong hệ thống. Vui lòng liên hệ BQT.`
    );
  }

  // 3. Kiểm tra username đã được đăng ký chưa
  const existingUser = await db.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new Error("Tài khoản này đã được đăng ký.");
  }

  // 4. Hash mật khẩu
  const hashedPassword = await Bun.password.hash(password);

  // 5. Tạo tài khoản
  const newUser = await db.user.create({
    data: {
      username,
      password: hashedPassword,
      role: "RESIDENT",
      hoKhauId: hoKhau.id,
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * DTO cho thay đổi mật khẩu
 */
export const changePasswordDto = t.Object({
  currentPassword: t.String({
    minLength: 6,
    error: "Mật khẩu hiện tại phải từ 6 ký tự trở lên",
  }),
  newPassword: t.String({
    minLength: 6,
    error: "Mật khẩu mới phải từ 6 ký tự trở lên",
  }),
});

/**
 * Hàm thay đổi mật khẩu
 * @param {string} userId - ID của user
 * @param {string} currentPassword - Mật khẩu hiện tại
 * @param {string} newPassword - Mật khẩu mới
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  console.log('🔐 Starting password change for userId:', userId);
  
  // Basic validation
  if (!userId || !currentPassword || !newPassword) {
    console.error('❌ Missing required parameters');
    throw new Error("Thiếu thông tin bắt buộc để đổi mật khẩu.");
  }

  if (newPassword.length < 6) {
    console.error('❌ New password too short');
    throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
  }
  
  // 1. Lấy thông tin user
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error('❌ User not found:', userId);
    throw new Error("Không tìm thấy người dùng.");
  }

  console.log('✅ User found:', user.username);

  // 2. Kiểm tra mật khẩu hiện tại
  
  let isCurrentPasswordValid = false;
  
  // Try multiple verification methods
  try {
    // Method 1: Hash verification (bcrypt/argon2)
    if (user.password.startsWith('$2') || user.password.startsWith('$argon2')) {
      isCurrentPasswordValid = await Bun.password.verify(currentPassword, user.password);
      console.log('🔐 Hash verification result:', isCurrentPasswordValid);
    }
    
    // Method 2: Plain text comparison (fallback for fresh reset passwords)
    if (!isCurrentPasswordValid && user.password === currentPassword) {
      isCurrentPasswordValid = true;
      console.log('📝 Plain text match! Converting to hash...');
      // Convert to proper hash
      const hashedPassword = await Bun.password.hash(currentPassword);
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      console.log('✅ Password converted to hash format');
    }
    
    // Method 3: If DB has hash but verification failed, log detailed info
    if (!isCurrentPasswordValid) {
      console.log('⚠️ All verification methods failed');
      console.log('📋 Password length in DB:', user.password.length);
      console.log('📋 Current password length:', currentPassword.length);
    }
  } catch (verifyError) {
    console.error('❌ Password verification error:', verifyError);
    // Last resort: plain text comparison
    if (user.password === currentPassword) {
      isCurrentPasswordValid = true;
      console.log('📝 Fallback plain text match succeeded');
    }
  }
  
  if (!isCurrentPasswordValid) {
    console.error('❌ Current password verification failed for user:', user.username);
    throw new Error("Mật khẩu hiện tại không đúng.");
  }

  // 3. Kiểm tra mật khẩu mới không trùng với mật khẩu cũ
  let isSamePassword = false;
  try {
    isSamePassword = await Bun.password.verify(newPassword, user.password);
  } catch (compareError) {
    console.log('Password comparison error (likely different):', compareError instanceof Error ? compareError.message : String(compareError));
    // If verification fails, passwords are definitely different, which is good
    isSamePassword = false;
  }
  
  // Also check plain text comparison for edge cases
  if (!isSamePassword && newPassword === currentPassword) {
    isSamePassword = true;
  }
  
  if (isSamePassword) {
    throw new Error("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
  }

  // 4. Hash mật khẩu mới
  const hashedNewPassword = await Bun.password.hash(newPassword);

  // 5. Cập nhật mật khẩu
  await db.user.update({
    where: { id: userId },
    data: { password: hashedNewPassword },
  });

  return { message: "Đổi mật khẩu thành công." };
}

/**
 * Hàm lấy lại mật khẩu - Reset về mật khẩu mặc định
 * @param {string} soCanHo - Số căn hộ (VD: BM-A1201)
 * @param {string} cccd - Số CCCD/CMND của chủ hộ
 * @returns {Promise<{message: string, data?: any}>} - Kết quả xử lý
 * @throws {Error} - Ném lỗi nếu không tìm thấy thông tin
 */
export async function forgotPassword(soCanHo: string, cccd: string) {
  // 1. Tìm hộ khẩu theo số căn hộ
  const hoKhau = await db.hoKhau.findFirst({
    where: { soCanHo: soCanHo },
    include: { nhanKhaus: true }
  });

  if (!hoKhau) {
    throw new Error("Không tìm thấy căn hộ với số này.");
  }

  // 2. Kiểm tra CCCD có khớp với chủ hộ không
  const chuHo = hoKhau.nhanKhaus.find(nk => 
    nk.quanHeVoiChuHo === 'Chủ hộ' || nk.hoTen === hoKhau.tenChuHo
  );

  if (!chuHo || chuHo.cccd !== cccd) {
    throw new Error("CCCD không khớp với thông tin chủ hộ.");
  }

  // 3. Tìm user account liên kết với hộ khẩu này
  const user = await db.user.findFirst({
    where: { hoKhauId: hoKhau.id }
  });

  if (!user) {
    throw new Error("Không tìm thấy tài khoản liên kết với căn hộ này.");
  }

  // 4. Tạo mật khẩu mới ngẫu nhiên (dễ nhớ hơn)
  const newPassword = generateEasyPassword();
  const hashedPassword = await Bun.password.hash(newPassword);
  
  // 5. Cập nhật mật khẩu
  await db.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  // Log without exposing password
  console.log(`✅ Reset password for user ${user.username}`);

  // 6. Trả về mật khẩu mới (user cần ghi nhớ ngay)
  return {
    message: `Mật khẩu mới của bạn là: ${newPassword}`,
    data: {
      username: user.username,
      password: newPassword,
      note: "Hãy ghi nhớ mật khẩu này! Bạn nên đổi mật khẩu sau khi đăng nhập."
    }
  };
}

/**
 * Hàm tạo mật khẩu dễ nhớ
 * @returns {string} - Mật khẩu dễ nhớ
 */
function generateEasyPassword(): string {
  const words = ['blue', 'moon', 'home', 'safe', 'nice', 'good', 'cool', 'easy'];
  const numbers = ['123', '456', '789', '2024', '2025'];
  
  const word = words[Math.floor(Math.random() * words.length)] || 'blue';
  const number = numbers[Math.floor(Math.random() * numbers.length)] || '123';
  
  return word + number;
}

/**
 * Hàm tạo mật khẩu ngẫu nhiên (backup)
 * @returns {string} - Mật khẩu ngẫu nhiên 6 ký tự
 */
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}