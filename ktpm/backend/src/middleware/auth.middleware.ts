import { Elysia } from "elysia";
import type { Context } from "elysia";
import { jwt } from "@elysiajs/jwt";

// Type definition for authenticated user
export type AuthUser = {
  id: string;
  username: string;
  role: string;
};

// JWT Secret - MUST be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set! Please configure it in .env file.');
}
const ACTUAL_JWT_SECRET = JWT_SECRET;

// JWT Middleware - Base authentication
export const authMiddleware = new Elysia({ name: "auth" })
  .use(jwt({ name: "jwt", secret: ACTUAL_JWT_SECRET }))
  .macro(({ onBeforeHandle }) => ({
    isAuth(enabled: boolean) {
      if (!enabled) return;
      
      onBeforeHandle(async ({ jwt, headers, set }: any) => {
        console.log('🔐 Auth middleware checking...');
        
        const auth = headers["authorization"];
        console.log('📨 Authorization header:', auth ? 'Present' : 'Missing');
        
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

        if (!token) {
          console.error('❌ No token provided');
          set.status = 401;
          return {
            status: "error",
            message: "Chưa đăng nhập (Thiếu token)"
          };
        }

        console.log('🎫 Token found, verifying...');
        const profile = await jwt.verify(token);
        
        if (!profile) {
          console.error('❌ Token verification failed');
          set.status = 401;
          return {
            status: "error",
            message: "Token không hợp lệ hoặc đã hết hạn"
          };
        }

        console.log('✅ Token verified, profile:', profile);
        
        // Support both old (userId) and new (id) token formats
        const userId = (profile as any).id || (profile as any).userId;
        const username = (profile as any).username;
        const role = (profile as any).role || 'RESIDENT';
        
        (headers as any).user = { id: userId, username, role };
        console.log('👤 User injected into headers:', (headers as any).user);
      });
    }
  }));

// Admin-only middleware
export const adminMiddleware = new Elysia({ name: "admin" })
  .use(authMiddleware)
  .macro(({ onBeforeHandle }) => ({
    isAdmin(enabled: boolean) {
      if (!enabled) return;
      
      onBeforeHandle(({ headers, set }: any) => {
        const user = (headers as any).user;
        
        console.log('👮 Admin check for user:', user);
        
        if (!user || user.role !== "ADMIN") {
          console.error('❌ Not admin, role:', user?.role);
          set.status = 403;
          return {
            status: "error",
            message: "Chỉ Admin mới có quyền thực hiện thao tác này"
          };
        }
      });
    }
  }));
