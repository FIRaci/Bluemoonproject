// frontend/thongke.js

const API_URL = window.AppConfig.API_URL;
const token = localStorage.getItem('token');

// Auth guard - redirect to login if no token
if (!token) {
    window.location.href = 'index.html';
}

const selectKhoanThu = document.getElementById('selectKhoanThu');
const reportResult = document.getElementById('reportResult');
const reportTableBody = document.getElementById('reportTableBody');
let myPieChart = null; // Biến giữ biểu đồ để destroy khi vẽ lại
let isSetupComplete = false; // Flag để tránh duplicate setup

// Setup user info and logout handler
function setupUserInfo() {
    if (isSetupComplete) {
        console.log('ThongKe setup already completed, skipping...');
        return;
    }
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (userInfo && userInfo.username) {
        const displayUsername = document.getElementById('displayUsername');
        const userAvatar = document.getElementById('userAvatar');
        
        if (displayUsername) displayUsername.textContent = userInfo.username;
        if (userAvatar) userAvatar.textContent = userInfo.username.charAt(0).toUpperCase();
    }
    
    // Setup logout handler (remove any existing listeners first)
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        // Remove any existing logout listeners
        const newBtn = btnLogout.cloneNode(true);
        btnLogout.parentNode.replaceChild(newBtn, btnLogout);
        
        // Add fresh event listener
        newBtn.addEventListener('click', () => {
            console.log('Logout clicked in thongke page');
            modal.confirm({
                title: 'Xác nhận đăng xuất',
                message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
                confirmText: 'Đăng xuất',
                cancelText: 'Hủy',
                confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
                onConfirm: () => {
                    AuthUtils.logout();
                }
            });
        });
    }
    
    isSetupComplete = true;
    console.log('ThongKe setup completed');
}

// Setup when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('selectKhoanThu')) {
        console.log('ThongKe page detected, initializing...');
        setupUserInfo();
        loadKhoanThuOptions();
    }
});

// Also try immediate setup in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    setTimeout(() => {
        if (document.getElementById('selectKhoanThu')) {
            setupUserInfo();
            loadKhoanThuOptions();
        }
    }, 100);
}

// 1. Load danh sách khoản thu vào Dropdown
async function loadKhoanThuOptions() {
    try {
        const response = await fetch(`${API_URL}/khoanthu`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            selectKhoanThu.innerHTML = '<option value="">-- Chọn khoản thu --</option>' + 
                data.data.map(k => `<option value="${k.id}">${k.tenKhoanThu} (${k.loaiPhi})</option>`).join('');
        }
    } catch (e) { console.error(e); }
}

// 2. Xem báo cáo chi tiết
window.viewReport = async () => {
    const id = selectKhoanThu.value;
    if (!id) {
        modal.alert({ title: 'Lỗi', message: 'Vui lòng chọn một khoản thu!', type: 'warning' });
        return;
    }

    try {
        const response = await fetch(`${API_URL}/thongke/${id}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const result = await response.json();

        if (result.status === 'success') {
            const data = result.data;
            
            // Hiển thị vùng kết quả
            reportResult.classList.remove('hidden');

            // Cập nhật thẻ số liệu
            const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
            document.getElementById('reportTongTien').textContent = formatter.format(data.tongTienDaThu);
            document.getElementById('reportDaNop').textContent = data.soHoDaNop;
            document.getElementById('reportChuaNop').textContent = data.soHoChuaNop;

            // Vẽ biểu đồ tròn
            renderPieChart(data.soHoDaNop, data.soHoChuaNop);

            // Render bảng danh sách đã nộp
            renderDetailTable(data.danhSachDaNop);
            
            // Render bảng danh sách chưa nộp (với highlight đỏ nếu quá hạn)
            renderUnpaidTable(data.danhSachChuaNop, data.khoanThu?.hanNop);
        } else {
            modal.alert({ title: 'Lỗi', message: result.message || 'Lỗi tải dữ liệu', type: 'error' });
        }

    } catch (error) {
        console.error(error);
        modal.alert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến server', type: 'error' });
    }
};

function renderPieChart(daNop, chuaNop) {
    const ctx = document.getElementById('completionChart').getContext('2d');
    
    // Nếu biểu đồ cũ tồn tại thì hủy trước khi vẽ mới
    if (myPieChart) {
        myPieChart.destroy();
    }

    myPieChart = new Chart(ctx, {
        type: 'doughnut', // Biểu đồ vành khuyên
        data: {
            labels: ['Đã nộp', 'Chưa nộp'],
            datasets: [{
                data: [daNop, chuaNop],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)', // Green-500
                    'rgba(239, 68, 68, 0.8)'  // Red-500
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

function renderDetailTable(list) {
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

    if (list.length === 0) {
        reportTableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">
            <div class="py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p class="text-lg font-medium">Chưa có dữ liệu nộp tiền</p>
                <p class="text-sm text-gray-400 mt-2">Chưa có hộ gia đình nào nộp tiền cho khoản thu này</p>
            </div>
        </td></tr>`;
        return;
    }

    reportTableBody.innerHTML = list.map(item => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.hoKhau?.soCanHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.hoKhau?.tenChuHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${formatter.format(item.soTienDaNop)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${new Date(item.ngayNop).toLocaleString('vi-VN')}</td>
        </tr>
    `).join('');
}

// Render bảng danh sách chưa nộp với highlight đỏ nếu quá hạn
function renderUnpaidTable(list, hanNop) {
    const unpaidTableBody = document.getElementById('unpaidTableBody');
    if (!unpaidTableBody) {
        console.warn('unpaidTableBody element not found');
        return;
    }
    
    const now = new Date();
    const isOverdue = hanNop && new Date(hanNop) < now;

    if (!list || list.length === 0) {
        unpaidTableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-green-500">
            <div class="py-4">
                <svg class="mx-auto h-8 w-8 text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Tất cả hộ gia đình đã nộp tiền!</p>
            </div>
        </td></tr>`;
        return;
    }

    unpaidTableBody.innerHTML = list.map(item => `
        <tr class="${isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-900'}">${item.soCanHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500'}">${item.tenChuHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-right">
                ${isOverdue 
                    ? '<span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">⚠️ Quá hạn</span>' 
                    : '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Chưa nộp</span>'}
            </td>
        </tr>
    `).join('');
}
