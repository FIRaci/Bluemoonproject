// frontend/hokhau.js

// Get API configuration
const API_URL = window.AppConfig?.API_URL || 'http://localhost:3000';
const token = localStorage.getItem('token');

// Production-ready hokhau.js - debug functions removed

// Auth guard - redirect to login if no token
if (!token) {
    window.location.href = 'index.html';
}

// Helper function to display apartment tier badge
function getHangCanHoBadge(hang) {
    const badges = {
        'BINH_THUONG': '<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Bình thường</span>',
        'TRUNG_CAP': '<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Trung cấp</span>',
        'CAO_CAP': '<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">Cao cấp</span>',
        'PENTHOUSE': '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Penthouse</span>'
    };
    return badges[hang] || badges['BINH_THUONG'];
}

const tableBody = document.getElementById('hoKhauTableBody');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addHoKhauForm');
const searchInput = document.getElementById('searchInput');
let allHoKhauData = []; // Lưu toàn bộ dữ liệu để tìm kiếm
let isHoKhauSetupComplete = false; // Flag để tránh duplicate setup

// 1. Hàm lấy danh sách Hộ khẩu
async function fetchHoKhauList() {
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    try {
        const url = `${API_URL}/hokhau`;
        // Fetching household data
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true',
                'Content-Type': 'application/json'
            }
        });
        
        // Processing response
        
        if (response.status === 401) {
            console.error(' Unauthorized, token may be expired');
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }
        
        const data = await response.json();
        // Response received

        if (data.status === 'success') {
            allHoKhauData = data.data || [];
            renderTable(allHoKhauData);
            
            // Show success message if empty
            if (allHoKhauData.length === 0) {
                if (tableBody) {
                    tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">
                        <div class="py-8">
                            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4l2 2 4-4" />
                            </svg>
                            <p class="text-lg font-medium">Chưa có hộ khẩu nào</p>
                            <p class="text-sm text-gray-400 mt-2">Hãy bắt đầu bằng cách thêm hộ khẩu đầu tiên</p>
                        </div>
                    </td></tr>`;
                }
            }
        } else {
            console.error(' API returned error:', data.message);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Lỗi: ${data.message}</td></tr>`;
            }
        }
    } catch (error) {
        console.error(' Fetch error:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-500">Lỗi kết nối server: ${error.message}</td></tr>`;
        }
    }
}

// 1.5. Hàm tìm kiếm
function handleSearch() {
    const keyword = searchInput.value.toLowerCase().trim();
    
    if (!keyword) {
        renderTable(allHoKhauData);
        return;
    }
    
    const filtered = allHoKhauData.filter(item => 
        item.soCanHo.toLowerCase().includes(keyword) ||
        item.tenChuHo.toLowerCase().includes(keyword) ||
        (item.soDienThoai && item.soDienThoai.includes(keyword)) ||
        (item.ownerCccd && item.ownerCccd.includes(keyword)) ||
        (item.ownerGioiTinh && item.ownerGioiTinh.toLowerCase().includes(keyword)) ||
        (item.ownerEmail && item.ownerEmail.toLowerCase().includes(keyword)) ||
        (item.hangCanHo && getHangCanHoBadgeText(item.hangCanHo).toLowerCase().includes(keyword))
    );
    
    renderTable(filtered);
}

// Gắn sự kiện tìm kiếm
if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
}

// 2. Hàm hiển thị dữ liệu lên bảng
function renderTable(list) {
    if (list.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">Chưa có dữ liệu</td></tr>`;
        return;
    }

    tableBody.innerHTML = list.map(item => {
        // Fix: Check multiple possible fields for member count
        const memberCount = item._count?.nhanKhaus || item._count?.members || item.memberCount || item.soThanhVien || 0;
        const showAddOwnerBtn = memberCount === 0; // Chỉ hiện nút nếu chưa có thành viên
        
        return `
        <tr class="hover:bg-gray-50 transition-colors cursor-pointer" onclick="viewHoKhauDetail('${item.id}')">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.soCanHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.tenChuHo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.soDienThoai || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.dienTich ? item.dienTich + ' m²' : '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">${getHangCanHoBadge(item.hangCanHo)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${memberCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                    ${memberCount} thành viên
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onclick="event.stopPropagation()">
                ${showAddOwnerBtn ? `<button onclick="addChuHoToNhanKhau('${item.id}', \`${item.tenChuHo || ''}\`)" class="text-green-600 hover:text-green-900 mr-3 font-medium transition-colors" title="Thêm chủ hộ vào nhân khẩu">+ Chủ hộ</button>` : ''}
                <button onclick="editHoKhau('${item.id}')" class="text-bluemoon-600 hover:text-bluemoon-900 mr-3 font-medium transition-colors">Sửa</button>
                <button onclick="deleteHoKhau('${item.id}')" class="text-red-600 hover:text-red-900 font-medium transition-colors">Xóa</button>
            </td>
        </tr>
        `;
    }).join('');
}

