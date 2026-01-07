// frontend/khoanthu.js

const API_URL = window.AppConfig.API_URL;
const token = localStorage.getItem('token');

// Auth guard - redirect to login if no token
if (!token) {
    window.location.href = 'index.html';
}

// Helper function for notifications đồng bộ với BlueMoon branding
function showNotification(message, type = 'info') {
    if (window.notificationManager) {
        if (type === 'payment') {
            notificationManager.payment(message);
        } else {
            notificationManager[type](message);
        }
    }
}

// Helper function để hiển thị phạm vi áp dụng
function getPhamViText(item) {
    let phamVi = '';
    switch(item.phamViApDung) {
        case 'THEO_TOA':
            phamVi = `Tòa ${item.toa || '?'}`;
            break;
        case 'THEO_TANG':
            phamVi = `Tầng ${item.tang || '?'}`;
            if (item.toa) phamVi += ` - Tòa ${item.toa}`;
            break;
        case 'THEO_PHONG':
            phamVi = `Phòng ${item.phong || '?'}`;
            if (item.tang) phamVi += ` - Tầng ${item.tang}`;
            if (item.toa) phamVi += ` - Tòa ${item.toa}`;
            break;
        case 'HANG_CAN_HO':
            phamVi = item.ghiChuPhamVi || 'Theo hạng căn hộ';
            break;
        default:
            phamVi = item.ghiChuPhamVi || 'Đặc biệt';
    }
    return phamVi;
}

const ktTableBody = document.getElementById('khoanThuTableBody');
const createModal = document.getElementById('createModal');
const createForm = document.getElementById('createKhoanThuForm');
const nopTienModal = document.getElementById('nopTienModal');
const nopTienForm = document.getElementById('nopTienForm');
const selectKhoanThu = document.getElementById('selectKhoanThu');
const selectHoKhau = document.getElementById('selectHoKhau');
const inputSoTien = document.getElementById('inputSoTien');
const searchInput = document.getElementById('searchInput');
let allKhoanThuData = [];
let isKhoanThuSetupComplete = false; // Flag để tránh duplicate setup

// Setup user info and logout handler
function setupUserInfo() {
    if (isKhoanThuSetupComplete) {
        console.log('KhoanThu setup already completed, skipping...');
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
            console.log('Logout clicked in khoanthu page');
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
    
    isKhoanThuSetupComplete = true;
    console.log('KhoanThu setup completed');
}

// 1. Lấy danh sách Khoản thu
async function fetchKhoanThuList() {
    try {
        const response = await fetch(`${API_URL}/khoanthu`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Server trả về dữ liệu không hợp lệ');
        }
        
        if (data.status === 'success') {
            allKhoanThuData = data.data || [];
            renderKhoanThuTable(allKhoanThuData);
        } else {
            console.error('KhoanThu API error:', data.message);
            showKhoanThuError('Lỗi API: ' + (data.message || 'Không xác định'));
        }
    } catch (e) { 
        console.error('KhoanThu fetch error:', e);
        showKhoanThuError('Lỗi kết nối: ' + e.message);
    }
}

// 1.5. Hàm tìm kiếm nâng cao
function handleSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    const loaiPhiFilter = document.getElementById('filterLoaiPhi')?.value || '';
    const phanLoaiFilter = document.getElementById('filterPhanLoai')?.value || '';
    const trangThaiFilter = document.getElementById('filterTrangThai')?.value || '';
    
    let filtered = [...allKhoanThuData];
    
    // Lọc theo từ khóa tìm kiếm
    if (keyword) {
        filtered = filtered.filter(item => {
            const tenKhoanThu = (item.tenKhoanThu || '').toLowerCase();
            const moTa = (item.moTa || '').toLowerCase();
            const loaiPhi = (item.loaiPhi || '').toLowerCase();
            const phanLoaiPhi = (item.phanLoaiPhi || '').toLowerCase();
            const nhaCungCap = (item.nhaCungCap || '').toLowerCase();
            const loaiDichVu = (item.loaiDichVu || '').toLowerCase();
            const donViTinh = (item.donViTinh || '').toLowerCase();
            const phamViApDung = (item.phamViApDung || '').toLowerCase();
            const ghiChuPhamVi = (item.ghiChuPhamVi || '').toLowerCase();
            const toa = (item.toa || '').toLowerCase();
            
            // Chuyển đổi loại phí để tìm kiếm tiếng Việt
            const loaiPhiText = item.loaiPhi === 'BAT_BUOC' ? 'bắt buộc' : 'tự nguyện đóng góp';
            const phanLoaiText = item.phanLoaiPhi === 'CO_DINH' ? 'cố định' : 'theo mức sử dụng';
            
            // Tìm theo số tiền
            const soTienStr = item.soTien ? item.soTien.toString() : '';
            const donGiaStr = item.donGiaDichVu ? item.donGiaDichVu.toString() : '';
            
            return tenKhoanThu.includes(keyword) ||
                   moTa.includes(keyword) ||
                   loaiPhi.includes(keyword) ||
                   loaiPhiText.includes(keyword) ||
                   phanLoaiPhi.includes(keyword) ||
                   phanLoaiText.includes(keyword) ||
                   nhaCungCap.includes(keyword) ||
                   loaiDichVu.includes(keyword) ||
                   donViTinh.includes(keyword) ||
                   phamViApDung.includes(keyword) ||
                   ghiChuPhamVi.includes(keyword) ||
                   toa.includes(keyword) ||
                   soTienStr.includes(keyword) ||
                   donGiaStr.includes(keyword);
        });
    }
    
    // Lọc theo loại phí (Bắt buộc / Tự nguyện)
    if (loaiPhiFilter) {
        filtered = filtered.filter(item => item.loaiPhi === loaiPhiFilter);
    }
    
    // Lọc theo phân loại (Cố định / Theo mức sử dụng)
    if (phanLoaiFilter) {
        filtered = filtered.filter(item => item.phanLoaiPhi === phanLoaiFilter);
    }
    
    // Lọc theo trạng thái hạn nộp
    if (trangThaiFilter) {
        const now = new Date();
        filtered = filtered.filter(item => {
            if (!item.hanNop) return trangThaiFilter === 'khong_han';
            
            const hanNop = new Date(item.hanNop);
            const diffDays = Math.ceil((hanNop - now) / (1000 * 60 * 60 * 24));
            
            switch(trangThaiFilter) {
                case 'con_han': return diffDays > 7;
                case 'sap_het': return diffDays > 0 && diffDays <= 7;
                case 'qua_han': return diffDays <= 0;
                case 'khong_han': return false;
                default: return true;
            }
        });
    }
    
    renderKhoanThuTable(filtered);
    updateSearchResultCount(filtered.length, allKhoanThuData.length);
}

