// Error Handler Utility - Centralized error handling for the application
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    // Log error with context
    log(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || error,
            stack: error.stack,
            context,
            type: error.name || 'Error'
        };

        this.errorLog.push(errorEntry);
        
        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console in development
        if (window.AppConfig.IS_DEV) {
            console.error('Error:', errorEntry);
        }

        return errorEntry;
    }

    // Handle API errors
    handleAPIError(error, showModal = true) {
        this.log(error, { type: 'API' });

        if (showModal && window.modal) {
            let message = 'Đã xảy ra lỗi khi kết nối với máy chủ';
            
            if (error.message) {
                message = error.message;
            }

            window.modal.alert({
                title: 'Lỗi',
                message: message,
                type: 'error'
            });
        }
    }

    // Handle validation errors
    handleValidationError(errors, formId = null) {
        this.log({ message: 'Validation error', errors }, { type: 'Validation' });

        if (formId && errors) {
            // Clear previous errors
            const form = document.getElementById(formId);
            if (form) {
                form.querySelectorAll('.error-message').forEach(el => el.remove());
                form.querySelectorAll('.border-red-500').forEach(el => {
                    el.classList.remove('border-red-500');
                });
            }

            // Display new errors
            Object.keys(errors).forEach(field => {
                const input = document.getElementById(field) || 
                             document.querySelector(`[name="${field}"]`);
                
                if (input) {
                    input.classList.add('border-red-500');
                    
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
                    errorDiv.textContent = errors[field];
                    input.parentNode.appendChild(errorDiv);
                }
            });
        }

        return errors;
    }

    // Handle network errors
    handleNetworkError(showModal = true) {
        this.log({ message: 'Network error' }, { type: 'Network' });

        if (showModal && window.modal) {
            window.modal.alert({
                title: 'Lỗi kết nối',
                message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
                type: 'error'
            });
        }
    }

    // Get error log
    getLog() {
        return [...this.errorLog];
    }

    // Clear error log
    clearLog() {
        this.errorLog = [];
    }

    // Export log for debugging
    exportLog() {
        const blob = new Blob([JSON.stringify(this.errorLog, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `error-log-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Export global instance
window.ErrorHandler = new ErrorHandler();

// Global error handler
window.addEventListener('error', (event) => {
    window.ErrorHandler.log(event.error, {
        type: 'Uncaught',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    window.ErrorHandler.log(event.reason, {
        type: 'UnhandledPromise'
    });
});