// 3. Xử lý Modal Thêm mới
function setupModalHandlers() {
    const btnOpen = document.getElementById('btnOpenAddModal');
    const btnClose = document.getElementById('btnCloseAddModal');
    
    // Setting up modal handlers

    if (btnOpen) {
        btnOpen.addEventListener('click', (e) => {
            // Add button clicked
            e.preventDefault();
            if (addModal) {
                addModal.classList.remove('hidden');
                // Modal opened
            } else {
                console.error(' Add modal not found');
            }
        });
        // Add button listener attached
    } else {
        console.error(' Add button not found');
    }

    if (btnClose) {
        btnClose.addEventListener('click', (e) => {
            // Close button clicked
            e.preventDefault();
            if (addModal) {
                addModal.classList.add('hidden');
            }
            if (addForm) {
                addForm.reset();
            }
        });
        // Close button listener attached
    } else {
        console.error(' Close button not found');
    }
}

// Call setup function
setupModalHandlers();

// Preview mã căn hộ khi thêm mới
const addToa = document.getElementById('addToa');
const addTang = document.getElementById('addTang');
const addPhong = document.getElementById('addPhong');
const previewAddMaCanHo = document.getElementById('previewAddMaCanHo');
const hiddenAddSoCanHo = document.getElementById('hiddenAddSoCanHo');

function updateAddPreview() {
    const toa = addToa.value;
    const tang = addTang.value;
    const phong = addPhong.value;
    if (toa && tang && phong) {
        const maCanHo = `BM-${toa}${tang.padStart(2, '0')}${phong.padStart(2, '0')}`;
        previewAddMaCanHo.textContent = `→ Mã căn hộ: ${maCanHo}`;
        hiddenAddSoCanHo.value = maCanHo;
    } else {
        previewAddMaCanHo.textContent = '';
        hiddenAddSoCanHo.value = '';
    }
}

if (addToa) addToa.addEventListener('change', updateAddPreview);
if (addTang) addTang.addEventListener('input', updateAddPreview);
if (addPhong) addPhong.addEventListener('input', updateAddPreview);

