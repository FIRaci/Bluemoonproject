// Form validation utilities for household management

// Thêm event listener để validate CCCD khi người dùng nhập
document.addEventListener('DOMContentLoaded', function() {
    const cccdInputs = document.querySelectorAll('input[name="cccd"]');
    
    cccdInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = this.value;
            // Chỉ cho phép số
            this.value = value.replace(/[^0-9]/g, '');
            
            // Highlight nếu có lỗi
            if (value !== this.value) {
                this.style.borderColor = '#ef4444';
                this.style.backgroundColor = '#fef2f2';
                
                // Reset sau 2 giây
                setTimeout(() => {
                    this.style.borderColor = '';
                    this.style.backgroundColor = '';
                }, 2000);
            }
        });
        
        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value.length > 0 && (value.length < 9 || value.length > 12)) {
                this.style.borderColor = '#ef4444';
                this.title = 'CCCD/CMND phải có từ 9-12 chữ số';
            } else {
                this.style.borderColor = '';
                this.title = 'Chỉ nhập số, không nhập chữ cái hoặc ký tự đặc biệt';
            }
        });
    });
});
