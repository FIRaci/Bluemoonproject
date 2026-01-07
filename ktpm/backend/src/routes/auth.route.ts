import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { loginDto, validateUser, registerDto, registerResident, changePasswordDto, changePassword } from "@/services/auth.service";

/**
 * Định nghĩa các API route cho việc xác thực
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
  // Sử dụng plugin JWT, lấy bí mật từ file .env
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!, // Dấu ! để báo TS là ta biết nó chắc chắn tồn tại
      exp: "7d", // Token hết hạn sau 7 ngày
    })
  )
  // Định nghĩa API POST: /auth/login
  .post(
    "/login",
    async ({ body, jwt, set }) => {
      const { username, password } = body;

      try {
        // 1. Xác thực người dùng
        const user = await validateUser(username, password);

        // 2. Nếu xác thực thành công, tạo token
        const token = await jwt.sign({
          id: user.id,
          username: user.username,
          role: user.role,
        });

        // 3. Trả về token + user info cho client
        return {
          status: "success",
          message: "Đăng nhập thành công!",
          data: {
            token,
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
            },
          },
        };
      } catch (error: any) {
        // 4. Nếu xác thực thất bại
        set.status = 401; // Unauthorized
        return {
          status: "error",
          message: error.message || "Đăng nhập thất bại.",
        };
      }
    },
    {
      // Áp dụng validation DTO cho body
      body: loginDto,
      detail: {
        summary: "Đăng nhập",
        description: "Xác thực người dùng và trả về một JWT token.",
        tags: ["Auth"],
      },
    }
  )
  // Định nghĩa API POST: /auth/register (Đăng ký cho Cư dân)
  .post(
    "/register",
    async ({ body, set }) => {
      const { username, password } = body;

      try {
        // 1. Đăng ký tài khoản
        const user = await registerResident(username, password);

        // 2. Trả về kết quả
        return {
          status: "success",
          message: `Đăng ký thành công cho căn hộ ${user.username}!`,
          data: { user },
        };
      } catch (error: any) {
        // 3. Xử lý lỗi
        set.status = 400;
        return {
          status: "error",
          message: error.message || "Đăng ký thất bại.",
        };
      }
    },
    {
      body: registerDto,
      detail: {
        summary: "Đăng ký Cư dân",
        description: "Đăng ký tài khoản mới cho Cư dân (format: BM-A1201).",
        tags: ["Auth"],
      },
    }
  )
  // Định nghĩa API GET: /auth/verify (Xác thực token)
  .get(
    "/verify",
    async ({ jwt, set, headers }) => {
      try {
        // 1. Lấy token từ Authorization header
        const authorization = headers.authorization;
        if (!authorization || !authorization.startsWith('Bearer ')) {
          set.status = 401;
          return {
            status: "error",
            message: "Token không được cung cấp hoặc không hợp lệ.",
          };
        }

        const token = authorization.replace('Bearer ', '');

        // 2. Xác thực token
        const payload = await jwt.verify(token);
        if (!payload) {
          set.status = 401;
          return {
            status: "error",
            message: "Token không hợp lệ hoặc đã hết hạn.",
          };
        }

        // 3. Lấy thông tin user từ database
        // Support both old (userId) and new (id) token formats
        const { db } = await import("@/utils/db");
        const userId = (payload as any).id || (payload as any).userId;
        const user = await db.user.findUnique({
          where: { id: userId as string },
          select: {
            id: true,
            username: true,
            role: true,
            hoKhauId: true,
          },
        });

        if (!user) {
          set.status = 401;
          return {
            status: "error",
            message: "Người dùng không tồn tại.",
          };
        }

        // 4. Trả về thông tin user
        return {
          status: "success",
          message: "Token hợp lệ.",
          data: {
            user,
          },
        };
      } catch (error: any) {
        set.status = 401;
        return {
          status: "error",
          message: "Xác thực token thất bại.",
        };
      }
    },
    {
      detail: {
        summary: "Xác thực Token",
        description: "Kiểm tra tính hợp lệ của JWT token và trả về thông tin người dùng.",
        tags: ["Auth"],
      },
    }
  )
  // Định nghĩa API POST: /auth/change-password (Đổi mật khẩu)
  .post(
    "/change-password",
    async ({ body, jwt, set, headers }) => {
      try {
        console.log('🔐 Change password request received');
        console.log('📦 Body:', body);
        
        // 1. Lấy token từ Authorization header
        const authorization = headers.authorization;
        if (!authorization || !authorization.startsWith('Bearer ')) {
          console.error('❌ No authorization header or invalid format');
          set.status = 401;
          return {
            status: "error",
            message: "Token không được cung cấp.",
          };
        }

        const token = authorization.replace('Bearer ', '');
        console.log('🎫 Token extracted');

        // 2. Xác thực token
        const payload = await jwt.verify(token);
        if (!payload) {
          console.error('❌ Token verification failed');
          set.status = 401;
          return {
            status: "error",
            message: "Token không hợp lệ hoặc đã hết hạn.",
          };
        }

        console.log('✅ JWT payload verified:', payload);

        // 3. Check if token has old format (userId instead of id)
        const userId = (payload as any).id || (payload as any).userId;
        if (!userId) {
          console.error('❌ No user ID in token payload');
          set.status = 401;
          return {
            status: "error",
            message: "Token không hợp lệ. Vui lòng đăng nhập lại.",
          };
        }

        // 4. Validate body
        const { currentPassword, newPassword, confirmPassword } = body as any;
        
        console.log('📝 Password fields check:', {
          hasCurrentPassword: !!currentPassword,
          hasNewPassword: !!newPassword,
          hasConfirmPassword: !!confirmPassword
        });
        
        if (!currentPassword || !newPassword) {
          console.error('❌ Missing password fields');
          set.status = 400;
          return {
            status: "error",
            message: "Vui lòng cung cấp đầy đủ mật khẩu hiện tại và mật khẩu mới.",
          };
        }

        // 5. Thay đổi mật khẩu
        console.log('🔄 Calling changePassword for user:', userId);
        const result = await changePassword(userId, currentPassword, newPassword);

        // Password changed successfully
        return {
          status: "success",
          message: result.message,
        };
      } catch (error: any) {
        // Change password error occurred
        set.status = 400;
        return {
          status: "error",
          message: error.message || "Đổi mật khẩu thất bại.",
        };
      }
    },
    {
      body: changePasswordDto,
      detail: {
        summary: "Đổi mật khẩu",
        description: "Thay đổi mật khẩu của người dùng (yêu cầu mật khẩu hiện tại).",
        tags: ["Auth"],
      },
    }
  )
  
  // Định nghĩa API POST: /auth/forgot-password (Quên mật khẩu)
  .post(
    "/forgot-password",
    async ({ body, set }) => {
      try {
        const { soCanHo, cccd } = body as any;

        if (!soCanHo || !cccd) {
          set.status = 400;
          return {
            status: "error",
            message: "Vui lòng cung cấp số căn hộ và CCCD.",
          };
        }

        // Import forgotPassword function
        const { forgotPassword } = await import("@/services/auth.service");
        
        // Process forgot password
        const result = await forgotPassword(soCanHo, cccd);

        return {
          status: "success",
          message: result.message,
          data: result.data || null,
        };
      } catch (error: any) {
        set.status = 400;
        return {
          status: "error",
          message: error.message || "Không thể lấy lại mật khẩu.",
        };
      }
    }
  );