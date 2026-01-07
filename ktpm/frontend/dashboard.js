// frontend/dashboard.js

const API_URL = window.AppConfig.API_URL;
const token = localStorage.getItem('token');

// Helper function: Tạo headers với Ngrok bypass
function getHeaders(includeAuth = true) {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
    };
    if (includeAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// 1. Auth Guard: Kiểm tra đăng nhập
if (!token) {
    window.location.href = 'index.html';
}

// Hiển thị tên người dùng - Safe version
BlueMoonUtils.waitForDOM(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (userInfo && userInfo.username) {
        BlueMoonUtils.safeSetText('displayUsername', userInfo.username);
        BlueMoonUtils.safeSetText('userAvatar', userInfo.username.charAt(0).toUpperCase());
    }
});

// 2. Xử lý Đăng xuất
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
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

// 3. Fetch Data & Update Dashboard
let currentYear = new Date().getFullYear();

function fetchDashboardData(year = null) {
    const selectedYear = year || currentYear;
    const url = year ? `${API_URL}/thongke/dashboard?year=${selectedYear}` : `${API_URL}/thongke/dashboard`;
    
    // Fetching dashboard data
    fetch(url, {
        headers: getHeaders()
    })
    .then(response => {
        // Processing dashboard response
        if (response.status === 401) {
            modal.alert({ title: 'Phiên hết hạn', message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', type: 'warning' });
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            updateStats(data.data);
            updateYearSelector(data.data.availableYears, data.data.selectedYear);
        }
    })
    .catch(error => {
        console.error('Lỗi khi lấy dữ liệu dashboard:', error);
        // Hiển thị dữ liệu trống
        updateStats({
            soHoKhau: 0,
            soNhanKhau: 0,
            soKhoanThu: 0,
            tongTienDaThu: 0,
            chartData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        });
    });
}

function updateYearSelector(availableYears, selectedYear) {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    
    const currentYear = new Date().getFullYear();
    
    // Tạo danh sách năm, luôn bao gồm năm hiện tại
    let years = availableYears && availableYears.length > 0 
        ? [...availableYears] 
        : [];
    
    // Đảm bảo năm hiện tại luôn có trong danh sách
    if (!years.includes(currentYear)) {
        years.unshift(currentYear);
    }
    
    // Sắp xếp giảm dần (năm mới nhất lên đầu)
    years.sort((a, b) => b - a);
    
    yearSelect.innerHTML = years.map(year => 
        `<option value="${year}" ${year === selectedYear ? 'selected' : ''}>${year}</option>`
    ).join('');
    
    // Thêm event listener nếu chưa có
    if (!yearSelect.hasAttribute('data-initialized')) {
        yearSelect.setAttribute('data-initialized', 'true');
        yearSelect.addEventListener('change', (e) => {
            const year = parseInt(e.target.value);
            fetchDashboardData(year);
        });
    }
}

function updateStats(data) {
    // Cập nhật số liệu cơ bản - Safe version
    BlueMoonUtils.safeSetText('statHoKhau', data.soHoKhau || 0);
    BlueMoonUtils.safeSetText('statNhanKhau', data.soNhanKhau || 0);
    BlueMoonUtils.safeSetText('statKhoanThu', data.soKhoanThu || 0);
    
    // Format tiền tệ VND
    const formatter = new Intl.NumberFormat('vi-VN');
    BlueMoonUtils.safeSetText('statTongThu', formatter.format(data.tongTienDaThu || 0) + ' ₫');
    
    // Cập nhật thời gian cập nhật cuối
    BlueMoonUtils.safeSetText('lastUpdate', new Date().toLocaleString('vi-VN'));
    
    // Vẽ biểu đồ với dữ liệu thật
    const chartData = data.chartData && Array.isArray(data.chartData) && data.chartData.length > 0 
        ? data.chartData 
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    initChart(chartData);
    
    // Load các sections khác
    loadRecentPayments();
    loadRecentFees();
    loadRecentHouseholds();
    loadRecentResidents();
}

// Load hoạt động thu phí gần đây
async function loadRecentPayments() {
    try {
        const response = await fetch(`${API_URL}/thongke/recent-payments`, {
            headers: getHeaders()
        });
        
        const data = await response.json();
        
        const container = document.getElementById('recentPayments');
        if (!container) return;
        
        if (data.status === 'success' && data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(payment => `
                <div class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 mb-2">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-gray-900">${payment.tenChuHo || 'N/A'}</p>
                            <p class="text-xs text-gray-500">${payment.tenKhoanThu}</p>
                            <p class="text-xs text-blue-600 font-medium">${payment.soCanHo}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-bold text-green-600">${new Intl.NumberFormat('vi-VN').format(payment.soTienDaNop)} ₫</p>
                        <p class="text-xs text-gray-400">${new Date(payment.ngayNop).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
            `).join('');
            

        } else {
            container.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có dữ liệu</div>';
        }
    } catch (error) {
        console.error(' Lỗi load recent payments:', error);
        const container = document.getElementById('recentPayments');
        if (container) {
            container.innerHTML = '<div class="text-center py-8 text-red-400"> Lỗi tải dữ liệu hoạt động thu phí</div>';
        }
        
        if (window.notificationManager) {
            window.notificationManager.error('Lỗi tải dữ liệu', 'Không thể tải hoạt động thu phí gần đây');
        }
    }
}

// Load đợt thu phí gần đây
async function loadRecentFees() {
    try {
        const response = await fetch(`${API_URL}/khoanthu`, {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const container = document.getElementById('recentFees');
            if (!container) return; // Exit if element doesn't exist
            const recentFees = data.data.slice(0, 6); // Lấy 6 khoản thu mới nhất
            
            if (recentFees.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-400 col-span-full">Chưa có đợt thu phí nào</div>';
                return;
            }
            
            container.innerHTML = recentFees.map(fee => {
                // Xác định loại phí để hiển thị
                const phanLoaiText = fee.phanLoaiPhi === 'CO_DINH' ? 'Cố định' : 
                                     fee.phanLoaiPhi === 'THEO_MUC_SU_DUNG' ? 'Theo sử dụng' : 'Khác';
                const phanLoaiClass = fee.phanLoaiPhi === 'CO_DINH' ? 'bg-purple-100 text-purple-800' : 
                                      fee.phanLoaiPhi === 'THEO_MUC_SU_DUNG' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800';
                
                // Tính số tiền hiển thị
                const soTienDisplay = fee.soTien || fee.phiCoDinh || fee.donGiaDichVu || 0;
                
                return `
                <div class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-900">${fee.tenKhoanThu}</h4>
                        <span class="text-xs px-2 py-1 rounded-full ${phanLoaiClass}">
                            ${phanLoaiText}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 mb-2">${new Intl.NumberFormat('vi-VN').format(soTienDisplay)} ₫</p>
                    <p class="text-xs text-gray-500">Tạo: ${new Date(fee.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
            `}).join('');
        }
    } catch (error) {
        console.error('Lỗi load recent fees:', error);
        const container = document.getElementById('recentFees');
        if (container) container.innerHTML = '<div class="text-center py-8 text-red-400 col-span-full">Lỗi tải dữ liệu</div>';
    }
}

// Load hộ khẩu mới thêm gần đây
async function loadRecentHouseholds() {
    try {
        const response = await fetch(`${API_URL}/hokhau`, {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const container = document.getElementById('recentHouseholds');
            if (!container) return; // Exit if element doesn't exist
            const recentHouseholds = data.data.slice(0, 5); // Lấy 5 hộ khẩu mới nhất
            
            if (recentHouseholds.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có hộ khẩu nào</div>';
                return;
            }
            
            container.innerHTML = recentHouseholds.map(household => `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-blue-600 font-semibold text-sm"></span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${household.soCanHo}</p>
                            <p class="text-xs text-gray-500">${household.tenChuHo} - ${household.dienTich}m²</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">${household._count?.nhanKhaus || 0} người</p>
                        <p class="text-xs text-gray-400">${new Date(household.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi load recent households:', error);
        const container = document.getElementById('recentHouseholds');
        if (container) container.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu</div>';
    }
}

// Load nhân khẩu mới thêm gần đây
async function loadRecentResidents() {
    try {
        const response = await fetch(`${API_URL}/nhankhau`, {
            headers: getHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            const container = document.getElementById('recentResidents');
            if (!container) return; // Exit if element doesn't exist
            const recentResidents = data.data.slice(0, 5); // Lấy 5 nhân khẩu mới nhất
            
            if (recentResidents.length === 0) {
                container.innerHTML = '<div class="text-center py-8 text-gray-400">Chưa có nhân khẩu nào</div>';
                return;
            }
            
            container.innerHTML = recentResidents.map(resident => `
                <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span class="text-purple-600 font-semibold text-sm">${resident.hoTen?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${resident.hoTen}</p>
                            <p class="text-xs text-gray-500">${resident.quanHeVoiChuHo} - ${resident.hoKhau?.soCanHo || 'N/A'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-600">${resident.gioiTinh || 'N/A'}</p>
                        <p class="text-xs text-gray-400">${new Date(resident.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Lỗi load recent residents:', error);
        const container = document.getElementById('recentResidents');
        if (container) container.innerHTML = '<div class="text-center py-8 text-red-400">Lỗi tải dữ liệu</div>';
    }
}

// 4. Vẽ biểu đồ (Chart.js)
function initChart(chartData, retryCount = 0) {
    const MAX_RETRIES = 5;
    
    // Kiểm tra Chart.js đã load chưa
    if (typeof Chart === 'undefined') {
        if (retryCount < MAX_RETRIES) {
            // Retrying chart initialization
            setTimeout(() => initChart(chartData, retryCount + 1), 300);
        } else {
            console.error(' Chart.js không load được sau', MAX_RETRIES, 'lần thử');
        }
        return;
    }
    
    const canvas = document.getElementById('revenueChart');
    if (!canvas) {
        console.error(' Không tìm thấy canvas #revenueChart');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Xóa chart cũ nếu có
    if (window.myChart) {
        window.myChart.destroy();
    }
    
    // Đảm bảo chartData có đúng format
    const safeChartData = Array.isArray(chartData) && chartData.length === 12 
        ? chartData 
        : [1.5, 1.8, 2.1, 1.9, 2.3, 2.0, 1.7, 2.2, 1.95, 2.4, 2.1, 0.8];
    
    const data = {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
        datasets: [{
            label: 'Doanh thu (Triệu đồng)',
            data: safeChartData,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointHoverBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 3
        }]
    };

    try {
        window.myChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + 'M ₫';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(1) + 'M ₫';
                            },
                            font: {
                                size: 12
                            },
                            color: '#6b7280'
                        },
                        grid: {
                            borderDash: [5, 5],
                            color: 'rgba(229, 231, 235, 0.8)',
                            drawBorder: false
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#374151'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    line: {
                        tension: 0.4
                    }
                }
            }
        });
        
    } catch (error) {
        console.error(' Lỗi khi tạo biểu đồ:', error);
        // Chỉ log error, không show notification để tránh spam
    }
}

// Khởi chạy khi trang load xong
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    
    // Fallback: Nếu sau 3 giây vẫn không có biểu đồ, tạo biểu đồ demo
    setTimeout(() => {
        const canvas = document.getElementById('revenueChart');
        if (canvas && !window.myChart) {
            // Initializing demo charts
            initChart([0.1, 0.3, 0.2, 0.5, 0.8, 1.2, 0.9, 1.5, 1.1, 0.7, 0.4, 0.6]);
        }
    }, 3000);
});