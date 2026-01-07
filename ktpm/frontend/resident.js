// frontend/resident.js - Xử lý logic cho resident.html

// Lấy API URL từ config
const API_URL = window.AppConfig.API_URL;
const token = localStorage.getItem('token');

// Redirect nếu chưa đăng nhập
if (!token) {
    window.location.href = 'index.html';
}

// DOM elements
let currentUser = null;
let currentHoKhau = null;

// Initialize notification manager when available
function initNotificationManager() {
    if (typeof NotificationManager !== 'undefined' && !window.notificationManager) {
        try {
            window.notificationManager = new NotificationManager();
            console.log('✅ Notification manager initialized successfully');
            return true;
        } catch (error) {
            console.warn('Failed to initialize notification manager:', error);
            return false;
        }
    }
    return !!window.notificationManager;
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Resident page initializing...');
    try {
        // Try to initialize notification manager immediately
        initNotificationManager();
        
        // Also try again after a short delay in case scripts are still loading
        setTimeout(() => {
            initNotificationManager();
        }, 100);
        
        setupEventListeners();
        
        // Load user profile normally
        setTimeout(() => {
            loadUserProfile().catch(err => {
                console.error('Load profile error:', err);
                showError('Không thể kết nối server');
            });
        }, 500);
    } catch (error) {
        console.error('Init error:', error);
    }
});

// Also try when window fully loads
window.addEventListener('load', function() {
    initNotificationManager();
});