// 3. Xử lý Thêm hộ khẩu mới
if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Tạo mã căn hộ từ 3 trường
        const toa = addToa.value;
        const tang = addTang.value.padStart(2, '0');
        const phong = addPhong.value.padStart(2, '0');
        const soCanHo = `BM-${toa}${tang}${phong}`;
        
        // Lấy dữ liệu từ form
        const formData = new FormData(addForm);
        
        // Kiểm tra các trường bắt buộc
        if (!toa || !tang || !phong) {
            if (window.notificationManager) {
                notificationManager.error('Vui lòng chọn đầy đủ tòa, tầng và phòng');
            }
            return;
        }
        
        const tenChuHo = formData.get('tenChuHo');
        if (!tenChuHo || tenChuHo.trim().length < 2) {
            if (window.notificationManager) {
                notificationManager.error('Tên chủ hộ phải có ít nhất 2 ký tự');
            }
            return;
        }
        
        if (!formData.get('hangCanHo')) {
            if (window.notificationManager) {
                notificationManager.error('Vui lòng chọn hạng căn hộ');
            }
            return;
        }

        const data = {
            soCanHo: soCanHo,
            tenChuHo: formData.get('tenChuHo'),
            hangCanHo: formData.get('hangCanHo') || 'BINH_THUONG'
        };
        
        // Chỉ thêm optional fields khi có giá trị
        const soDienThoai = formData.get('soDienThoai');
        if (soDienThoai && soDienThoai.trim()) {
            data.soDienThoai = soDienThoai.trim();
        }
        
        const dienTich = formData.get('dienTich');
        if (dienTich && dienTich.trim()) {
            data.dienTich = parseFloat(dienTich);
        }

        // Validate SĐT nếu có
        const sdt = formData.get('soDienThoai');
        if (sdt && sdt.trim()) {
            if (!/^[0-9]{10,11}$/.test(sdt.trim())) {
                if (window.notificationManager) {
                    notificationManager.error('Số điện thoại phải từ 10-11 chữ số');
                } else {
                    modal.alert({ title: 'Lỗi nhập liệu', message: 'Số điện thoại phải từ 10-11 chữ số', type: 'error' });
                }
                return;
            }
        }

        // Thêm thông tin chủ hộ nếu có
        if (formData.get('cccd') && formData.get('ngaySinh') && formData.get('gioiTinh')) {
            const cccd = formData.get('cccd').trim();
            
            // Validate CCCD: chỉ chứa số và từ 9-12 chữ số
            if (!/^[0-9]{9,12}$/.test(cccd)) {
                if (window.notificationManager) {
                    notificationManager.error('CCCD/CMND phải từ 9-12 chữ số');
                } else {
                    modal.alert({ title: 'Lỗi nhập liệu', message: 'CCCD/CMND phải từ 9-12 chữ số', type: 'error' });
                }
                return;
            }
            
            data.ownerInfo = {
                cccd: cccd,
                ngaySinh: formData.get('ngaySinh'),
                email: formData.get('email') || undefined,
                gioiTinh: formData.get('gioiTinh')
            };
        }

        try {
            const response = await fetch(`${API_URL}/hokhau`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data)
            });

            let result;
            
            // Clone response để có thể đọc nhiều lần nếu cần
            const responseClone = response.clone();
            
            try {
                result = await response.json();
            } catch (parseError) {
                // Nếu không parse được JSON, lấy text từ clone để debug
                try {
                    const textResponse = await responseClone.text();
                    console.error('Failed to parse JSON response:', textResponse);
                } catch (textError) {
                    console.error('Failed to read response as text:', textError);
                }
                throw new Error(`Server trả về dữ liệu không hợp lệ (${response.status})`);
            }

            if (response.ok && result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.success('Thêm hộ khẩu thành công!');
                }
                addModal.classList.add('hidden');
                addForm.reset();
                previewAddMaCanHo.textContent = '';
                hiddenAddSoCanHo.value = '';
                
                // Hỏi có muốn thêm chủ hộ vào nhân khẩu không
                showConfirmAddToNhanKhauModal(result.data.id, data.tenChuHo);
                
                fetchHoKhauList(); // Tải lại danh sách
            } else {
                // Xử lý lỗi validation từ server
                const errorMessage = result.message || `Lỗi ${response.status}: ${response.statusText}`;
                if (window.notificationManager) {
                    notificationManager.error(errorMessage);
                } else {
                    console.error('Server Error:', errorMessage);
                    modal.alert({ title: 'Lỗi', message: errorMessage, type: 'error' });
                }
            }
        } catch (error) {
            console.error('Lỗi thêm hộ khẩu:', error);
            const errorMessage = error.message || 'Không thể kết nối đến server';
            if (window.notificationManager) {
                notificationManager.error(errorMessage);
            } else {
                console.error('Connection error');
            }
        }
    });
}

// 5. Xử lý Sửa hộ khẩu
let currentHoKhauData = null;

