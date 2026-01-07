// Modern Modal Component for BlueMoon App

class Modal {
    constructor() {
        this.modalContainer = null;
    }

    // Show confirmation dialog
    confirm(options = {}) {
        const {
            title = 'Xác nhận',
            message = 'Bạn có chắc chắn?',
            confirmText = 'Xác nhận',
            cancelText = 'Hủy',
            type = 'warning' // warning, danger, info, success
        } = options;

        return new Promise((resolve) => {
            const iconMap = {
                warning: `<svg class="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>`,
                danger: `<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>`,
                info: `<svg class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                success: `<svg class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`
            };

            const btnColorMap = {
                warning: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
                info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
                success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            };

            const modalHTML = `
                <div class="fixed inset-0 z-50 overflow-y-auto" id="confirmModal" style="display: flex; align-items: center; justify-content: center;">
                    <!-- Backdrop -->
                    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" style="z-index: -1;"></div>
                    
                    <!-- Modal Content -->
                    <div class="relative bg-white rounded-xl shadow-2xl w-full transform transition-all" style="max-width: 450px; margin: 20px;">
                        <div class="p-6 text-center">
                            <!-- Icon -->
                            <div class="mx-auto flex items-center justify-center h-16 w-16 mb-4">
                                ${iconMap[type]}
                            </div>
                            
                            <!-- Title -->
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${title}</h3>
                            
                            <!-- Message -->
                            <p class="text-gray-600 mb-6" style="word-wrap: break-word; overflow-wrap: break-word;">${message}</p>
                            
                            <!-- Actions -->
                            <div class="flex gap-3 justify-center">
                                <button id="modalConfirm" style="background-color: #dc2626; color: white;" class="px-6 py-2.5 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors hover:opacity-90">
                                    ${confirmText}
                                </button>
                                <button id="modalCancel" class="px-6 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
                                    ${cancelText}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modalContainer = document.getElementById('confirmModal');

            const confirmBtn = document.getElementById('modalConfirm');
            const cancelBtn = document.getElementById('modalCancel');

            const cleanup = () => {
                this.modalContainer.remove();
                this.modalContainer = null;
            };

            confirmBtn.addEventListener('click', () => {
                cleanup();
                resolve(true);
            });

            cancelBtn.addEventListener('click', () => {
                cleanup();
                resolve(false);
            });

            // Close on backdrop click
            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer || e.target.classList.contains('bg-opacity-50')) {
                    cleanup();
                    resolve(false);
                }
            });
        });
    }

    // Show alert/notification
    alert(options = {}) {
        const {
            title = 'Thông báo',
            message = '',
            type = 'info', // success, error, warning, info
            buttonText = 'Đóng'
        } = options;

        return new Promise((resolve) => {
            const iconMap = {
                success: `<svg class="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                error: `<svg class="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`,
                warning: `<svg class="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>`,
                info: `<svg class="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>`
            };

            const btnColorMap = {
                success: 'bg-green-600 hover:bg-green-700',
                error: 'bg-red-600 hover:bg-red-700',
                warning: 'bg-yellow-600 hover:bg-yellow-700',
                info: 'bg-blue-600 hover:bg-blue-700'
            };

            const modalHTML = `
                <div class="fixed inset-0 z-50 overflow-y-auto" id="alertModal" style="display: flex; align-items: center; justify-content: center;">
                    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" style="z-index: -1;"></div>
                    <div class="relative bg-white rounded-xl shadow-2xl w-full transform transition-all" style="max-width: 400px; margin: 20px;">
                        <div class="p-6 text-center">
                            <div class="mx-auto flex items-center justify-center h-16 w-16 mb-4">
                                ${iconMap[type]}
                            </div>
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${title}</h3>
                            <p class="text-gray-600 mb-6" style="word-wrap: break-word; overflow-wrap: break-word;">${message}</p>
                            <button id="alertClose" style="background-color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : type === 'warning' ? '#ca8a04' : '#2563eb'}; color: white;" class="w-full px-6 py-2.5 font-medium rounded-lg focus:outline-none focus:ring-2 transition-colors hover:opacity-90">
                                ${buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            this.modalContainer = document.getElementById('alertModal');

            const closeBtn = document.getElementById('alertClose');
            const cleanup = () => {
                this.modalContainer.remove();
                this.modalContainer = null;
                resolve();
            };

            closeBtn.addEventListener('click', cleanup);
            this.modalContainer.addEventListener('click', (e) => {
                if (e.target === this.modalContainer || e.target.classList.contains('bg-opacity-50')) {
                    cleanup();
                }
            });
        });
    }

    // Show toast notification
    toast(options = {}) {
        const {
            message = '',
            type = 'info', // success, error, warning, info
            duration = 3000
        } = options;

        const bgColorMap = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };

        const iconMap = {
            success: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`,
            error: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`,
            warning: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
            info: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        };

        const toastHTML = `
            <div class="fixed top-4 right-4 z-50 ${bgColorMap[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 transform transition-all duration-300 animate-slide-in" id="toast-${Date.now()}">
                ${iconMap[type]}
                <span class="font-medium">${message}</span>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHTML);
        const toastElement = document.body.lastElementChild;

        setTimeout(() => {
            toastElement.style.transform = 'translateX(400px)';
            toastElement.style.opacity = '0';
            setTimeout(() => toastElement.remove(), 300);
        }, duration);
    }
}

// Global instance
window.modal = new Modal();