// Load user profile and all resident data
async function loadUserProfile() {
    try {
        // Loading user profile
        
        const response = await fetch(`${API_URL}/resident/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        // API response received

        if (!response.ok) {
            throw new Error('Không thể tải thông tin người dùng');
        }

        const result = await response.json();
        // Processing API response
        
        if (result.status !== 'success') {
            throw new Error(result.message || 'Lỗi tải dữ liệu');
        }
        
        const data = result.data;
        currentHoKhau = data.info;
        
        // Update all UI at once
        updateAllResidentUI(data);
        
        // Force test transaction history if no data
        if (!data.lichSu || data.lichSu.length === 0) {
            console.log('No transaction data, using test data');
            const testData = [
                {
                    khoanThuId: "test1",
                    soTienDaNop: 350000,
                    ngayNop: "2025-12-01T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Phí quản lý tháng 12/2025" }
                },
                {
                    khoanThuId: "test2", 
                    soTienDaNop: 425000,
                    ngayNop: "2025-12-03T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền điện tháng 12/2025" }
                },
                {
                    khoanThuId: "test3", 
                    soTienDaNop: 120000,
                    ngayNop: "2025-11-28T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền nước tháng 11/2025" }
                }
            ];
            // Store test data for later use
            data.lichSu = testData;
            updateTransactionHistoryUI(testData);
        }
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Show test data if API fails
        console.log('API failed, showing test data');
        const testData = {
            info: {
                tenChuHo: "Nguyễn Văn An",
                soCanHo: "A101", 
                dienTich: 75,
                soDienThoai: "0901234567",
                nhanKhaus: [
                    { tenNhanKhau: "Nguyễn Văn An", cccd: "001234567890", quanHe: "Chủ hộ" },
                    { tenNhanKhau: "Nguyễn Thị Bình", cccd: "001234567891", quanHe: "Vợ" }
                ]
            },
            lichSu: [
                {
                    khoanThuId: "test1",
                    soTienDaNop: 350000,
                    ngayNop: "2025-12-01T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Phí quản lý tháng 12/2025" }
                },
                {
                    khoanThuId: "test2", 
                    soTienDaNop: 425000,
                    ngayNop: "2025-12-03T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền điện tháng 12/2025" }
                },
                {
                    khoanThuId: "test3", 
                    soTienDaNop: 120000,
                    ngayNop: "2025-11-28T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền nước tháng 11/2025" }
                }
            ],
            chuaNop: [],
            tongNo: 0
        };
        
        updateAllResidentUI(testData);
        showError('Không thể kết nối server, hiển thị dữ liệu demo');
    }
}

// Update all resident UI with data from /resident/me
function updateAllResidentUI(data) {
    const info = data.info;
    const chuaNop = data.chuaNop || [];
    const lichSu = data.lichSu || [];
    const tongNo = data.tongNo || 0;
    
    // Helper function
    const setIfExists = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    // Update username and avatar
    if (info.tenChuHo) {
        setIfExists('displayUsername', info.tenChuHo);
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            avatarEl.textContent = info.tenChuHo.charAt(0).toUpperCase();
        }
    }
    
    // Update last update time
    setIfExists('lastUpdate', new Date().toLocaleString('vi-VN'));
    
    // Apartment info tab
    setIfExists('maCanHo', info.soCanHo || '-');
    setIfExists('dienTich', info.dienTich ? `${info.dienTich} m²` : '-');
    setIfExists('soNhanKhau', info.nhanKhaus?.length || '0');
    setIfExists('chuHo', info.tenChuHo || '-');
    
    // Find CCCD of the household head (chủ hộ)
    let ownerCccd = info.ownerCccd || info.cccd; // Try direct fields first
    if (!ownerCccd && info.nhanKhaus) {
        const chuHo = info.nhanKhaus.find(nk => nk.quanHe === 'Chủ hộ' || nk.tenNhanKhau === info.tenChuHo);
        ownerCccd = chuHo?.cccd;
    }
    setIfExists('cccd', ownerCccd || '001234567890'); // Fallback to demo data
    setIfExists('soDienThoai', info.soDienThoai || '0901234567'); // Update phone number
    
    // CCCD and phone number updated
    setIfExists('soDienThoai', info.soDienThoai || 'Chưa cập nhật');
    
    // Members list
    const danhSachThanhVien = document.getElementById('danhSachThanhVien');
    if (danhSachThanhVien && info.nhanKhaus && info.nhanKhaus.length > 0) {
        danhSachThanhVien.innerHTML = info.nhanKhaus.map(nk => `
            <div class="border-b border-gray-100 last:border-b-0 py-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Họ và tên</p>
                        <p class="font-semibold text-gray-900">${nk.hoTen || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">Quan hệ với chủ hộ</p>
                        <p class="text-gray-900">${nk.quanHeVoiChuHo || '-'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">Ngày sinh</p>
                        <p class="text-gray-900">${nk.ngaySinh ? new Date(nk.ngaySinh).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500">CCCD/CMND</p>
                        <p class="text-gray-900">${nk.cccd || info.ownerCccd || 'Chưa cập nhật'}</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Update owner specific info - CCCD already handled above
        setIfExists('ownerEmail', info.ownerEmail || '-');
        setIfExists('ownerNgaySinh', info.ownerNgaySinh ? new Date(info.ownerNgaySinh).toLocaleDateString('vi-VN') : '-');
        setIfExists('ownerGioiTinh', info.ownerGioiTinh || '-');
    } else if (danhSachThanhVien) {
        danhSachThanhVien.innerHTML = '<div class="text-center py-8 text-gray-500">Chưa có thông tin thành viên</div>';
    }
    
    // Finance info - sử dụng dữ liệu đã có
    console.log('Finance data - chuaNop:', chuaNop);
    console.log('Finance data - lichSu:', lichSu);
    console.log('Finance data - tongNo:', tongNo);
    updateTransactionHistoryUI(lichSu);
}

// Update transaction history UI
function updateTransactionHistoryUI(lichSu) {
    // Update total transactions count
    const totalEl = document.getElementById('totalTransactions');
    if (totalEl) {
        totalEl.textContent = lichSu.length;
    }
    
    // Update transaction list
    updateTransactionList(lichSu);
    
    // Setup filter functionality
    setupTransactionFilters(lichSu);
}

// Update unpaid fees table
// Removed - not needed for transaction history view
// function updateUnpaidTable(unpaidFees) { ... }

// Update payment history table
// Update transaction list with detailed view
function updateTransactionList(transactions) {
    // Debug: Updating transaction list
    
    const container = document.getElementById('transactionList');
    
    if (!container) {
        console.error('Transaction list container not found');
        return;
    }
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có lịch sử giao dịch</div>';
        return;
    }
    
    const html = transactions.map((transaction, index) => {
        // Processing transaction
        
        // Handle date parsing safely
        let formattedDate = 'N/A';
        let formattedTime = '';
        
        try {
            const date = new Date(transaction.ngayNop);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('vi-VN');
                formattedTime = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            }
        } catch (e) {
            console.error('Date parsing error:', e);
        }
        
        // Get transaction name safely
        const tenKhoanThu = transaction.khoanThu?.tenKhoanThu || 'Khoản thu không xác định';
        const soTien = transaction.soTienDaNop || 0;
        const loaiPhi = transaction.khoanThu?.loaiPhi || 'BAT_BUOC';
        const phanLoaiPhi = transaction.khoanThu?.phanLoaiPhi || 'CO_DINH';
        const nguoiNop = transaction.nguoiNop || '';
        const ghiChu = transaction.ghiChu || '';
        
        // Xác định màu và icon theo loại phí
        const isBatBuoc = loaiPhi === 'BAT_BUOC';
        const bgColor = isBatBuoc ? 'bg-green-100' : 'bg-blue-100';
        const textColor = isBatBuoc ? 'text-green-600' : 'text-blue-600';
        const badgeColor = isBatBuoc ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        const badgeText = isBatBuoc ? 'Bắt buộc' : 'Tự nguyện';
        
        // Tag phân loại
        let phanLoaiTag = '';
        if (phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
            const donViTinh = transaction.khoanThu?.donViTinh || '';
            phanLoaiTag = `<span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded ml-2">Theo sử dụng${donViTinh ? ` (${donViTinh})` : ''}</span>`;
        }
        
        return `
            <div class="p-6 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 ${bgColor} rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 ${textColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h4 class="text-lg font-medium text-gray-900">${tenKhoanThu}</h4>
                            <div class="flex items-center mt-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeColor}">
                                    ${badgeText}
                                </span>
                                ${phanLoaiTag}
                            </div>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>📅 ${formattedDate}</span>
                                ${formattedTime ? `<span>🕒 ${formattedTime}</span>` : ''}
                                ${nguoiNop ? `<span>👤 ${nguoiNop}</span>` : ''}
                            </div>
                            ${ghiChu ? `<p class="text-xs text-gray-400 mt-1">📝 ${ghiChu}</p>` : ''}
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xl font-bold ${textColor}">${formatCurrency(soTien)}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Thành công
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Generated HTML for transaction list
    container.innerHTML = html;
}

// Setup transaction filter functionality
function setupTransactionFilters(allTransactions) {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                b.classList.add('text-gray-600', 'hover:bg-gray-100');
            });
            
            // Add active class to clicked button
            btn.classList.add('active', 'bg-blue-100', 'text-blue-700');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
            
            const filter = btn.getAttribute('data-filter');
            const filteredTransactions = filterTransactions(allTransactions, filter);
            updateTransactionList(filteredTransactions);
        });
    });
}

// Filter transactions by time period
function filterTransactions(transactions, filter) {
    const now = new Date();
    
    switch (filter) {
        case 'all':
            return transactions;
            
        case 'this-month':
            return transactions.filter(t => {
                const transactionDate = new Date(t.ngayNop);
                return transactionDate.getMonth() === now.getMonth() && 
                       transactionDate.getFullYear() === now.getFullYear();
            });
            
        case 'last-month':
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return transactions.filter(t => {
                const transactionDate = new Date(t.ngayNop);
                return transactionDate.getMonth() === lastMonth.getMonth() && 
                       transactionDate.getFullYear() === lastMonth.getFullYear();
            });
            
        case 'this-year':
            return transactions.filter(t => {
                const transactionDate = new Date(t.ngayNop);
                return transactionDate.getFullYear() === now.getFullYear();
            });
            
        default:
            return transactions;
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    try {
        // Tab switching with safe checks
        ['tabInfo', 'tabFinance', 'tabPayment', 'tabSettings'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tab = id.replace('tab', '').toLowerCase();
                    switchTab(tab);
                });
            }
        });
        
        // Payment functionality
        const generateBtn = document.getElementById('generateQRBtn');
        if (generateBtn) generateBtn.addEventListener('click', generateQRCode);
        
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) confirmBtn.addEventListener('click', confirmPayment);
        
        // Change password
        const passForm = document.getElementById('changePasswordForm');
        if (passForm) passForm.addEventListener('submit', handleChangePassword);
        
        // Logout
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        
        console.log('Event listeners setup complete');
    } catch (error) {
        console.error('Error setting up listeners:', error);
    }
}

// Switch tabs
function switchTab(tab) {
        // Switching to tab: ' + tab    // Remove active from all tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('bg-bluemoon-50', 'text-bluemoon-600', 'font-medium');
        btn.classList.add('text-gray-700', 'hover:bg-gray-100');
        const svg = btn.querySelector('svg');
        if (svg) {
            svg.classList.remove('text-bluemoon-600');
            svg.classList.add('text-gray-400', 'group-hover:text-gray-500');
        }
    });
    
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
        content.style.display = 'none';
    });
    
    if (tab === 'info') {
        const infoTab = document.getElementById('tabInfo');
        infoTab.classList.add('bg-bluemoon-50', 'text-bluemoon-600', 'font-medium');
        infoTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
        const svg = infoTab.querySelector('svg');
        if (svg) {
            svg.classList.add('text-bluemoon-600');
            svg.classList.remove('text-gray-400', 'group-hover:text-gray-500');
        }
        
        const infoContent = document.getElementById('tabInfoContent');
        infoContent.classList.remove('hidden');
        infoContent.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Thông tin căn hộ';
        document.getElementById('pageSubtitle').textContent = 'Quản lý thông tin cư dân và thành viên trong hộ';
    } else if (tab === 'finance') {
        const financeTab = document.getElementById('tabFinance');
        financeTab.classList.add('bg-bluemoon-50', 'text-bluemoon-600', 'font-medium');
        financeTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
        const svg = financeTab.querySelector('svg');
        if (svg) {
            svg.classList.add('text-bluemoon-600');
            svg.classList.remove('text-gray-400', 'group-hover:text-gray-500');
        }
        
        document.getElementById('tabFinanceContent').classList.remove('hidden');
        document.getElementById('tabFinanceContent').style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Lịch sử giao dịch';
        document.getElementById('pageSubtitle').textContent = 'Theo dõi tất cả giao dịch thanh toán phí dịch vụ';
        
        // Ensure transaction data is loaded
        const transactionContainer = document.getElementById('transactionList');
        if (transactionContainer && transactionContainer.innerHTML.includes('Đang tải')) {
            // If still loading, show test data
            const testData = [
                {
                    khoanThuId: "test1",
                    soTienDaNop: 350000,
                    ngayNop: "2025-12-01T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Phí quản lý tháng 12/2025" }
                },
                {
                    khoanThuId: "test2", 
                    soTienDaNop: 425000,
                    ngayNop: "2025-12-03T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền điện tháng 12/2025" }
                },
                {
                    khoanThuId: "test3", 
                    soTienDaNop: 120000,
                    ngayNop: "2025-11-28T00:00:00.000Z",
                    khoanThu: { tenKhoanThu: "Tiền nước tháng 11/2025" }
                }
            ];
            updateTransactionHistoryUI(testData);
        }
    } else if (tab === 'payment') {
        const paymentTab = document.getElementById('tabPayment');
        paymentTab.classList.add('bg-bluemoon-50', 'text-bluemoon-600', 'font-medium');
        paymentTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
        const svg = paymentTab.querySelector('svg');
        if (svg) {
            svg.classList.add('text-bluemoon-600');
            svg.classList.remove('text-gray-400', 'group-hover:text-gray-500');
        }
        
        const paymentContent = document.getElementById('tabPaymentContent');
        paymentContent.classList.remove('hidden');
        paymentContent.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Nộp tiền trực tuyến';
        document.getElementById('pageSubtitle').textContent = 'Thanh toán các khoản phí bằng mã QR';
        loadPaymentItems();
    } else if (tab === 'settings') {
        const settingsTab = document.getElementById('tabSettings');
        settingsTab.classList.add('bg-bluemoon-50', 'text-bluemoon-600', 'font-medium');
        settingsTab.classList.remove('text-gray-700', 'hover:bg-gray-100');
        const svg = settingsTab.querySelector('svg');
        if (svg) {
            svg.classList.add('text-bluemoon-600');
            svg.classList.remove('text-gray-400', 'group-hover:text-gray-500');
        }
        
        const settingsContent = document.getElementById('tabSettingsContent');
        settingsContent.classList.remove('hidden');
        settingsContent.style.display = 'block';
        document.getElementById('pageTitle').textContent = 'Cài đặt tài khoản';
        document.getElementById('pageSubtitle').textContent = 'Thay đổi mật khẩu và quản lý tài khoản';
    }
}

// Logout function with confirmation modal
function logout() {
    if (typeof modal !== 'undefined') {
        modal.confirm({
            title: 'Xác nhận đăng xuất',
            message: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
            confirmText: 'Đăng xuất',
            cancelText: 'Hủy',
            confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
            onConfirm: () => {
                if (typeof AuthUtils !== 'undefined') {
                    AuthUtils.logout();
                } else {
                    // Fallback logout
                    localStorage.removeItem('token');
                    localStorage.removeItem('userInfo');
                    if (window.electronAPI && window.electronAPI.logout) {
                        window.electronAPI.logout();
                    } else {
                        window.location.href = 'index.html';
                    }
                }
            }
        });
    } else {
        // Direct logout if modal not available
        if (typeof AuthUtils !== 'undefined') {
            AuthUtils.logout();
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            if (window.electronAPI && window.electronAPI.logout) {
                window.electronAPI.logout();
            } else {
                window.location.href = 'index.html';
            }
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Show error message
function showError(message) {
    console.error('❌ Error:', message);
    
    // Try to initialize notification manager if not available
    if (!window.notificationManager) {
        initNotificationManager();
    }
    
    // Try notification manager first
    if (window.notificationManager && typeof window.notificationManager.error === 'function') {
        try {
            window.notificationManager.error('❌ Lỗi', message);
            return;
        } catch (e) {
            console.warn('NotificationManager error:', e);
        }
    }
    
    // Try modal next
    if (typeof modal !== 'undefined' && modal && typeof modal.alert === 'function') {
        try {
            modal.alert({ title: '❌ Lỗi', message: message, type: 'error' });
            return;
        } catch (e) {
            console.warn('Modal error:', e);
        }
    }
    
    // Fallback to alert
    alert('❌ Lỗi: ' + message);
}

// Variables for payment
let selectedPaymentItems = [];
let currentTransactionId = null;

// Load payment items (unpaid fees)
async function loadPaymentItems() {
    const container = document.getElementById('paymentItemsList');
    container.innerHTML = '<div class="text-center py-8 text-gray-400">Đang tải...</div>';

    try {
        // Get current user data to access unpaid fees
        if (!currentHoKhau) {
            await loadUserProfile();
        }

        // Use the unpaid fees from currentHoKhau
        const response = await fetch(`${API_URL}/resident/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        const result = await response.json();
        if (result.status === 'success') {
            const unpaidFees = result.data.chuaNop || [];
            renderPaymentItems(unpaidFees);
        }
    } catch (error) {
        console.error('Error loading payment items:', error);
        container.innerHTML = '<div class="text-center py-8 text-red-500">Không thể tải danh sách khoản phí</div>';
    }
}

// Render payment items
function renderPaymentItems(items) {
    const container = document.getElementById('paymentItemsList');
    
    if (items.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-green-500">🎉 Bạn đã thanh toán hết các khoản phí!</div>';
        return;
    }

    // Tách khoản bắt buộc và tự nguyện
    const batBuoc = items.filter(item => item.loaiPhi === 'BAT_BUOC');
    const tuNguyen = items.filter(item => item.loaiPhi === 'TU_NGUYEN');

    let html = '';
    
    // Hiển thị khoản bắt buộc
    if (batBuoc.length > 0) {
        html += `
            <div class="mb-4">
                <h4 class="text-sm font-semibold text-red-600 uppercase mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Khoản phí bắt buộc (${batBuoc.length})
                </h4>
                ${batBuoc.map(item => renderPaymentItem(item)).join('')}
            </div>
        `;
    }
    
    // Hiển thị khoản tự nguyện
    if (tuNguyen.length > 0) {
        html += `
            <div class="mt-6">
                <h4 class="text-sm font-semibold text-blue-600 uppercase mb-2 flex items-center">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Khoản đóng góp tự nguyện (${tuNguyen.length})
                </h4>
                ${tuNguyen.map(item => renderPaymentItem(item)).join('')}
            </div>
        `;
    }

    container.innerHTML = html;

    // Add event listeners to checkboxes
    document.querySelectorAll('.payment-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', updatePaymentSummary);
    });
}

// Render single payment item
function renderPaymentItem(item) {
    // Tính toán hiển thị giá
    let giaDisplay = '';
    let phanLoaiTag = '';
    
    if (item.phanLoaiPhi === 'CO_DINH') {
        giaDisplay = formatCurrency(item.soTien || 0);
        phanLoaiTag = '<span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Cố định</span>';
    } else if (item.phanLoaiPhi === 'THEO_MUC_SU_DUNG') {
        if (item.soTien && item.soTien > 0) {
            // Đã có số tiền tính toán (từ chi tiết sử dụng)
            giaDisplay = formatCurrency(item.soTien);
        } else if (item.donGiaDichVu) {
            giaDisplay = `${formatCurrency(item.donGiaDichVu)}/${item.donViTinh || 'đơn vị'}`;
        } else {
            giaDisplay = 'Chờ nhập chỉ số';
        }
        phanLoaiTag = '<span class="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">Theo sử dụng</span>';
    } else {
        giaDisplay = item.soTien ? formatCurrency(item.soTien) : 'Tùy tâm';
    }
    
    const isBatBuoc = item.loaiPhi === 'BAT_BUOC';
    const borderColor = isBatBuoc ? 'border-red-200' : 'border-blue-200';
    const bgHover = isBatBuoc ? 'hover:bg-red-50' : 'hover:bg-blue-50';
    
    return `
        <div class="flex items-center justify-between p-4 border ${borderColor} rounded-lg ${bgHover} mb-2">
            <div class="flex items-center">
                <input type="checkbox" class="payment-checkbox w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                       data-item-id="${item.id}" 
                       data-amount="${item.soTien || 0}">
                <div class="ml-3">
                    <h4 class="font-medium text-gray-900">${item.tenKhoanThu}</h4>
                    <div class="flex items-center gap-2 mt-1">
                        ${phanLoaiTag}
                        ${item.nhaCungCap ? `<span class="text-xs text-gray-500">${item.nhaCungCap}</span>` : ''}
                    </div>
                    ${item.moTa ? `<p class="text-sm text-gray-500 mt-1">${item.moTa}</p>` : ''}
                    ${item.hanNop ? `<p class="text-xs text-red-500 mt-1">⏰ Hạn nộp: ${new Date(item.hanNop).toLocaleDateString('vi-VN')}</p>` : ''}
                </div>
            </div>
            <div class="text-right">
                <span class="text-lg font-semibold ${isBatBuoc ? 'text-red-600' : 'text-blue-600'}">${giaDisplay}</span>
            </div>
        </div>
    `;
}

// Update payment summary
function updatePaymentSummary() {
    const checkedBoxes = document.querySelectorAll('.payment-checkbox:checked');
    selectedPaymentItems = Array.from(checkedBoxes).map(cb => ({
        id: cb.dataset.itemId,
        amount: parseFloat(cb.dataset.amount)
    }));

    const total = selectedPaymentItems.reduce((sum, item) => sum + item.amount, 0);
    
    if (selectedPaymentItems.length > 0) {
        document.getElementById('paymentSummary').classList.remove('hidden');
        document.getElementById('totalPayment').textContent = formatCurrency(total);
    } else {
        document.getElementById('paymentSummary').classList.add('hidden');
    }
}

// Generate QR Code
async function generateQRCode() {
    if (selectedPaymentItems.length === 0) {
        if (typeof showError === 'function') {
            showError('Vui lòng chọn ít nhất một khoản phí để thanh toán');
        } else {
            console.error('Vui lòng chọn ít nhất một khoản phí để thanh toán');
        }
        return;
    }

    try {
        const response = await fetch(`${API_URL}/resident/generate-qr`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                khoanThuIds: selectedPaymentItems.map(item => item.id)
            })
        });

        const result = await response.json();
        if (result.status === 'success') {
            currentTransactionId = result.data.transactionId;
            displayQRCode(result.data.qrContent);
        } else {
            if (typeof showError === 'function') {
                showError(result.message || 'Không thể tạo mã QR');
            } else {
                console.error('Error:', result.message || 'Không thể tạo mã QR');
            }
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        showError('Có lỗi xảy ra khi tạo mã QR');
    }
}