// Cập nhật số kết quả tìm kiếm
function updateSearchResultCount(count, total) {
    const resultCount = document.getElementById('searchResultCount');
    if (resultCount) {
        if (count === total) {
            resultCount.textContent = `Hiển thị ${total} khoản thu`;
        } else {
            resultCount.textContent = `Tìm thấy ${count}/${total} khoản thu`;
        }
    }
}

// Xóa bộ lọc
function clearFilters() {
    if (searchInput) searchInput.value = '';
    const filterLoaiPhi = document.getElementById('filterLoaiPhi');
    const filterPhanLoai = document.getElementById('filterPhanLoai');
    const filterTrangThai = document.getElementById('filterTrangThai');
    
    if (filterLoaiPhi) filterLoaiPhi.value = '';
    if (filterPhanLoai) filterPhanLoai.value = '';
    if (filterTrangThai) filterTrangThai.value = '';
    
    renderKhoanThuTable(allKhoanThuData);
    updateSearchResultCount(allKhoanThuData.length, allKhoanThuData.length);
}

// Thêm event listeners cho tìm kiếm và bộ lọc
if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

// Setup filter listeners
document.addEventListener('DOMContentLoaded', () => {
    const filterLoaiPhi = document.getElementById('filterLoaiPhi');
    const filterPhanLoai = document.getElementById('filterPhanLoai');
    const filterTrangThai = document.getElementById('filterTrangThai');
    const btnClearFilters = document.getElementById('btnClearFilters');
    
    if (filterLoaiPhi) filterLoaiPhi.addEventListener('change', handleSearch);
    if (filterPhanLoai) filterPhanLoai.addEventListener('change', handleSearch);
    if (filterTrangThai) filterTrangThai.addEventListener('change', handleSearch);
    if (btnClearFilters) btnClearFilters.addEventListener('click', clearFilters);
});

// Setup when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('khoanThuTableBody')) {
        console.log('KhoanThu page detected, initializing...');
        setupUserInfo();
        fetchKhoanThuList();
    }
});

// Also try immediate setup in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    setTimeout(() => {
        if (document.getElementById('khoanThuTableBody')) {
            setupUserInfo();
            fetchKhoanThuList();
        }
    }, 100);
}

