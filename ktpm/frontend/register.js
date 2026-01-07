// Register Page JavaScript
const API_URL = window.AppConfig.API_URL;

// DOM Elements
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const registerBtn = document.getElementById('registerBtn');
const registerText = document.getElementById('registerText');
const registerSpinner = document.getElementById('registerSpinner');
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Toggle password visibility
togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update eye icon
    const eyeIcon = document.getElementById('eyeIcon');
    if (type === 'text') {
        eyeIcon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        `;
    } else {
        eyeIcon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
    }
});

// Show error message
function showError(message) {
    const errorText = document.getElementById('errorText');
    if (errorText) errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    successMessage.classList.add('hidden');
}

// Show success message
function showSuccess(message) {
    const successText = document.getElementById('successText');
    if (successText) successText.textContent = message;
    successMessage.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

// Hide messages
function hideMessages() {
    errorMessage.classList.add('hidden');
    successMessage.classList.add('hidden');
}

// Show loading state
function showLoading() {
    registerText.textContent = 'Đang đăng ký...';
    registerSpinner.classList.remove('hidden');
    registerBtn.disabled = true;
}

// Hide loading state
function hideLoading() {
    registerText.textContent = 'Đăng ký';
    registerSpinner.classList.add('hidden');
    registerBtn.disabled = false;
}

// Validate username format
function validateUsername(username) {
    const pattern = /^BM-[A-Z][0-9]{4}$/;
    return pattern.test(username);
}

// Handle form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    
    // Get form data
    const formData = new FormData(registerForm);
    const usernameInput = formData.get('username').trim().toUpperCase();
    const username = 'BM-' + usernameInput; // Add BM- prefix
    const password = formData.get('password');

    // Basic validation
    if (!usernameInput || !password) {
        showError('Vui lòng điền đầy đủ thông tin.');
        return;
    }

    if (!validateUsername(username)) {
        showError('Mã căn hộ phải có định dạng BM-[Tòa][Tầng Phòng]. Ví dụ: BM-A1201');
        return;
    }

    if (password.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }

    showLoading();

    try {
        // Call register API
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            showSuccess(`${data.message} Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...`);
            
            // Reset form
            registerForm.reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            showError(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    } catch (error) {
        console.error('Register error:', error);
        showError('Có lỗi xảy ra khi kết nối đến server. Vui lòng thử lại.');
    } finally {
        hideLoading();
    }
});

// Auto-format username input (only the part after BM-)
document.getElementById('username').addEventListener('input', (e) => {
    let value = e.target.value.toUpperCase();
    
    // Remove any characters that are not letters or numbers
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Limit to X9999 format (1 letter + 4 digits)
    if (value.length > 5) {
        value = value.substring(0, 5);
    }
    
    // Auto-format: first character must be letter, rest numbers
    if (value.length > 1) {
        const firstChar = value.charAt(0);
        const restChars = value.substring(1).replace(/[^0-9]/g, ''); // Only numbers
        value = firstChar + restChars;
    }
    
    e.target.value = value;
});

// Auto-focus on username field when page loads
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('username').focus();
});
