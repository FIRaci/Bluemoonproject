// API Helper - Centralized API calls with caching and error handling
class APIHelper {
    constructor() {
        this.API_URL = window.AppConfig.API_URL;
        this.cache = new Map();
        this.cacheDuration = 60000; // 1 minute default
    }

    // Get headers with auth token
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        };
        
        const token = localStorage.getItem('token');
        if (includeAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    // Generic request method with error handling
    async request(endpoint, options = {}) {
        const url = `${this.API_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...this.getHeaders(options.auth !== false),
                    ...options.headers
                }
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                window.location.href = 'index.html';
                throw new Error('Phiên đăng nhập hết hạn');
            }

            // Handle other errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // GET request with optional caching
    async get(endpoint, useCache = false, cacheDuration = this.cacheDuration) {
        const cacheKey = `GET:${endpoint}`;
        
        // Check cache
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < cacheDuration) {
                return cached.data;
            }
        }

        const data = await this.request(endpoint, { method: 'GET' });
        
        // Store in cache
        if (useCache) {
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
        }

        return data;
    }

    // POST request
    async post(endpoint, body) {
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    // PUT request
    async put(endpoint, body) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Clear cache
    clearCache(pattern = null) {
        if (pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // Batch requests
    async batch(requests) {
        return await Promise.all(
            requests.map(({ endpoint, options }) => 
                this.request(endpoint, options)
            )
        );
    }
}

// Export global instance
window.API = new APIHelper();
