// BlueMoon Preload Script - Đảm bảo DOM ready và không có lỗi
console.log(' BlueMoon Preload System');

// 1. Ensure DOM is ready
function waitForDOM(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// 2. Safe element operations
function safeSetText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element && text !== undefined && text !== null) {
        element.textContent = text;
        return true;
    }
    return false;
}

function safeSetHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element && html !== undefined && html !== null) {
        element.innerHTML = html;
        return true;
    }
    return false;
}

// 3. Safe click handlers
function safeAddClick(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element && typeof handler === 'function') {
        element.addEventListener('click', handler);
        return true;
    }
    return false;
}

// 4. Error catching wrapper
function safeExecute(fn, errorMessage = 'Error in safe execution') {
    try {
        return fn();
    } catch (error) {
        console.warn(errorMessage, error);
        return null;
    }
}

// 5. Global safe functions
window.BlueMoonUtils = {
    waitForDOM,
    safeSetText,
    safeSetHTML,
    safeAddClick,
    safeExecute
};

// 6. Override console errors for better debugging
const originalError = console.error;
console.error = function(...args) {
    // Filter out common Electron errors
    const message = args.join(' ');
    if (message.includes('Unable to load preload script') || 
        message.includes('fs/promises') ||
        message.includes('carbonless-monumentally')) {
        console.warn(' Filtered error:', ...args);
        return;
    }
    originalError.apply(console, args);
};

console.log(' BlueMoon Preload System Ready');