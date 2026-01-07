// frontend/nhankhau.js

const API_URL = window.AppConfig.API_URL;
const token = localStorage.getItem('token');

// Auth guard - redirect to login if no token
if (!token) {
    window.location.href = 'index.html';
}

const nkTableBody = document.getElementById('nhanKhauTableBody');
const nkModal = document.getElementById('addModal');
const nkForm = document.getElementById('addNhanKhauForm');
const selectHoKhau = document.getElementById('selectHoKhau');
const searchInput = document.getElementById('searchInput');
let allNhanKhauData = [];
let isNhanKhauSetupComplete = false; // Flag để tránh duplicate setup

// Setup user info and logout handler
function setupUserInfo() {
    if (isNhanKhauSetupComplete) {
        console.log('NhanKhau setup already completed, skipping...');
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
            console.log('Logout clicked in nhankhau page');
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
    
    isNhanKhauSetupComplete = true;
    console.log('NhanKhau setup completed');
}

// 1. Lấy danh sách Nhân khẩu
async function fetchNhanKhauList() {
    try {
        const response = await fetch(`${API_URL}/nhankhau`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const data = await response.json();

        if (data.status === 'success') {
            allNhanKhauData = data.data;
            renderNhanKhauTable(allNhanKhauData);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        nkTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">
            <div class="py-8">
                <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium text-red-600">Lỗi kết nối</p>
                <p class="text-sm text-red-400 mt-2">Không thể tải dữ liệu nhân khẩu. Vui lòng thử lại sau.</p>
            </div>
        </td></tr>`;
    }
}

// 1.5. Hàm tìm kiếm
function handleSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    
    if (!keyword) {
        renderNhanKhauTable(allNhanKhauData);
        return;
    }
    
    const filtered = allNhanKhauData.filter(item => 
        item.hoTen.toLowerCase().includes(keyword) ||
        (item.cccd && item.cccd.includes(keyword)) ||
        (item.gioiTinh && item.gioiTinh.toLowerCase().includes(keyword)) ||
        (item.hoKhau?.soCanHo && item.hoKhau.soCanHo.toLowerCase().includes(keyword))
    );
    
    renderNhanKhauTable(filtered);
}

if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

// Setup when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('nhanKhauTableBody')) {
        console.log('NhanKhau page detected, initializing...');
        setupUserInfo();
        fetchNhanKhauList();
        fetchHoKhauOptions();
    }
});

// Also try immediate setup in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    setTimeout(() => {
        if (document.getElementById('nhanKhauTableBody')) {
            setupUserInfo();
            fetchNhanKhauList();
            fetchHoKhauOptions();
        }
    }, 100);
}

function renderNhanKhauTable(list) {
    if (list.length === 0) {
        nkTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">
            <div class="py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p class="text-lg font-medium">Chưa có nhân khẩu nào</p>
                <p class="text-sm text-gray-400 mt-2">Hãy bắt đầu bằng cách thêm nhân khẩu đầu tiên</p>
            </div>
        </td></tr>`;
        return;
    }

    nkTableBody.innerHTML = list.map(item => `
        <tr class="hover:bg-gray-50 cursor-pointer" onclick="viewNhanKhauDetail('${item.id}')">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.hoTen}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.cccd || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.gioiTinh || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.ngaySinh ? new Date(item.ngaySinh).toLocaleDateString('vi-VN') : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <span class="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">${item.hoKhau?.soCanHo || '-'}</span>
                <div class="text-xs text-gray-400">${item.hoKhau?.tenChuHo || '-'}</div>
                <div class="text-xs font-medium ${item.quanHeVoiChuHo === 'Chủ hộ' ? 'text-green-600' : 'text-blue-600'}">${item.quanHeVoiChuHo || '-'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onclick="event.stopPropagation()">
                <button onclick="deleteNhanKhau('${item.id}')" class="text-red-600 hover:text-red-900">Xóa</button>
            </td>
        </tr>
    `).join('');
}

// 2. Lấy danh sách Hộ khẩu để đổ vào Select box
async function fetchHoKhauOptions() {
    try {
        const response = await fetch(`${API_URL}/hokhau`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const data = await response.json();
        if (data.status === 'success') {
            selectHoKhau.innerHTML = '<option value="">-- Chọn hộ khẩu --</option>' + 
                data.data.map(hk => `<option value="${hk.id}">${hk.soCanHo} - Chủ hộ: ${hk.tenChuHo}</option>`).join('');
        }
    } catch (e) { console.error(e); }
}

// 3. Xử lý Modal
window.openAddModal = () => {
    fetchHoKhauOptions(); // Load danh sách hộ khẩu mới nhất
    nkModal.classList.remove('hidden');
}
window.closeAddModal = () => nkModal.classList.add('hidden');

// 4. Thêm mới
if (nkForm) {
    nkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(nkForm);
        const data = Object.fromEntries(formData.entries());

        // Validate CCCD nếu có
        if (data.cccd && data.cccd.trim()) {
            if (!/^[0-9]{9,12}$/.test(data.cccd.trim())) {
                if (window.notificationManager) {
                    notificationManager.error('CCCD/CMND phải từ 9-12 chữ số');
                } else {
                    alert('CCCD/CMND phải từ 9-12 chữ số');
                }
                return;
            }
        }

        // Xử lý ngày sinh rỗng
        if (!data.ngaySinh) delete data.ngaySinh;

        try {
            const response = await fetch(`${API_URL}/nhankhau`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.success('Thêm nhân khẩu thành công!');
                }
                closeAddModal();
                nkForm.reset();
                fetchNhanKhauList();
            } else {
                if (window.notificationManager) {
                    notificationManager.error(result.message || 'Có lỗi xảy ra');
                }
            }
        } catch (error) {
            console.error(error);
            if (window.notificationManager) {
                notificationManager.error('Lỗi kết nối với server');
            }
        }
    });
}

// 5. Xóa với Modern Modal
window.deleteNhanKhau = async (id) => {
    const confirmed = await modal.confirm({
        title: 'Xóa nhân khẩu',
        message: 'Bạn có chắc chắn muốn xóa nhân khẩu này? Hành động này không thể hoàn tác.',
        type: 'danger',
        confirmText: 'Xóa',
        cancelText: 'Hủy'
    });
    
    if (!confirmed) return;
    
    try {
        const res = await fetch(`${API_URL}/nhankhau/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const result = await res.json();
        if (result.status === 'success') {
            if (window.notificationManager) {
                notificationManager.success('Đã xóa nhân khẩu thành công');
            }
            fetchNhanKhauList();
        } else {
            if (window.notificationManager) {
                notificationManager.error(result.message || 'Không thể xóa nhân khẩu');
            }
        }
    } catch (e) { 
        if (window.notificationManager) {
            notificationManager.error('Lỗi kết nối đến server');
        }
    }
};

// Function để xem chi tiết nhân khẩu
window.viewNhanKhauDetail = function(nhanKhauId) {
    const nhanKhau = allNhanKhauData.find(item => item.id === nhanKhauId);
    if (!nhanKhau) return;
    
    // Tạo modal chi tiết
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-900">Chi Tiết Nhân Khẩu</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Thông tin cá nhân -->
                <div>
                    <h4 class="font-semibold text-gray-800 mb-3">Thông tin cá nhân</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="font-medium text-gray-600">Họ tên:</span> ${nhanKhau.hoTen || '-'}</div>
                        <div><span class="font-medium text-gray-600">CCCD:</span> ${nhanKhau.cccd || '-'}</div>
                        <div><span class="font-medium text-gray-600">Giới tính:</span> ${nhanKhau.gioiTinh || '-'}</div>
                        <div><span class="font-medium text-gray-600">Ngày sinh:</span> ${nhanKhau.ngaySinh ? new Date(nhanKhau.ngaySinh).toLocaleDateString('vi-VN') : '-'}</div>
                        <div><span class="font-medium text-gray-600">Email:</span> ${nhanKhau.email || '-'}</div>
                    </div>
                </div>
                
                <!-- Thông tin hộ khẩu -->
                <div>
                    <h4 class="font-semibold text-gray-800 mb-3">Thông tin hộ khẩu</h4>
                    <div class="space-y-2 text-sm">
                        <div><span class="font-medium text-gray-600">Số căn hộ:</span> 
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">${nhanKhau.hoKhau?.soCanHo || '-'}</span>
                        </div>
                        <div><span class="font-medium text-gray-600">Tên chủ hộ:</span> ${nhanKhau.hoKhau?.tenChuHo || '-'}</div>
                        <div><span class="font-medium text-gray-600">Quan hệ với chủ hộ:</span> 
                            <span class="px-2 py-1 rounded text-xs font-semibold ${nhanKhau.quanHeVoiChuHo === 'Chủ hộ' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">${nhanKhau.quanHeVoiChuHo || '-'}</span>
                        </div>
                        <div><span class="font-medium text-gray-600">Diện tích:</span> ${nhanKhau.hoKhau?.dienTich ? nhanKhau.hoKhau.dienTich + ' m²' : '-'}</div>
                        <div><span class="font-medium text-gray-600">SĐT chủ hộ:</span> ${nhanKhau.hoKhau?.soDienThoai || '-'}</div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end mt-6">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Đóng</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};