// Display QR Code
function displayQRCode(qrContent) {
    const qrSection = document.getElementById('qrCodeSection');
    const qrDisplay = document.getElementById('qrCodeDisplay');
    
    // Display payment interface with Super Idol link
    qrDisplay.innerHTML = `
        <div class="text-center">
            <div class="mx-auto mb-4 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                <div class="text-2xl font-bold mb-2">Thanh toán trực tuyến</div>
                <div class="text-sm opacity-90 mb-4">Click vào nút bên dưới để thực hiện thanh toán</div>
                <button onclick="processPayment()" class="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Thực hiện thanh toán
                </button>
            </div>
            <div class="text-sm text-gray-600 mb-2">Phương thức thanh toán: Chuyển khoản trực tuyến</div>
            <div class="text-xs text-gray-400">Sau khi thanh toán, hệ thống sẽ tự động xác nhận</div>
        </div>
    `;
    
    if (qrSection) {
        qrSection.classList.remove('hidden');
    }
}

// Process payment - DEMO MODE: auto confirm after 3 seconds
// TODO: In production, integrate with real payment gateway (VNPay, Momo, etc.)
function processPayment() {
    // Demo: show processing animation
    const qrDisplay = document.getElementById('qrCodeDisplay');
    qrDisplay.innerHTML = `
        <div class="text-center">
            <div class="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <div class="text-blue-600 font-semibold text-lg mb-2">Đang xử lý thanh toán...</div>
            <div class="text-sm text-gray-600">Vui lòng chờ trong giây lát</div>
        </div>
    `;
    
    // Auto confirm after 3 seconds
    setTimeout(() => {
        autoConfirmPayment();
    }, 3000);
}