function showKhoanThuError(message) {
    ktTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">
        <div class="py-8">
            <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-lg font-medium text-red-600">Lỗi tải dữ liệu</p>
            <p class="text-sm text-red-400 mt-2">${message}</p>
        </div>
    </td></tr>`;
}

function renderKhoanThuTable(list) {
    if (list.length === 0) {
        ktTableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">
            <div class="py-8">
                <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-lg font-medium">Chưa có khoản thu nào</p>
                <p class="text-sm text-gray-400 mt-2">Hãy bắt đầu bằng cách tạo khoản thu đầu tiên</p>
            </div>
        </td></tr>`;
        return;
    }
    const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

    ktTableBody.innerHTML = list.map(item => {
        let giaDisplay = '';
        let phanLoaiText = 'Cố định';
        
        if (item.phanLoaiPhi === 'CO_DINH') {
            giaDisplay = item.soTien ? formatter.format(item.soTien) : 'Chưa xác định';
            if (item.phamViApDung && item.phamViApDung !== 'TAT_CA') {
                giaDisplay += ` (${getPhamViText(item)})`;
            }
            phanLoaiText = 'Cố định';

        } else if (item.phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
            const donGia = item.donGiaDichVu ? formatter.format(item.donGiaDichVu) : '0';
            const donVi = item.donViTinh || 'đơn vị';
            const phiCoDinh = item.phiCoDinh ? ' + ' + formatter.format(item.phiCoDinh) + ' (cố định)' : '';
            giaDisplay = `${donGia}/${donVi}${phiCoDinh}`;
            phanLoaiText = 'Theo sử dụng';
        } else {
            giaDisplay = item.soTien ? formatter.format(item.soTien) : 'Tùy tâm';
        }
        
        // Nút thao tác cho phí theo mức sử dụng
        let actionButtons = '';
        if (item.phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
            actionButtons = `
                <button onclick="showUsageDetail('${item.id}')" class="text-blue-600 hover:text-blue-900 mr-2 text-xs px-2 py-1 bg-blue-50 rounded">Chi tiết từng hộ</button>
                <button onclick="openBulkInputModal('${item.id}')" class="text-green-600 hover:text-green-900 mr-2 text-xs px-2 py-1 bg-green-50 rounded">Nhập hàng loạt</button>
            `;
        }
        
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${item.tenKhoanThu}</div>
                <div class="text-sm text-gray-500">${item.moTa || 'Không có mô tả'}</div>
                ${item.phanLoaiPhi === 'THEO_MUC_SU_DUNG' ? `<div class="text-xs text-blue-600 mt-1">
                    <span class="font-medium">${item.loaiDichVu || 'Dịch vụ'}</span> - ${item.nhaCungCap || 'Chưa rõ NCC'}
                    ${item.ghiChuGia ? `<br><em>${item.ghiChuGia}</em>` : ''}
                </div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${item.loaiPhi === 'BAT_BUOC' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                    ${item.loaiPhi === 'BAT_BUOC' ? 'Bắt buộc' : 'Tự nguyện'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    item.phanLoaiPhi === 'CO_DINH' ? 'bg-purple-100 text-purple-800' : 
                    'bg-teal-100 text-teal-800'
                }">
                    ${phanLoaiText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${giaDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.hanNop ? new Date(item.hanNop).toLocaleDateString('vi-VN') : 'Không thời hạn'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                <span class="text-gray-600 font-bold">${item._count?.lichSuNopTien || 0}</span> hộ đã nộp
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                ${actionButtons}
                <button onclick="deleteKhoanThu('${item.id}')" class="text-red-600 hover:text-red-900">Xóa</button>
            </td>
        </tr>
        `;
    }).join('');
}

// 2. Xử lý Tạo Khoản thu Mới
window.openCreateModal = () => createModal.classList.remove('hidden');
window.closeCreateModal = () => createModal.classList.add('hidden');
// 3. Xử lý Ghi nhận Nộp Tiền
// Cần load danh sách khoản thu và hộ khẩu vào select box
async function loadOptionsForNopTien() {
    try {
        const [resKT, resHK] = await Promise.all([
            fetch(`${API_URL}/khoanthu`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } }),
            fetch(`${API_URL}/hokhau`, { headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' } })
        ]);
        const dataKT = await resKT.json();
        const dataHK = await resHK.json();

        if (dataKT.status === 'success') {
            selectKhoanThu.innerHTML = dataKT.data.map(k => `<option value="${k.id}" data-sotien="${k.soTien || 0}">${k.tenKhoanThu} (${k.loaiPhi})</option>`).join('');
        }
        if (dataHK.status === 'success') {
            selectHoKhau.innerHTML = dataHK.data.map(h => `<option value="${h.id}">${h.soCanHo} - ${h.tenChuHo}</option>`).join('');
        }
        // Trigger cập nhật số tiền mặc định
        updateDefaultAmount();
    } catch (e) { console.error(e); }
}

// Khi chọn khoản thu, tự điền số tiền nếu là phí bắt buộc
selectKhoanThu.addEventListener('change', updateDefaultAmount);
function updateDefaultAmount() {
    const selected = selectKhoanThu.options[selectKhoanThu.selectedIndex];
    const amount = selected?.getAttribute('data-sotien');
    if (amount && amount != "0") {
        inputSoTien.value = amount;
    } else {
        inputSoTien.value = "";
    }
}

window.openNopTienModal = () => {
    loadOptionsForNopTien();
    nopTienModal.classList.remove('hidden');
}
window.closeNopTienModal = () => nopTienModal.classList.add('hidden');

if (nopTienForm) {
    nopTienForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(nopTienForm);
        const data = {
            khoanThuId: formData.get('khoanThuId'),
            hoKhauId: formData.get('hoKhauId'),
            soTienDaNop: parseFloat(formData.get('soTienDaNop')),
            nguoiNop: formData.get('nguoiNop')
        };

        try {
            const res = await fetch(`${API_URL}/khoanthu/nop-tien`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.payment('Ghi nhận nộp tiền thành công!');
                }
                closeNopTienModal();
                fetchKhoanThuList(); // Refresh lại list để cập nhật số lượng đã nộp
            } else {
                if (window.notificationManager) {
                    notificationManager.error(result.message || 'Có lỗi xảy ra');
                }
            }
        } catch (e) { 
            console.error(e);
            if (window.notificationManager) {
                notificationManager.error('Lỗi kết nối với server');
            }
        }
    });
}

