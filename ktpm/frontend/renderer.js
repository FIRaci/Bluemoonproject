// renderer.js - Xử lý logic cho giao diện Electron

const loginForm = document.getElementById('loginForm');
const btnLogin = document.getElementById('btnLogin');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingIcon = document.getElementById('loadingIcon');

// Forgot Password elements
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const cancelForgotPassword = document.getElementById('cancelForgotPassword');
const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');
const forgotPasswordText = document.getElementById('forgotPasswordText');
const forgotPasswordLoading = document.getElementById('forgotPasswordLoading');

// URL của Backend API (lấy từ config.js)
const API_URL = window.AppConfig.API_URL;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Ngăn form reload lại trang

    // 1. Lấy dữ liệu từ form
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // 2. Hiển thị trạng thái loading
    setLoading(true);
    hideError();

    try {
        // 3. Gửi request đăng nhập lên Backend
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ username, password }),
            mode: 'cors'
        });
        
        const data = await response.json();

        if (response.ok && data.status === 'success') {
            // 4. Đăng nhập thành công
            console.log(' Login successful:', data);
            
            // Lưu token vào localStorage để dùng cho các request sau này
            const token = data.data.token;
            const userInfo = data.data.user;
            
            localStorage.setItem('token', token);
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
            
            // Debug: verify token was saved
            console.log(' Token saved:', token);
            console.log(' UserInfo saved:', userInfo);
            console.log(' Token from localStorage:', localStorage.getItem('token'));

            // Route theo role
            if (userInfo.role === 'ADMIN') {
                console.log(' Redirecting to dashboard...');
                window.location.href = 'dashboard.html';
            } else if (userInfo.role === 'RESIDENT') {
                console.log(' Redirecting to resident...');
                window.location.href = 'resident.html';
            } else {
                console.error(' Invalid role:', userInfo.role);
                showError('Role không hợp lệ');
            }
        } else {
            // 5. Đăng nhập thất bại
            showError(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
        }

    } catch (error) {
        console.error('Login error:', error.name, error.message);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showError('Không thể kết nối đến server. Kiểm tra backend có chạy không?');
        } else {
            showError(`Lỗi: ${error.message}`);
        }
    } finally {
        setLoading(false);
    }
});

