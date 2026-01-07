// Add this to resident.js to force token check on page load

(function() {
    console.log('🔍 Checking token format...');
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.log('❌ No token found, redirecting to login...');
        window.location.href = '/index.html';
        return;
    }
    
    try {
        // Decode JWT payload
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.error('❌ Invalid token format');
            localStorage.clear();
            window.location.href = '/index.html';
            return;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        console.log('🎫 Token payload:', payload);
        
        // Check if token has new format (id + role) or old format (userId)
        if (payload.userId && !payload.id) {
            console.warn('⚠️ OLD TOKEN FORMAT DETECTED! userId:', payload.userId);
            console.warn('⚠️ This token will cause 500 errors!');
            console.warn('⚠️ Clearing localStorage and redirecting to login...');
            
            // Show alert
            alert('Token cũ đã hết hạn! Vui lòng đăng nhập lại.');
            
            // Clear and redirect
            localStorage.clear();
            window.location.href = '/index.html';
            return;
        }
        
        if (payload.id && payload.username) {
            console.log('✅ Token format is correct:', {
                id: payload.id,
                username: payload.username,
                role: payload.role || 'N/A'
            });
        } else {
            console.error('❌ Token missing required fields');
            localStorage.clear();
            window.location.href = '/index.html';
        }
        
    } catch (e) {
        console.error('❌ Error parsing token:', e);
        localStorage.clear();
        window.location.href = '/index.html';
    }
})();
