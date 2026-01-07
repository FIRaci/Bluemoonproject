// Final Check - Đảm bảo tất cả hoạt động sau khi fix lỗi
console.log('🔍 BlueMoon Final Check System');

// Wait for DOM helper
function waitForDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// 1. Kiểm tra global objects
waitForDOM(() => {
    console.log('✅ DOM đã sẵn sàng');
    
    // Check NotificationManager
    if (window.NotificationManager) {
        console.log('✅ NotificationManager đã load');
    } else {
        console.error('❌ NotificationManager chưa load');
    }
    
    // Check modal
    if (window.modal) {
        console.log('✅ Modal system đã load');
    } else {
        console.error('❌ Modal system chưa load');
    }
    
    // Check AuthUtils
    if (window.AuthUtils) {
        console.log('✅ AuthUtils đã load');
    } else {
        console.error('❌ AuthUtils chưa load');
    }
    
    // Check Chart.js
    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js đã load');
    } else {
        console.error('❌ Chart.js chưa load');
    }
    
    // Check API Config
    if (typeof API_URL !== 'undefined') {
        console.log('✅ API Config đã load:', API_URL);
    } else {
        console.error('❌ API Config chưa load');
    }
    
    console.log('🎯 Final Check hoàn thành!');
});