// Hàm tiện ích: Hiển thị loading
function setLoading(isLoading) {
    if (isLoading) {
        btnLogin.disabled = true;
        loadingIcon.classList.remove('hidden');
        btnLogin.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnLogin.disabled = false;
        loadingIcon.classList.add('hidden');
        btnLogin.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}

// Hàm tiện ích: Hiển thị lỗi
function showError(message) {
    errorMessage.classList.remove('hidden');
    errorText.textContent = message;
    // Rung nhẹ form để gây chú ý (tùy chọn)
    loginForm.classList.add('animate-pulse');
    setTimeout(() => loginForm.classList.remove('animate-pulse'), 500);
}

// Hàm tiện ích: Ẩn lỗi
function hideError() {
    errorMessage.classList.add('hidden');
}



// Hàm hiển thị form login
function showLoginForm() {
    document.getElementById('authLoading').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'block';
}

// Hàm chuyển trang mượt mà
function smoothRedirect(url) {
    // Hiện loading text
    const loadingText = document.querySelector('#authLoading p');
    if (loadingText) {
        loadingText.textContent = 'Đang chuyển hướng...';
    }
    
    // Fade out effect
    document.body.style.opacity = '0.8';
    document.body.style.transition = 'opacity 0.2s ease';
    
    // Redirect ngay lập tức để giảm delay
    setTimeout(() => {
        window.location.href = url;
    }, 100);
}

// Script hoạt động khi DOM đã load xong
document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra token hiện tại
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('userInfo');
    
    // Nếu có token và userInfo, thử redirect ngay lập tức
    if (token && userInfo) {
        try {
            const user = JSON.parse(userInfo);
            console.log('🚀 Quick redirect attempt for user:', user.username);
            
            // Redirect ngay, sau đó validate ở background
            if (user.role === 'ADMIN') {
                smoothRedirect('dashboard.html');
                return;
            } else if (user.role === 'RESIDENT') {
                smoothRedirect('resident.html');
                return;
            }
        } catch (e) {
            console.log('❌ Invalid userInfo, will validate token');
        }
    }
    
    if (token) {
        console.log('🔍 Token found, validating...');
        
        try {
            // Xác thực token với backend với timeout ngắn
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // Tăng timeout lên 3s
            
            const response = await fetch(`${API_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                signal: controller.signal,
                mode: 'cors'  // Explicitly set CORS mode
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                try {
                    const data = await response.json();
                    if (data.status === 'success') {
                        console.log('✅ Token valid, redirecting...');
                        const userInfo = data.data.user;
                        localStorage.setItem('userInfo', JSON.stringify(userInfo));
                        
                        // Redirect ngay lập tức, không hiện login form
                        if (userInfo.role === 'ADMIN') {
                            console.log('🎯 Redirecting to admin dashboard');
                            smoothRedirect('dashboard.html');
                        } else if (userInfo.role === 'RESIDENT') {
                            console.log('🏠 Redirecting to resident portal');
                            smoothRedirect('resident.html');
                        }
                        return;
                    }
                } catch (jsonError) {
                    console.log('❌ Failed to parse response JSON:', jsonError);
                    const text = await response.text();
                    console.log('Response body:', text.substring(0, 200));
                }
            } else {
                console.log('❌ Response not ok:', response.status, response.statusText);
            }
            
            // Token không hợp lệ hoặc có lỗi
            console.log('❌ Token invalid, showing login');
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            
        } catch (error) {
            console.log('❌ Token check failed:', error.name, error.message);
            if (error.name === 'AbortError') {
                console.log('⏱️ Request timeout - backend might be slow');
            }
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
        }
    }
    
    // Hiển thị form login nếu không có token hợp lệ
    console.log('📝 Showing login form');
    showLoginForm();
});

// Forgot Password functionality
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordModal();
});

cancelForgotPassword.addEventListener('click', () => {
    hideForgotPasswordModal();
});

// Close modal when clicking outside
forgotPasswordModal.addEventListener('click', (e) => {
    if (e.target === forgotPasswordModal) {
        hideForgotPasswordModal();
    }
});

// Forgot Password form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const apartmentCode = document.getElementById('apartmentCode').value.trim();
    const cccd = document.getElementById('cccd').value.trim();
    
    if (!apartmentCode || !cccd) {
        showForgotPasswordMessage('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }
    
    setForgotPasswordLoading(true);
    hideForgotPasswordMessage();
    
    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ 
                soCanHo: apartmentCode,
                cccd: cccd 
            }),
            mode: 'cors'
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showForgotPasswordMessage(data.message || 'Mật khẩu mới đã được gửi!', 'success');
            // Reset form after 1 minute (60 seconds)
            setTimeout(() => {
                hideForgotPasswordModal();
                resetForgotPasswordForm();
            }, 60000);
        } else {
            showForgotPasswordMessage(data.message || 'Không tìm thấy thông tin phù hợp', 'error');
        }
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showForgotPasswordMessage('Không thể kết nối đến server. Vui lòng thử lại!', 'error');
    } finally {
        setForgotPasswordLoading(false);
    }
});

// Utility functions for forgot password
function showForgotPasswordModal() {
    forgotPasswordModal.classList.remove('hidden');
    resetForgotPasswordForm();
}

function hideForgotPasswordModal() {
    forgotPasswordModal.classList.add('hidden');
    resetForgotPasswordForm();
}

function resetForgotPasswordForm() {
    forgotPasswordForm.reset();
    hideForgotPasswordMessage();
    setForgotPasswordLoading(false);
}

function showForgotPasswordMessage(message, type = 'info') {
    forgotPasswordText.textContent = message;
    forgotPasswordMessage.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'bg-green-50', 'text-green-600', 'bg-blue-50', 'text-blue-600');
    
    if (type === 'error') {
        forgotPasswordMessage.classList.add('bg-red-50', 'text-red-600');
    } else if (type === 'success') {
        forgotPasswordMessage.classList.add('bg-green-50', 'text-green-600');
    } else {
        forgotPasswordMessage.classList.add('bg-blue-50', 'text-blue-600');
    }
}

function hideForgotPasswordMessage() {
    forgotPasswordMessage.classList.add('hidden');
}

function setForgotPasswordLoading(loading) {
    const submitBtn = document.getElementById('submitForgotPassword');
    if (loading) {
        submitBtn.disabled = true;
        forgotPasswordLoading.classList.remove('hidden');
        submitBtn.textContent = '';
        submitBtn.appendChild(document.createTextNode('Đang xử lý...'));
        submitBtn.appendChild(forgotPasswordLoading);
    } else {
        submitBtn.disabled = false;
        forgotPasswordLoading.classList.add('hidden');
        submitBtn.textContent = 'Lấy lại';
    }
}