window.editHoKhau = async (id) => {
    try {
        // Lấy danh sách hộ khẩu và tìm theo id
        const response = await fetch(`${API_URL}/hokhau`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách hộ khẩu');
        }
        
        const result = await response.json();
        
        if (result.status === 'success' && result.data) {
            // Tìm hộ khẩu theo id trong danh sách
            const hokhau = result.data.find(item => item.id === id);
            
            if (hokhau) {
                currentHoKhauData = hokhau;
                
                // Parse mã căn hộ (VD: BM-A0245 -> Tòa: A, Tầng: 02, Phòng: 45)
                const soCanHo = currentHoKhauData.soCanHo;
                let toa = '', tang = '', phong = '';
                if (soCanHo.startsWith('BM-')) {
                    const parts = soCanHo.substring(3); // Bỏ "BM-"
                    toa = parts[0]; // Tòa (1 ký tự)
                    tang = parts.substring(1, 3); // Tầng (2 ký tự)
                    phong = parts.substring(3, 5); // Phòng (2 ký tự)
                }
                
                // Lấy thông tin chủ hộ từ các trường trong bảng hokhau trước
                let ownerInfo = {
                    cccd: currentHoKhauData.ownerCccd || '',
                    ngaySinh: currentHoKhauData.ownerNgaySinh || '',
                    email: currentHoKhauData.ownerEmail || '',
                    gioiTinh: currentHoKhauData.ownerGioiTinh || ''
                };
                
                // Nếu không có trong hokhau, thì tìm trong nhân khẩu
                if ((!ownerInfo.cccd || !ownerInfo.gioiTinh) && currentHoKhauData.nhanKhaus && currentHoKhauData.nhanKhaus.length > 0) {
                    const owner = currentHoKhauData.nhanKhaus.find(nk => nk.quanHeVoiChuHo === 'Chủ hộ');
                    if (owner) {
                        ownerInfo = {
                            cccd: owner.cccd || ownerInfo.cccd,
                            ngaySinh: owner.ngaySinh || ownerInfo.ngaySinh,
                            email: owner.email || ownerInfo.email,
                            gioiTinh: owner.gioiTinh || ownerInfo.gioiTinh
                        };
                    }
                }
                

                
                // Mở modal và fill data
                document.getElementById('editHoKhauId').value = currentHoKhauData.id;
                document.getElementById('editToa').value = toa;
                document.getElementById('editTang').value = tang;
                document.getElementById('editPhong').value = phong;
                document.getElementById('editTenChuHo').value = currentHoKhauData.tenChuHo || '';
                document.getElementById('editCccd').value = ownerInfo.cccd || '';
                document.getElementById('editNgaySinh').value = ownerInfo.ngaySinh ? ownerInfo.ngaySinh.split('T')[0] : '';
                document.getElementById('editEmail').value = ownerInfo.email || '';
                document.getElementById('editGioiTinh').value = ownerInfo.gioiTinh || 'Nam';
                document.getElementById('editSoDienThoai').value = currentHoKhauData.soDienThoai || '';
                document.getElementById('editDienTich').value = currentHoKhauData.dienTich || '';
                document.getElementById('editHangCanHo').value = currentHoKhauData.hangCanHo || 'BINH_THUONG';
                
                // Update preview
                updateEditPreview();
                
                document.getElementById('editModal').classList.remove('hidden');
            } else {
                if (window.notificationManager) {
                    notificationManager.error(' Lỗi', 'Không tìm thấy hộ khẩu');
                }
            }
        } else {
            if (window.notificationManager) {
                notificationManager.error(' Lỗi', result.message || 'Không tải được dữ liệu');
            }
        }
    } catch (error) {
        console.error('Edit error:', error);
        if (window.notificationManager) {
            notificationManager.error(' Lỗi', 'Không thể tải thông tin hộ khẩu');
        }
    }
};

// Preview mã căn hộ khi sửa
const editToa = document.getElementById('editToa');
const editTang = document.getElementById('editTang');
const editPhong = document.getElementById('editPhong');
const previewEditMaCanHo = document.getElementById('previewEditMaCanHo');
const hiddenEditSoCanHo = document.getElementById('hiddenEditSoCanHo');

function updateEditPreview() {
    const toa = editToa.value;
    const tang = editTang.value;
    const phong = editPhong.value;
    if (toa && tang && phong) {
        const maCanHo = `BM-${toa}${tang.padStart(2, '0')}${phong.padStart(2, '0')}`;
        previewEditMaCanHo.textContent = `→ Mã căn hộ: ${maCanHo}`;
        hiddenEditSoCanHo.value = maCanHo;
    } else {
        previewEditMaCanHo.textContent = '';
        hiddenEditSoCanHo.value = '';
    }
}

if (editToa) editToa.addEventListener('change', updateEditPreview);
if (editTang) editTang.addEventListener('input', updateEditPreview);
if (editPhong) editPhong.addEventListener('input', updateEditPreview);