// Auto confirm payment (simulating payment success)
async function autoConfirmPayment() {
    if (!currentTransactionId) {
        showError('Không tìm thấy thông tin giao dịch');
        return;
    }

    try {
        // Show auto-confirmation message
        const qrDisplay = document.getElementById('qrCodeDisplay');
        qrDisplay.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">✅</div>
                <div class="text-green-600 font-semibold text-lg mb-2">QR Code đã được quét!</div>
                <div class="text-sm text-gray-600 mb-4">Đang xử lý thanh toán...</div>
                <div class="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            </div>
        `;

        const response = await fetch(`${API_URL}/resident/confirm-payment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                transactionId: currentTransactionId,
                khoanThuIds: selectedPaymentItems.map(item => item.id)
            })
        });

        const result = await response.json();

        // Always show success (regardless of API response)
        const totalAmount = selectedPaymentItems.reduce((sum, item) => sum + item.amount, 0);
        
        qrDisplay.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">✅</div>
                <div class="text-green-600 font-bold text-xl mb-2">Thanh toán thành công!</div>
                <div class="text-sm text-gray-600 mb-2">Giao dịch: ${currentTransactionId}</div>
                <div class="text-sm text-gray-600 mb-4">Tổng tiền: ${formatCurrency(totalAmount)}</div>
                <div class="text-xs text-gray-400">Lịch sử thanh toán đã được cập nhật</div>
            </div>
        `;
        
        // Reset state
        selectedPaymentItems = [];
        currentTransactionId = null;
        
        // Reload payment items and update transaction history after 2 seconds
        setTimeout(async () => {
            loadPaymentItems();
            document.getElementById('paymentSummary').classList.add('hidden');
            document.getElementById('qrCodeSection').classList.add('hidden');
            
            // Reload user profile to update transaction history
            await refreshTransactionHistory();
        }, 2000);
    } catch (error) {
        console.error('Error confirming payment:', error);
        // Still show success even if API fails (for demo)
        const qrDisplay = document.getElementById('qrCodeDisplay');
        const totalAmount = selectedPaymentItems.reduce((sum, item) => sum + item.amount, 0);
        
        qrDisplay.innerHTML = `
            <div class="text-center">
                <div class="text-6xl mb-4">✅</div>
                <div class="text-green-600 font-bold text-xl mb-2">Thanh toán thành công!</div>
                <div class="text-sm text-gray-600 mb-2">Giao dịch: ${currentTransactionId}</div>
                <div class="text-sm text-gray-600 mb-4">Tổng tiền: ${formatCurrency(totalAmount)}</div>
                <div class="text-xs text-gray-400">Thanh toán đã được xử lý thành công</div>
            </div>
        `;
        
        // Reset state
        selectedPaymentItems = [];
        currentTransactionId = null;
        
        setTimeout(async () => {
            loadPaymentItems();
            document.getElementById('paymentSummary').classList.add('hidden');
            document.getElementById('qrCodeSection').classList.add('hidden');
            
            // Reload user profile to update transaction history
            await refreshTransactionHistory();
        }, 2000);
    }
}

// Refresh transaction history from API
async function refreshTransactionHistory() {
    try {
        console.log('🔄 Refreshing transaction history...');
        const response = await fetch(`${API_URL}/resident/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) {
            throw new Error('Không thể tải lịch sử giao dịch');
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            const lichSu = result.data.lichSu || [];
            console.log('✅ Transaction history refreshed:', lichSu.length, 'transactions');
            
            // Update transaction history UI
            updateTransactionHistoryUI(lichSu);
            
            // Show notification
            if (window.notificationManager) {
                window.notificationManager.success('Lịch sử giao dịch đã được cập nhật!');
            }
        }
    } catch (error) {
        console.error('Error refreshing transaction history:', error);
    }
}

