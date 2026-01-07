// Cấu hình chung cho toàn bộ Frontend
// Chạy 100% LOCAL - không cần ngrok

// Luôn dùng localhost cho tất cả môi trường
const BASE_URL = 'http://localhost:3000';

// Export ra toàn cục để các file khác dùng
window.AppConfig = {
    API_URL: BASE_URL,
    IS_DEV: true,
    IS_ELECTRON: true
};

// Configuration loaded - LOCAL MODE