// 6. Xử lý Xóa với Modern Modal
window.deleteHoKhau = async (id) => {
    const confirmed = await modal.confirm({
        title: 'Xóa hộ khẩu',
        message: 'Bạn có chắc chắn muốn xóa hộ khẩu này? Hành động này không thể hoàn tác.',
        type: 'danger',
        confirmText: 'Xóa',
        cancelText: 'Hủy'
    });

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/hokhau/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        const result = await response.json();

        if (response.ok && result.status === 'success') {
            if (window.notificationManager) {
                notificationManager.success('Đã xóa hộ khẩu thành công');
            } else {
                modal.alert({ title: 'Thành công', message: 'Đã xóa hộ khẩu thành công', type: 'success' });
            }
            fetchHoKhauList();
        } else {
            const errorMsg = result.message || `Lỗi ${response.status}: Không thể xóa hộ khẩu`;
            if (window.notificationManager) {
                notificationManager.error(errorMsg);
            } else {
                modal.alert({ title: 'Lỗi', message: errorMsg, type: 'error' });
            }
        }
    } catch (error) {
        console.error('Lỗi xóa:', error);
        if (window.notificationManager) {
            notificationManager.error('Không thể kết nối đến server');
        } else {
            modal.alert({ title: 'Lỗi kết nối', message: 'Không thể kết nối đến server', type: 'error' });
        }
    }
};

// 7. Xử lý Edit Form
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editHoKhauForm');
const btnCloseEdit = document.getElementById('btnCloseEditModal');

if (btnCloseEdit) btnCloseEdit.addEventListener('click', () => editModal.classList.add('hidden'));

