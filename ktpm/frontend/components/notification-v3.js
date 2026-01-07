// BlueMoon Notification System v3.0 - Fix duration issue
console.log('🔔 BlueMoon Notification v3.0 - Longer duration guaranteed');

class NotificationManager {
    constructor() {
        
        this.notifications = new Set(); // Track all notifications
        this.container = document.createElement('div');
        this.container.id = 'notification-container-v3';
        this.container.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
            max-width: 420px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        if (document.body) {
            document.body.appendChild(this.container);
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                if (document.body) document.body.appendChild(this.container);
            });
        }
    }

    show(title, message, type = 'info', duration = 8000) {
        // Showing notification
        
        const notification = document.createElement('div');
        notification.id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Track this notification
        this.notifications.add(notification);
        
        // Colors based on type
        let bgColor, borderColor, icon;
        switch (type) {
            case 'success':
                bgColor = 'linear-gradient(135deg, #10B981, #059669)';
                borderColor = '#059669';
                icon = '';
                break;
            case 'error':
                bgColor = 'linear-gradient(135deg, #EF4444, #DC2626)';
                borderColor = '#DC2626';
                icon = '';
                break;
            case 'warning':
                bgColor = 'linear-gradient(135deg, #F59E0B, #D97706)';
                borderColor = '#D97706';
                icon = '';
                break;
            case 'payment':
                bgColor = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                borderColor = '#0284c7';
                icon = '';
                duration = 10000; // Payment notifications even longer
                break;
            default:
                bgColor = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
                borderColor = '#0284c7';
                icon = 'ℹ';
        }
        
        notification.style.cssText = `
            background: ${bgColor};
            color: #FFFFFF;
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 16px 20px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            transform: translateX(120%);
            transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            pointer-events: auto;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 60px;
            opacity: 0;
        `;

        notification.innerHTML = `
            <div style="font-size: 20px; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
                <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">${message}</div>
            </div>
            <div style="font-size: 12px; opacity: 0.7; flex-shrink: 0;" id="countdown-${notification.id}">
                ${Math.ceil(duration / 1000)}s
            </div>
        `;

        this.container.appendChild(notification);

        // Animate in with delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
                notification.style.opacity = '1';
            }, 50);
        });

        // Countdown timer
        const countdownInterval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((startTime + duration - Date.now()) / 1000));
            const countdownEl = document.getElementById(`countdown-${notification.id}`);
            if (countdownEl) {
                countdownEl.textContent = `${remaining}s`;
            }
            if (remaining <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);

        const startTime = Date.now();

        // Auto remove after FULL duration - NO early removal
        const timeoutId = setTimeout(() => {
            console.log(`⏰ Auto-removing notification after ${duration}ms`);
            clearInterval(countdownInterval);
            this.remove(notification);
        }, duration);

        // Store timeout ID to prevent conflicts
        notification.dataset.timeoutId = timeoutId;

        // Click to dismiss early
        notification.addEventListener('click', () => {
            console.log(' Manual dismiss clicked');
            clearTimeout(timeoutId);
            clearInterval(countdownInterval);
            this.remove(notification);
        });

        console.log(` Notification created with ${duration}ms duration, ID: ${notification.id}`);
        return notification;
    }

    remove(notification) {
        if (!notification || !this.notifications.has(notification)) {
            return;
        }

        console.log(` Removing notification: ${notification.id}`);
        
        // Remove from tracking
        this.notifications.delete(notification);
        
        // Clear any timeouts
        if (notification.dataset.timeoutId) {
            clearTimeout(notification.dataset.timeoutId);
        }

        // Animate out
        notification.style.transform = 'translateX(120%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
                console.log(` Notification DOM removed: ${notification.id}`);
            }
        }, 500);
    }

    // Specific methods with guaranteed long durations
    success(title, message) {
        // Nếu chỉ có 1 tham số, dùng nó làm message và dùng title mặc định
        if (message === undefined) {
            return this.show('Thành công', title, 'success', 7000);
        }
        return this.show(title, message, 'success', 7000);
    }

    error(title, message) {
        if (message === undefined) {
            return this.show('Lỗi', title, 'error', 8000);
        }
        return this.show(title, message, 'error', 8000);
    }

    warning(title, message) {
        if (message === undefined) {
            return this.show('Cảnh báo', title, 'warning', 6000);
        }
        return this.show(title, message, 'warning', 6000);
    }

    info(title, message) {
        if (message === undefined) {
            return this.show('Thông tin', title, 'info', 5000);
        }
        return this.show(title, message, 'info', 5000);
    }

    payment(title, message) {
        if (message === undefined) {
            return this.show('Thanh toán', title, 'payment', 10000);
        }
        return this.show(title, message, 'payment', 10000);
    }

    // Clear all notifications
    clearAll() {
        // Clearing all notifications
        this.notifications.forEach(notification => {
            this.remove(notification);
        });
    }
}

// Create global modal object for compatibility
window.modal = {
    alert: (options) => {
        const { title = 'Thông báo', message = '', type = 'info' } = options;
        if (window.notificationManager && typeof window.notificationManager.show === 'function') {
            return window.notificationManager.show(title, message, type, 6000);
        }
        // Fallback to simple alert
        alert(`${title}: ${message}`);
        return null;
    },
    
    confirm: (options) => {
        // Return a Promise so that `await modal.confirm()` works correctly
        return new Promise((resolve) => {
            const { title = 'Xác nhận', message = '', onConfirm = () => {}, onCancel = () => {} } = options;
        
        // Create custom confirm dialog
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            min-width: 320px;
            max-width: 500px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: modalSlideIn 0.2s ease-out;
        `;
        
        dialog.innerHTML = `
            <style>
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                
                .modal-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    border: none;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }
                
                .modal-btn:hover {
                    transform: translateY(-1px);
                }
                
                .modal-btn-primary {
                    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                    color: white;
                }
                
                .modal-btn-primary:hover {
                    background: linear-gradient(135deg, #1D4ED8, #1E40AF);
                }
                
                .modal-btn-secondary {
                    background: #F3F4F6;
                    color: #374151;
                }
                
                .modal-btn-secondary:hover {
                    background: #E5E7EB;
                }
            </style>
            <div style="margin-bottom: 16px;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">${title}</h3>
                <p style="margin: 0; color: #6B7280; line-height: 1.5;">${message}</p>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="modal-btn modal-btn-secondary" id="cancelBtn">Hủy</button>
                <button class="modal-btn modal-btn-primary" id="confirmBtn">Xác nhận</button>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        const confirmBtn = dialog.querySelector('#confirmBtn');
        const cancelBtn = dialog.querySelector('#cancelBtn');
        
        const cleanup = () => {
            overlay.remove();
        };
        
            confirmBtn.onclick = () => {
                cleanup();
                onConfirm();
                resolve(true);
            };
            
            cancelBtn.onclick = () => {
                cleanup();
                onCancel();
                resolve(false);
            };
            
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    cleanup();
                    onCancel();
                    resolve(false);
                }
            };
            
            // Focus confirm button
            setTimeout(() => confirmBtn.focus(), 100);
        }); // End of Promise
    }
};

// Initialize global instances
window.NotificationManager = NotificationManager;
window.notificationManager = new NotificationManager();
console.log('✅ BlueMoon Notification v3.0 initialized with longer durations');