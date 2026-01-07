// Utility functions for authentication
window.AuthUtils = {
    // Lấy token từ localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Lấy thông tin user từ localStorage  
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    // Kiểm tra xem user đã đăng nhập chưa
    isLoggedIn() {
        return !!this.getToken();
    },

    // Đăng xuất - xóa tất cả dữ liệu và chuyển về trang login
    logout() {
        // Logging out user
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        
        // Thông báo cho main process (nếu là Electron app)
        if (window.electronAPI && window.electronAPI.logout) {
            window.electronAPI.logout();
        } else {
            // Nếu chạy trên web browser
            window.location.href = 'index.html';
        }
    },

    // Lấy headers cho API requests
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }
};

// Export cho CommonJS (nếu cần)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.AuthUtils;
}