if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('editHoKhauId').value;
        
        // Tạo mã căn hộ từ 3 trường
        const toa = editToa.value;
        const tang = editTang.value.padStart(2, '0');
        const phong = editPhong.value.padStart(2, '0');
        const soCanHo = `BM-${toa}${tang}${phong}`;
        
        // Thu thập dữ liệu trực tiếp từ các input elements
        const tenChuHo = document.getElementById('editTenChuHo').value.trim();
        const cccd = document.getElementById('editCccd').value.trim();
        const ngaySinh = document.getElementById('editNgaySinh').value;
        const email = document.getElementById('editEmail').value.trim();
        const gioiTinh = document.getElementById('editGioiTinh').value;
        const soDienThoai = document.getElementById('editSoDienThoai').value.trim();
        const dienTich = document.getElementById('editDienTich').value;
        const hangCanHo = document.getElementById('editHangCanHo').value;
        
        // Validate required fields
        if (!tenChuHo) {
            alert('Vui lòng nhập tên chủ hộ');
            return;
        }
        
        // Validate CCCD if provided
        if (cccd && (cccd.length < 9 || cccd.length > 12 || !/^[0-9]+$/.test(cccd))) {
            alert('CCCD/CMND phải từ 9-12 chữ số');
            return;
        }
        
        const data = {
            soCanHo: soCanHo,
            tenChuHo: tenChuHo,
            soDienThoai: soDienThoai || null,
            dienTich: dienTich ? parseFloat(dienTich) : null,
            hangCanHo: hangCanHo || 'BINH_THUONG'
        };
        
        // Thêm thông tin chủ hộ nếu có ít nhất CCCD
        if (cccd) {
            data.ownerInfo = {
                cccd: cccd,
                ngaySinh: ngaySinh || null,
                email: email || null,
                gioiTinh: gioiTinh || 'Nam'
            };
        }

        try {
            const response = await fetch(`${API_URL}/hokhau/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok && result && result.status === 'success') {
                if (window.notificationManager) {
                    notificationManager.success('Cập nhật hộ khẩu thành công!');
                } else {
                    alert('Cập nhật hộ khẩu thành công!');
                }
                editModal.classList.add('hidden');
                await fetchHoKhauList();
            } else {
                let errorMsg = 'Không thể cập nhật hộ khẩu';
                if (result && result.message) {
                    errorMsg = result.message;
                } else if (!response.ok) {
                    errorMsg = `Lỗi HTTP ${response.status}: ${response.statusText}`;
                }
                console.error('Lỗi cập nhật:', errorMsg, result);
                if (window.notificationManager) {
                    notificationManager.error(errorMsg);
                } else {
                    alert('Lỗi: ' + errorMsg);
                }
            }
        } catch (error) {
            console.error('Lỗi cập nhật:', error);
            const errorMsg = 'Không thể kết nối đến server: ' + error.message;
            if (window.notificationManager) {
                notificationManager.error(errorMsg);
            } else {
                alert(errorMsg);
            }
        }
    });
}

// Hàm xem chi tiết hộ khẩu
window.viewHoKhauDetail = (id) => {
    try {
        // Tìm hộ khẩu trong data đã load
        const data = allHoKhauData.find(h => h.id === id);
        
        if (!data) {
            if (window.notificationManager) {
                notificationManager.error('Không tìm thấy thông tin hộ khẩu!');
            }
            return;
        }
        
        // Processing detail data
        // Processing household members
        
        // Tìm chủ hộ trong danh sách nhân khẩu hoặc lấy từ HoKhau data
        const owner = data.nhanKhaus?.find(nk => nk.quanHeVoiChuHo === 'Chủ hộ') || {
            cccd: data.ownerCccd,
            ngaySinh: data.ownerNgaySinh,
            gioiTinh: data.ownerGioiTinh,
            email: data.ownerEmail
        };
        
        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div class="space-y-3">
                <div class="border-b pb-2">
                    <h4 class="font-medium text-gray-700">Thông tin căn hộ</h4>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-gray-500">Số căn hộ:</span>
                    <span class="font-medium">${data.soCanHo}</span>
                    <span class="text-gray-500">Diện tích:</span>
                    <span>${data.dienTich ? data.dienTich + ' m²' : 'Chưa cập nhật'}</span>
                    <span class="text-gray-500">Hạng căn hộ:</span>
                    <span>${getHangCanHoBadgeText(data.hangCanHo)}</span>
                </div>
                
                <div class="border-b pb-2 pt-3">
                    <h4 class="font-medium text-gray-700">Thông tin chủ hộ</h4>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-gray-500">Họ tên:</span>
                    <span class="font-medium">${data.tenChuHo}</span>
                    <span class="text-gray-500">CCCD:</span>
                    <span>${owner?.cccd || 'Chưa cập nhật'}</span>
                    <span class="text-gray-500">Ngày sinh:</span>
                    <span>${owner?.ngaySinh ? new Date(owner.ngaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>
                    <span class="text-gray-500">Giới tính:</span>
                    <span>${owner?.gioiTinh || 'Chưa cập nhật'}</span>
                    <span class="text-gray-500">Email:</span>
                    <span>${owner?.email || 'Chưa cập nhật'}</span>
                    <span class="text-gray-500">SĐT:</span>
                    <span>${data.soDienThoai || 'Chưa cập nhật'}</span>
                </div>
                
                <div class="border-b pb-2 pt-3">
                    <h4 class="font-medium text-gray-700">Thống kê</h4>
                </div>
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <span class="text-gray-500">Số thành viên:</span>
                    <span class="font-medium">${data._count?.nhanKhaus || 0} người</span>
                </div>
            </div>
        `;
        
        document.getElementById('detailModal').classList.remove('hidden');
        
    } catch (error) {
        console.error('Lỗi xem chi tiết:', error);
        if (window.notificationManager) {
            notificationManager.error('Có lỗi xảy ra');
        }
    }
};

// Helper function to get plain text for apartment tier
function getHangCanHoBadgeText(hang) {
    const texts = {
        'BINH_THUONG': 'Bình thường',
        'TRUNG_CAP': 'Trung cấp', 
        'CAO_CAP': 'Cao cấp',
        'PENTHOUSE': 'Penthouse'
    };
    return texts[hang] || 'Bình thường';
}

// Function hiển thị modal xác nhận thêm vào nhân khẩu sau khi tạo hộ khẩu
function showConfirmAddToNhanKhauModal(hoKhauId, tenChuHo) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div class="mt-3">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h3 class="text-lg leading-6 font-bold text-gray-900 mb-4 text-center">Thêm Vào Nhân Khẩu?</h3>
                <p class="text-sm text-gray-600 text-center mb-6">Bạn có muốn thêm <span class="font-semibold text-gray-900">${tenChuHo}</span> vào danh sách nhân khẩu không?</p>
                <div class="flex justify-center gap-3">
                    <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium">Bỏ qua</button>
                    <button type="button" onclick="confirmAddOwnerToNhanKhau('${hoKhauId}', '${tenChuHo}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Thêm vào nhân khẩu</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Function xử lý khi user chọn "Thêm vào nhân khẩu"