window.deleteKhoanThu = async (id) => {
    const confirmed = await modal.confirm({
        title: 'Xóa khoản thu',
        message: 'Bạn có chắc chắn muốn xóa khoản thu này? Tất cả lịch sử nộp tiền liên quan sẽ bị xóa.',
        type: 'danger',
        confirmText: 'Xóa',
        cancelText: 'Hủy'
    });
    
    if (!confirmed) return;
    
    try {
        const res = await fetch(`${API_URL}/khoanthu/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const result = await res.json();
        if (result.status === 'success') {
            if (window.notificationManager) {
                notificationManager.success('Đã xóa khoản thu thành công');
            }
            fetchKhoanThuList();
        } else {
            if (window.notificationManager) {
                notificationManager.error(result.message || 'Không thể xóa');
            }
        }
    } catch (e) { 
        modal.alert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến server', type: 'error' });
    }
};

// --- HÀM XỬ LÝ PHÂN LOẠI PHÍ ---
const phanLoaiPhiSelect = document.getElementById('phanLoaiPhi');
const coDinhFields = document.getElementById('coDinhFields');
const suDungFields = document.getElementById('suDungFields');

// --- HÀM XỬ LÝ PHẠM VI ÁP DỤNG ---
function togglePhamViFields() {
    const phamViSelect = document.querySelector('select[name="phamViApDung"]');
    const toaField = document.getElementById('toaField');
    const tangField = document.getElementById('tangField');
    const phongField = document.getElementById('phongField');
    const hangCanHoField = document.getElementById('hangCanHoField');
    const ghiChuField = document.querySelector('input[name="ghiChuPhamVi"]');
    
    if (!phamViSelect) return;
    
    const value = phamViSelect.value;
    
    // Ẩn tất cả trước
    toaField.style.display = 'none';
    tangField.style.display = 'none';
    phongField.style.display = 'none';
    if (hangCanHoField) hangCanHoField.style.display = 'none';
    
    // Reset placeholder mặc định
    if (ghiChuField) {
        ghiChuField.placeholder = 'VD: Từ tầng 5 trở lên, Penthouse, Studio...';
    }
    
    // Hiện theo lựa chọn
    switch(value) {
        case 'THEO_TOA':
            toaField.style.display = 'block';
            break;
        case 'THEO_TANG':
            toaField.style.display = 'block';
            tangField.style.display = 'block';
            break;
        case 'THEO_PHONG':
            toaField.style.display = 'block';
            tangField.style.display = 'block';
            phongField.style.display = 'block';
            break;
        case 'HANG_CAN_HO':
            // Hiện dropdown chọn hạng căn hộ
            if (hangCanHoField) hangCanHoField.style.display = 'block';
            if (ghiChuField) {
                ghiChuField.placeholder = 'VD: Penthouse, Studio, 1PN, 2PN, 3PN...';
            }
            break;
        case 'TAT_CA':
        default:
            // Không hiện gì cả
            break;
    }
}

// Gắn event listener cho phạm vi áp dụng
const phamViSelect = document.querySelector('select[name="phamViApDung"]');
if (phamViSelect) {
    phamViSelect.addEventListener('change', togglePhamViFields);
    // Gọi ngay lần đầu để thiết lập trạng thái ban đầu
    togglePhamViFields();
}

if (phanLoaiPhiSelect) {
    phanLoaiPhiSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        
        // Ẩn hết
        coDinhFields.classList.add('hidden');
        suDungFields.classList.add('hidden');
        
        // Hiện theo lựa chọn
        if (value === 'CO_DINH') {
            coDinhFields.classList.remove('hidden');
        } else if (value === 'THEO_MUC_SU_DUNG') {
            suDungFields.classList.remove('hidden');
        }
    });
}

// Cập nhật form submit để gửi đúng trường
if (createForm) {
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createForm);
        const data = {};
        
        // Lấy các trường cơ bản
        data.tenKhoanThu = formData.get('tenKhoanThu');
        data.moTa = formData.get('moTa');
        data.loaiPhi = formData.get('loaiPhi');
        data.phanLoaiPhi = formData.get('phanLoaiPhi');
        data.hanNop = formData.get('hanNop');
        
        // Lấy thông tin phạm vi áp dụng (chung cho cả 2 loại)
        data.phamViApDung = formData.get('phamViApDung');
        data.ghiChuPhamVi = formData.get('ghiChuPhamVi') || null;
        data.toa = formData.get('toa') || null;
        data.tang = formData.get('tang') || null;
        data.phong = formData.get('phong') || null;
        
        // Nếu chọn hạng căn hộ, lưu vào ghiChuPhamVi
        if (data.phamViApDung === 'HANG_CAN_HO') {
            const hangCanHo = formData.get('hangCanHo');
            if (hangCanHo) {
                data.ghiChuPhamVi = hangCanHo;
            }
        }
        
        // Lấy trường theo phân loại
        if (data.phanLoaiPhi === 'CO_DINH') {
            data.soTien = parseFloat(formData.get('soTien'));

        } else if (data.phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
            data.loaiDichVu = formData.get('loaiDichVu');
            data.donGiaDichVu = parseFloat(formData.get('donGiaDichVu'));
            data.donViTinh = formData.get('donViTinh');
            data.nhaCungCap = formData.get('nhaCungCap');
            data.phiCoDinh = formData.get('phiCoDinh') ? parseFloat(formData.get('phiCoDinh')) : null;
            data.ghiChuGia = formData.get('ghiChuGia') || null;
        }
        
        try {
            const res = await fetch(`${API_URL}/khoanthu`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.success('Tạo khoản thu thành công!');
                }
                closeCreateModal();
                createForm.reset();
                fetchKhoanThuList();
            } else {
                modal.alert({ title: 'Lỗi', message: result.message, type: 'error' });
            }
        } catch (e) {
            console.error(e);
            if (window.notificationManager) {
                notificationManager.error('Không thể kết nối đến server');
            }
        }
    });
}

// --- MODAL NHẬP SỐ ĐIỆN/NƯỚC ---
const nhapSuDungModal = document.getElementById('nhapSuDungModal');
const nhapSuDungForm = document.getElementById('nhapSuDungForm');

window.openNhapSuDungModal = (khoanThuId, hoKhauId, soCanHo, tenChuHo) => {
    document.getElementById('suDungKhoanThuId').value = khoanThuId;
    document.getElementById('suDungHoKhauId').value = hoKhauId;
    document.getElementById('suDungHoKhauInfo').textContent = `${soCanHo} - ${tenChuHo}`;
    nhapSuDungModal.classList.remove('hidden');
};

window.closeNhapSuDungModal = () => {
    nhapSuDungModal.classList.add('hidden');
    nhapSuDungForm.reset();
};

if (nhapSuDungForm) {
    nhapSuDungForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(nhapSuDungForm);
        const data = {
            hoKhauId: formData.get('hoKhauId'),
            khoanThuId: formData.get('khoanThuId'),
            chiSoCu: formData.get('chiSoCu') ? parseFloat(formData.get('chiSoCu')) : null,
            chiSoMoi: parseFloat(formData.get('chiSoMoi'))
        };
        
        try {
            const res = await fetch(`${API_URL}/khoanthu/chi-tiet-su-dung`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.success('Đã lưu số đo thành công!');
                }
                closeNhapSuDungModal();
            } else {
                modal.alert({ title: 'Lỗi', message: result.message, type: 'error' });
            }
        } catch (e) {
            console.error(e);
            showNotification('Không thể kết nối server', 'error');
        }
    });
}

// --- MODAL IMPORT EXCEL ---
const importModal = document.getElementById('importModal');
const importData = document.getElementById('importData');

window.openImportModal = (khoanThuId) => {
    document.getElementById('importKhoanThuId').value = khoanThuId;
    importModal.classList.remove('hidden');
};

window.closeImportModal = () => {
    importModal.classList.add('hidden');
    importData.value = '';
};

window.downloadTemplate = () => {
    const template = `Số căn hộ|Chỉ số cũ|Chỉ số mới
BM-A101|1000|1350
BM-A102|850|1100
BM-A103|950|1200`;
    
    const blob = new Blob([template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import-dien-nuoc.txt';
    a.click();
    URL.revokeObjectURL(url);
};

window.processImport = async () => {
    const khoanThuId = document.getElementById('importKhoanThuId').value;
    const text = importData.value.trim();
    
    if (!text) {
        showNotification('Vui lòng nhập dữ liệu', 'error');
        return;
    }
    
    // Parse dữ liệu
    const lines = text.split('\n').filter(line => line.trim());
    const data = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Bỏ qua dòng header
        if (line.toLowerCase().includes('số căn hộ') || line.toLowerCase().includes('chỉ số')) continue;
        
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
            data.push({
                soCanHo: parts[0],
                chiSoCu: parts[1] ? parseFloat(parts[1]) : null,
                chiSoMoi: parseFloat(parts[2] || parts[1])
            });
        }
    }
    
    if (data.length === 0) {
        showNotification('Không có dữ liệu hợp lệ', 'error');
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/khoanthu/import-su-dung/${khoanThuId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            const { success, failed, errors } = result.data;
            let message = `Import thành công ${success} hộ`;
            if (failed > 0) {
                message += `\nThất bại ${failed} hộ:\n${errors.join('\n')}`;
            }
            modal.alert({ title: 'Kết quả Import', message, type: success > 0 ? 'success' : 'error' });
            closeImportModal();
        } else {
            modal.alert({ title: 'Lỗi', message: result.message, type: 'error' });
        }
    } catch (e) {
        console.error(e);
        modal.alert({ title: 'Lỗi', message: 'Không thể kết nối server', type: 'error' });
    }
};

// --- XEM DANH SÁCH SỬ DỤNG ---
window.showUsageList = async (khoanThuId) => {
    try {
        const res = await fetch(`${API_URL}/khoanthu/chi-tiet-su-dung/${khoanThuId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            const list = result.data;
            if (list.length === 0) {
                modal.alert({ title: 'Danh sách sử dụng', message: 'Chưa có dữ liệu sử dụng nào', type: 'info' });
                return;
            }
            
            const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
            const rows = list.map(item => `
                <tr class="border-b">
                    <td class="px-4 py-2">${item.hoKhau?.soCanHo || 'N/A'}</td>
                    <td class="px-4 py-2 text-right">${item.chiSoCu !== null ? item.chiSoCu : '-'}</td>
                    <td class="px-4 py-2 text-right">${item.chiSoMoi}</td>
                    <td class="px-4 py-2 text-right font-semibold">${item.soLuongSuDung}</td>
                    <td class="px-4 py-2 text-right text-blue-600 font-bold">${formatter.format(item.thanhTien)}</td>
                </tr>
            `).join('');
            
            const table = `
                <div class="max-h-96 overflow-y-auto">
                    <table class="min-w-full text-sm">
                        <thead class="bg-gray-100 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left">Căn hộ</th>
                                <th class="px-4 py-2 text-right">Chỉ số cũ</th>
                                <th class="px-4 py-2 text-right">Chỉ số mới</th>
                                <th class="px-4 py-2 text-right">Số lượng</th>
                                <th class="px-4 py-2 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
            
            modal.alert({ title: 'Danh sách sử dụng điện/nước', message: table, type: 'info' });
        } else {
            modal.alert({ title: 'Lỗi', message: result.message, type: 'error' });
        }
    } catch (e) {
        console.error(e);
        modal.alert({ title: 'Lỗi', message: 'Không thể kết nối server', type: 'error' });
    }
};

// === LOGIC ĐIỆN NƯỚC RIÊNG TỪNG HỘ ===
window.showUsageDetail = async (khoanThuId) => {
    try {
        const response = await fetch(`${API_URL}/khoanthu/${khoanThuId}/usage`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            const list = data.data || [];
            const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh]">
                    <div class="p-6 border-b bg-blue-50">
                        <h3 class="font-bold text-blue-800">💡 Chi tiết sử dụng từng hộ</h3>
                        <p class="text-sm text-blue-600">Tổng: ${list.length} hộ đã nhập chỉ số</p>
                    </div>
                    <div class="overflow-y-auto max-h-96 p-4">
                        ${list.length > 0 ? `
                            <table class="w-full text-sm">
                                <thead class="bg-gray-100">
                                    <tr><th class="px-4 py-2">Căn hộ</th><th>Chỉ số cũ</th><th>Chỉ số mới</th><th>Lượng dùng</th><th>Thành tiền</th></tr>
                                </thead>
                                <tbody>
                                    ${list.map(item => `
                                        <tr class="border-b hover:bg-gray-50">
                                            <td class="px-4 py-2 font-medium">${item.hoKhau?.soCanHo || 'N/A'}</td>
                                            <td class="px-4 py-2 text-center">${item.chiSoCu || '-'}</td>
                                            <td class="px-4 py-2 text-center">${item.chiSoMoi}</td>
                                            <td class="px-4 py-2 text-center font-bold">${item.soLuongSuDung}</td>
                                            <td class="px-4 py-2 text-right text-green-600 font-bold">${formatter.format(item.thanhTien)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            <div class="mt-4 p-3 bg-green-50 rounded text-center">
                                <strong>Tổng tiền: ${formatter.format(list.reduce((sum, item) => sum + item.thanhTien, 0))}</strong>
                            </div>
                        ` : '<div class="text-center text-gray-500 p-8">Chưa có dữ liệu</div>'}
                    </div>
                    <div class="p-4 border-t">
                        <button onclick="this.closest('.fixed').remove()" class="w-full py-2 bg-blue-600 text-white rounded">Đóng</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    } catch (e) {
        showNotification('Lỗi tải chi tiết: ' + e.message, 'error');
    }
};

window.openBulkInputModal = async (khoanThuId) => {
    const khoanThu = allKhoanThuData.find(kt => kt.id === khoanThuId);
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'bulkInputModal';
    modal.innerHTML = `
        <div class="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div class="p-6 border-b bg-green-50">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-green-800 text-lg">⚡ Nhập chỉ số ${khoanThu?.loaiDichVu || 'điện/nước'}</h3>
                        <p class="text-sm text-green-600">Giá: ${khoanThu?.donGiaDichVu?.toLocaleString() || 0} VNĐ/${khoanThu?.donViTinh || 'đơn vị'}
                           ${khoanThu?.phiCoDinh ? ` + ${khoanThu.phiCoDinh.toLocaleString()} VNĐ phí cố định` : ''}</p>
                        ${khoanThu?.phamViApDung && khoanThu.phamViApDung !== 'TAT_CA' 
                            ? `<p class="text-xs text-orange-600 mt-1">📍 Phạm vi: ${khoanThu.phamViApDung} ${khoanThu.toa || ''} ${khoanThu.ghiChuPhamVi || ''}</p>` 
                            : ''}
                    </div>
                    <div class="flex gap-2">
                        <button onclick="exportExcelTemplate('${khoanThuId}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm flex items-center gap-1">
                            📥 Tải Excel mẫu
                        </button>
                        <button onclick="document.getElementById('importFileInput').click()" class="px-3 py-1 bg-purple-600 text-white rounded text-sm flex items-center gap-1">
                            📤 Import Excel
                        </button>
                        <input type="file" id="importFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="importExcelFile('${khoanThuId}', this)">
                    </div>
                </div>
            </div>
            <div class="p-4 overflow-y-auto flex-1" style="max-height: 60vh;">
                <div class="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    💡 <strong>Số cũ</strong> được tự động lấy từ kỳ trước. Bạn chỉ cần nhập <strong>Số mới</strong>!
                </div>
                <div id="usageInputList">⏳ Đang tải dữ liệu...</div>
            </div>
            <div class="p-4 border-t flex justify-between bg-gray-50">
                <button onclick="this.closest('.fixed').remove()" class="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded">Hủy</button>
                <div class="flex gap-2">
                    <span id="usageSummary" class="text-sm text-gray-600 self-center mr-4"></span>
                    <button onclick="saveAllUsageInput('${khoanThuId}')" class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">💾 Lưu tất cả</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Load template data với số cũ đã lưu
    try {
        const res = await fetch(`${API_URL}/khoanthu/${khoanThuId}/export-template`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await res.json();
        
        if (result.status === 'success') {
            const templateData = result.data.templateData || [];
            
            if (templateData.length === 0) {
                document.getElementById('usageInputList').innerHTML = '<div class="text-center text-gray-500 p-8">Không có căn hộ nào trong phạm vi này</div>';
                return;
            }
            
            document.getElementById('usageInputList').innerHTML = `
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 sticky top-0">
                        <tr>
                            <th class="px-3 py-2 text-left">Căn hộ</th>
                            <th class="px-3 py-2 text-left">Chủ hộ</th>
                            <th class="px-3 py-2 text-right">Số cũ (kỳ trước)</th>
                            <th class="px-3 py-2 text-right">Số mới *</th>
                            <th class="px-3 py-2 text-center">hoặc</th>
                            <th class="px-3 py-2 text-right">Tiền trực tiếp</th>
                            <th class="px-3 py-2 text-right">Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${templateData.map((item, idx) => `
                            <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50" data-socanho="${item.soCanHo}">
                                <td class="px-3 py-2 font-bold text-blue-600">${item.soCanHo}</td>
                                <td class="px-3 py-2 text-gray-600">${item.tenChuHo || '-'}</td>
                                <td class="px-3 py-2 text-right">
                                    <input type="number" step="0.1" value="${item.chiSoCu || ''}" 
                                        class="w-20 px-2 py-1 border rounded text-sm text-right bg-gray-100" 
                                        id="cu_${item.soCanHo}" readonly title="Lấy từ kỳ trước">
                                </td>
                                <td class="px-3 py-2 text-right">
                                    <input type="number" step="0.1" placeholder="Nhập số mới" 
                                        class="w-24 px-2 py-1 border border-blue-300 rounded text-sm text-right focus:ring-2 focus:ring-blue-500" 
                                        id="moi_${item.soCanHo}" onchange="calcUsageByCanHo('${item.soCanHo}', ${khoanThu?.donGiaDichVu || 0}, ${khoanThu?.phiCoDinh || 0})">
                                </td>
                                <td class="px-3 py-2 text-center text-gray-400">hoặc</td>
                                <td class="px-3 py-2 text-right">
                                    <input type="number" placeholder="Số tiền" 
                                        class="w-28 px-2 py-1 border border-green-300 rounded text-sm text-right" 
                                        id="tien_${item.soCanHo}" onchange="directAmountByCanHo('${item.soCanHo}')">
                                </td>
                                <td class="px-3 py-2 text-right">
                                    <span id="result_${item.soCanHo}" class="font-bold text-green-600">${item.thanhTienKyTruoc ? item.thanhTienKyTruoc.toLocaleString() + ' (cũ)' : '-'}</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            // Update summary
            document.getElementById('usageSummary').textContent = `${templateData.length} căn hộ`;
        }
    } catch (e) {
        document.getElementById('usageInputList').innerHTML = `<div class="text-center text-red-500 p-8">Lỗi tải dữ liệu: ${e.message}</div>`;
    }
};

window.saveAllUsageInput = async (khoanThuId) => {
    const usageData = [];
    
    // Thu thập dữ liệu từ các rows (dùng soCanHo)
    document.querySelectorAll('#usageInputList tr[data-socanho]').forEach(row => {
        const soCanHo = row.dataset.socanho;
        const cuVal = document.getElementById(`cu_${soCanHo}`)?.value;
        const moiVal = document.getElementById(`moi_${soCanHo}`)?.value;
        const tienVal = document.getElementById(`tien_${soCanHo}`)?.value;
        
        const cu = cuVal && cuVal.trim() !== '' ? parseFloat(cuVal) : null;
        const moi = moiVal && moiVal.trim() !== '' ? parseFloat(moiVal) : null;
        const tien = tienVal && tienVal.trim() !== '' ? parseFloat(tienVal) : null;
        
        // Chỉ thêm nếu có nhập số mới hoặc tiền trực tiếp
        if (moi !== null && !isNaN(moi)) {
            usageData.push({ soCanHo, chiSoCu: cu, chiSoMoi: moi, directAmount: null });
        } else if (tien !== null && !isNaN(tien)) {
            usageData.push({ soCanHo, chiSoCu: null, chiSoMoi: null, directAmount: tien });
        }
    });
    
    if (usageData.length === 0) {
        return showNotification('Chưa nhập dữ liệu nào (nhập Số mới hoặc Tiền trực tiếp)', 'warning');
    }
    
    try {
        const res = await fetch(`${API_URL}/khoanthu/${khoanThuId}/bulk-usage`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ usageData })
        });
        
        const result = await res.json();
        if (result.status === 'success') {
            showNotification(`✅ Lưu thành công ${usageData.length} hộ!`, 'success');
            document.getElementById('bulkInputModal')?.remove();
            fetchKhoanThuList();
        } else {
            showNotification('Lỗi: ' + result.message, 'error');
        }
    } catch (e) {
        showNotification('Lỗi kết nối: ' + e.message, 'error');
    }
};
// === HELPER FUNCTIONS FOR NEW MODAL ===

// Tính tiền theo căn hộ (dùng soCanHo thay vì hoKhauId)
window.calcUsageByCanHo = (soCanHo, donGia, phiCoDinh) => {
    const cu = parseFloat(document.getElementById(`cu_${soCanHo}`)?.value) || 0;
    const moi = parseFloat(document.getElementById(`moi_${soCanHo}`)?.value) || 0;
    const luong = moi - cu;
    
    if (luong >= 0 && moi > 0) {
        const tien = (luong * donGia) + (phiCoDinh || 0);
        document.getElementById(`result_${soCanHo}`).innerHTML = `<span class="text-blue-600">${luong.toFixed(1)}</span> → <span class="font-bold">${tien.toLocaleString()}</span> VNĐ`;
        document.getElementById(`tien_${soCanHo}`).value = '';
        updateUsageSummary();
    } else if (luong < 0) {
        document.getElementById(`result_${soCanHo}`).innerHTML = '<span class="text-red-500">⚠️ Số mới < số cũ!</span>';
    } else {
        document.getElementById(`result_${soCanHo}`).innerHTML = '-';
    }
};

// Nhập tiền trực tiếp theo căn hộ
window.directAmountByCanHo = (soCanHo) => {
    const tien = parseFloat(document.getElementById(`tien_${soCanHo}`)?.value) || 0;
    if (tien > 0) {
        document.getElementById(`result_${soCanHo}`).innerHTML = `→ <span class="font-bold">${tien.toLocaleString()}</span> VNĐ`;
        document.getElementById(`moi_${soCanHo}`).value = '';
        updateUsageSummary();
    } else {
        document.getElementById(`result_${soCanHo}`).innerHTML = '-';
    }
};

// Cập nhật tổng summary
function updateUsageSummary() {
    let total = 0;
    let count = 0;
    document.querySelectorAll('[id^="result_"]').forEach(span => {
        const text = span.textContent;
        const match = text.match(/([\d,]+)\s*VNĐ/);
        if (match && !text.includes('cũ')) {
            total += parseInt(match[1].replace(/,/g, '')) || 0;
            count++;
        }
    });
    const summary = document.getElementById('usageSummary');
    if (summary) {
        summary.textContent = `${count} hộ đã nhập • Tổng: ${total.toLocaleString()} VNĐ`;
    }
}

// === EXPORT EXCEL TEMPLATE ===
window.exportExcelTemplate = async (khoanThuId) => {
    try {
        const res = await fetch(`${API_URL}/khoanthu/${khoanThuId}/export-template`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
        });
        const result = await res.json();
        
        if (result.status !== 'success') {
            return showNotification('Lỗi: ' + result.message, 'error');
        }
        
        const { khoanThu, templateData } = result.data;
        
        // Tạo CSV content
        let csv = '\uFEFF'; // BOM for UTF-8 Excel
        csv += `"Khoản thu:","${khoanThu.tenKhoanThu}"\n`;
        csv += `"Đơn giá:","${khoanThu.donGiaDichVu} VNĐ/${khoanThu.donViTinh || 'đơn vị'}"\n`;
        csv += `"Phí cố định:","${khoanThu.phiCoDinh || 0} VNĐ"\n\n`;
        csv += `"Căn hộ","Chủ hộ","Số cũ (kỳ trước)","Số mới (nhập)","Tiền trực tiếp (nếu có)"\n`;
        
        templateData.forEach(item => {
            csv += `"${item.soCanHo}","${item.tenChuHo || ''}","${item.chiSoCu || ''}","",""\n`;
        });
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ChiSo_${khoanThu.tenKhoanThu.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification(`📥 Đã tải file Excel mẫu với ${templateData.length} căn hộ!`, 'success');
    } catch (e) {
        showNotification('Lỗi export: ' + e.message, 'error');
    }
};

// === IMPORT EXCEL FILE ===
window.importExcelFile = async (khoanThuId, input) => {
    const file = input.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const lines = text.split('\n').filter(l => l.trim());
        
        // Skip header lines (first 4 lines)
        const dataLines = lines.slice(4);
        let imported = 0;
        let errors = [];
        
        dataLines.forEach((line, idx) => {
            // Parse CSV - handle quoted values
            const parts = line.match(/("([^"]*)"|[^,]+)/g);
            if (!parts || parts.length < 4) return;
            
            const soCanHo = parts[0].replace(/"/g, '').trim();
            const chiSoCu = parseFloat(parts[2]?.replace(/"/g, '').trim()) || '';
            const chiSoMoi = parseFloat(parts[3]?.replace(/"/g, '').trim()) || '';
            const tienTrucTiep = parseFloat(parts[4]?.replace(/"/g, '').trim()) || '';
            
            // Tìm row trong table và điền data
            const row = document.querySelector(`tr[data-socanho="${soCanHo}"]`);
            if (row) {
                if (chiSoCu) document.getElementById(`cu_${soCanHo}`).value = chiSoCu;
                if (chiSoMoi) document.getElementById(`moi_${soCanHo}`).value = chiSoMoi;
                if (tienTrucTiep) document.getElementById(`tien_${soCanHo}`).value = tienTrucTiep;
                
                // Trigger calculation
                if (chiSoMoi) {
                    const khoanThu = allKhoanThuData.find(kt => kt.id === khoanThuId);
                    calcUsageByCanHo(soCanHo, khoanThu?.donGiaDichVu || 0, khoanThu?.phiCoDinh || 0);
                } else if (tienTrucTiep) {
                    directAmountByCanHo(soCanHo);
                }
                imported++;
            } else if (soCanHo) {
                errors.push(soCanHo);
            }
        });
        
        input.value = ''; // Reset file input
        
        if (imported > 0) {
            showNotification(`✅ Import thành công ${imported} căn hộ!`, 'success');
        }
        if (errors.length > 0) {
            showNotification(`⚠️ Không tìm thấy căn: ${errors.join(', ')}`, 'warning');
        }
    } catch (e) {
        showNotification('Lỗi đọc file: ' + e.message, 'error');
    }
};