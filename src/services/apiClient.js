
import axios from 'axios';

const CACHE_PREFIX = 'api_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://egygo-backend-production.up.railway.app',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to get cache key
const getCacheKey = (url, params) => {
    return `${CACHE_PREFIX}${url}_${JSON.stringify(params || {})}`;
};

apiClient.interceptors.request.use(async (config) => {
    // Only cache GET requests
    if (config.method.toLowerCase() === 'get') {
        const key = getCacheKey(config.url, config.params);
        
        if (typeof window !== 'undefined') {
            const cached = sessionStorage.getItem(key);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    // Check strict validity if needed, but for now just return if exists
                    // We can add timestamp check if we want, but requirement says "If data exists... return it instantly"
                    // I will add a basic timestamp check to avoid stale data forever in a session
                    if (Date.now() - parsed.timestamp < CACHE_DURATION) {
                         // Attach a custom property to signal this request should be cancelled or handled specially?
                         // Axios interceptors used to cancel are tricky. 
                         // Better approach: We throw a specific "Cached" error/object and handle it in response interceptor?
                         // Or we use an adapter.
                         
                         // Using an adapter is the cleanest way to mock the response.
                         config.adapter = () => {
                             return Promise.resolve({
                                 data: parsed.data,
                                 status: 200,
                                 statusText: 'OK',
                                 headers: config.headers,
                                 config: config,
                                 request: {}
                             });
                         };
                    }
                } catch (e) {
                    sessionStorage.removeItem(key);
                }
            }
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        // Cache successful GET responses
        if (response.config.method.toLowerCase() === 'get') {
            const key = getCacheKey(response.config.url, response.config.params);
            if (typeof window !== 'undefined') {
                try {
                    const cacheData = {
                        data: response.data,
                        timestamp: Date.now()
                    };
                    sessionStorage.setItem(key, JSON.stringify(cacheData));
                } catch (e) {
                    console.warn('Failed to cache response', e);
                }
            }
        }
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