async function confirmAddOwnerToNhanKhau(hoKhauId, tenChuHo) {
    // Đóng modal xác nhận
    document.querySelector('.fixed.inset-0').remove();
    
    try {
        // Lấy thông tin hộ khẩu để lấy owner data
        const response = await fetch(`${API_URL}/hokhau`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        if (!response.ok) throw new Error('Không thể lấy thông tin hộ khẩu');
        
        const result = await response.json();
        const hokhau = result.data.find(item => item.id === hoKhauId);
        
        if (!hokhau || !hokhau.ownerCccd) {
            throw new Error('Không tìm thấy thông tin chủ hộ');
        }
        
        // Gọi API thêm vào nhân khẩu với data có sẵn
        const addResponse = await fetch(`${API_URL}/hokhau/${hoKhauId}/add-chu-ho`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                cccd: hokhau.ownerCccd,
                ngaySinh: hokhau.ownerNgaySinh,
                gioiTinh: hokhau.ownerGioiTinh,
                email: hokhau.ownerEmail
            })
        });
        
        const addResult = await addResponse.json();
        
        if (addResult.status === 'success') {
            if (window.notificationManager) {
                notificationManager.success('Đã thêm chủ hộ vào nhân khẩu thành công');
            }
            // Đóng modal xác nhận
            const existingModal = document.querySelector('.fixed.inset-0');
            if (existingModal) existingModal.remove();
            
            fetchHoKhauList(); // Refresh danh sách
        } else {
            throw new Error(addResult.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Lỗi thêm chủ hộ:', error);
        if (window.notificationManager) {
            notificationManager.error(error.message || 'Có lỗi xảy ra khi thêm chủ hộ');
        }
    }
}

// Function để thêm chủ hộ vào nhân khẩu (từ nút + Chủ hộ)
window.addChuHoToNhanKhau = async function(hoKhauId, tenChuHo) {
    // Hiển thị modal xác nhận đơn giản
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div class="mt-3">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h3 class="text-lg leading-6 font-bold text-gray-900 mb-4 text-center">Thêm Vào Nhân Khẩu?</h3>
                <p class="text-sm text-gray-600 text-center mb-6">Bạn có muốn thêm <span class="font-semibold text-gray-900">${tenChuHo}</span> vào danh sách nhân khẩu không?</p>
                <div class="flex justify-center gap-3">
                    <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium">Bỏ qua</button>
                    <button type="button" onclick="confirmAddOwnerToNhanKhau('${hoKhauId}', '${tenChuHo}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Thêm vào nhân khẩu</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Xử lý đóng modal chi tiết
document.getElementById('btnCloseDetailModal')?.addEventListener('click', () => {
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.classList.add('hidden');
});

// Chạy khi trang load
document.addEventListener('DOMContentLoaded', () => {
    
    // Chỉ chạy nếu đang ở trang Hộ khẩu
    if (document.getElementById('hoKhauTableBody')) {
        console.log(' Hokhau page detected, starting initialization...');
        
        // Re-setup modal handlers to ensure they work
        setupModalHandlers();
        
        // Setup user info and logout
        setupUserInfo();
        
        // Load data
        fetchHoKhauList();
        
        console.log(' Hokhau page initialization complete');
    } else {
        console.log('ℹ Not on hokhau page, skipping initialization');
    }
});

// Setup user info and logout handler
function setupUserInfo() {
    if (isHoKhauSetupComplete) {
        console.log('HoKhau setup already completed, skipping...');
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
            console.log('Logout clicked in hokhau page');
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
    
    isHoKhauSetupComplete = true;
    console.log('HoKhau setup completed');
}

// Also try to setup immediately in case DOM is already loaded
if (document.readyState === 'loading') {
    console.log(' Document still loading, waiting for DOMContentLoaded');
} else {
    setTimeout(() => {
        if (document.getElementById('hoKhauTableBody')) {
            setupModalHandlers();
            setupUserInfo();
            fetchHoKhauList();
        }
    }, 100);
}