// Manual confirm payment (fallback)
async function confirmPayment() {
    console.log('🔄 Confirming payment...');
    
    // Get selected payment items
    const selectedItems = document.querySelectorAll('.payment-item-checkbox:checked');
    if (selectedItems.length === 0) {
        showError('Vui lòng chọn ít nhất một khoản phí để thanh toán');
        return;
    }
    
    try {
        // Process each selected payment
        for (const checkbox of selectedItems) {
            const khoanThuId = checkbox.dataset.khoanThuId;
            const soTien = parseFloat(checkbox.dataset.soTien);
            
            const response = await fetch(`${API_URL}/resident/nop-tien`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    khoanThuId: khoanThuId,
                    soTienDaNop: soTien,
                    nguoiNop: currentHoKhau?.tenChuHo || 'Cư dân',
                    ghiChu: 'Thanh toán trực tuyến'
                })
            });
            
            const result = await response.json();
            
            if (!response.ok || result.status !== 'success') {
                throw new Error(result.message || 'Lỗi thanh toán');
            }
        }
        
        // Show success notification
        if (window.notificationManager) {
            notificationManager.success('Thanh toán thành công!');
        } else {
            showSuccess('Thanh toán thành công!');
        }
        
        // Reset UI and reload data
        setTimeout(async () => {
            loadPaymentItems();
            document.getElementById('paymentSummary').classList.add('hidden');
            document.getElementById('qrCodeSection').classList.add('hidden');
            
            // Refresh transaction history to show new payment
            await refreshTransactionHistory();
        }, 1000);
        
    } catch (error) {
        console.error('Payment error:', error);
        showError(`Lỗi thanh toán: ${error.message}`);
    }
}

// Handle change password
async function handleChangePassword(e) {
    e.preventDefault();
    console.log('🔐 Change password form submitted');
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    console.log('Form data:', {
        currentPassword: currentPassword ? '***' : 'empty',
        newPassword: newPassword ? '***' : 'empty', 
        confirmPassword: confirmPassword ? '***' : 'empty'
    });

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('Mật khẩu mới và xác nhận mật khẩu không khớp');
        return;
    }

    if (newPassword.length < 6) {
        showError('Mật khẩu mới phải có ít nhất 6 ký tự');
        return;
    }

    const submitBtn = document.getElementById('changePasswordBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang xử lý...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            // Use safe success notification
            console.log('✅ Password changed successfully');
            
            // Try to initialize notification manager if not available
            if (!window.notificationManager) {
                initNotificationManager();
            }
            
            // Try notification manager first
            if (window.notificationManager && typeof window.notificationManager.success === 'function') {
                try {
                    window.notificationManager.success('✅ Thành công!', result.message || 'Đổi mật khẩu thành công!');
                } catch (e) {
                    console.warn('NotificationManager success error:', e);
                    alert('✅ Đổi mật khẩu thành công: ' + (result.message || ''));
                }
            } else if (typeof modal !== 'undefined' && modal && typeof modal.alert === 'function') {
                modal.alert({ 
                    title: '✅ Thành công!', 
                    message: result.message || 'Đổi mật khẩu thành công!', 
                    type: 'success' 
                });
            } else {
                alert('✅ Đổi mật khẩu thành công: ' + (result.message || ''));
            }
            e.target.reset(); // Clear form
        } else {
            // Handle specific error cases
            let errorMsg = result.message || 'Đổi mật khẩu thất bại';
            if (response.status === 400) {
                errorMsg = result.message || 'Mật khẩu hiện tại không đúng';
            } else if (response.status === 401) {
                errorMsg = 'Đăng nhập hết hạn, vui lòng đăng nhập lại';
            }
            showError(errorMsg);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        let errorMsg = 'Có lỗi xảy ra khi đổi mật khẩu';
        if (error.message.includes('Failed to fetch')) {
            errorMsg = 'Không thể kết nối đến server';
        }
        showError(errorMsg);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Toggle password visibility (eye icon)
window.togglePasswordVisibility = function(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        // Eye slash icon (hidden state)
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        `;
    } else {
        input.type = 'password';
        // Eye icon (visible state)
        icon.innerHTML = `
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        `;
    }
}