import axios from 'axios';

// Create a dedicated axios instance for admin
// This allows completely separate interceptors and base configuration
const adminClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '', // Fallback to relative path if not set, or proxy
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
adminClient.interceptors.request.use(
    (config) => {
        // Get token from localStorage (standard across the app)
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle 401s
adminClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 Unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // OPTIONAL: Implement Refresh Token Flow here if backend supports it
            // For now, we will just redirect to login on 401

            if (typeof window !== 'undefined') {
                // Clear auth data
                localStorage.removeItem('access_token');
                localStorage.removeItem('laqtaha_user');

                // Redirect to Admin Login
                // We use window.location to ensure a full refresh/clear state
                window.location.href = '/admin/login';
            }
        }

        return Promise.reject(error);
    }
);

// Admin Service API
const adminService = {
    // --- Auth ---
    login: async (email, password) => {
        // Note: Reusing the main auth/login endpoint, assuming it handles admins
        const response = await adminClient.post('/api/auth/login', { email, password });
        return response.data;
    },

    getMe: async () => {
        const response = await adminClient.get('/api/auth/me');
        return response.data;
    },

    logout: async () => {
        // Call backend logout if exists
        try {
            await adminClient.post('/api/auth/logout');
        } catch (e) {
            console.warn('Logout API failed, continuing with client-side cleanup', e);
        }

        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('laqtaha_user');
            window.location.href = '/admin/login';
        }
    },

    // --- Health ---
    checkHealth: async () => {
        const response = await adminClient.get('/api/health');
        return response.data;
    },

    // --- Guides ---
    getPendingGuides: async (page = 1, limit = 20) => {
        const response = await adminClient.get(`/api/admin/guides/pending`, {
            params: { page, limit }
        });
        return response.data;
    },

    getGuideDetails: async (guideId) => {
        const response = await adminClient.get(`/api/admin/guides/${guideId}`);
        return response.data;
    },

    getGuideDocuments: async (guideId) => {
        const response = await adminClient.get(`/api/admin/guides/${guideId}/documents`);
        return response.data;
    },

    verifyDocument: async (guideId, documentId, status, note = '') => {
        const response = await adminClient.put(`/api/admin/guides/${guideId}/verify`, {
            documentId,
            status, // 'approved' | 'rejected'
            note
        });
        return response.data;
    },

    // --- Attractions ---
    getAttractions: async (page = 1, limit = 20, filters = {}) => {
        // Note: Using public endpoint for listing, or if there is an admin specific one use that.
        // Postman collection has /api/attractions (public) and /api/admin/attractions (create only?).
        // Assuming /api/attractions is sufficient for listing or if admin list exists.
        // Checking Postman: "Public Attraction Endpoints" -> Get All Attractions
        // There is NO specific "Get All Attractions (Admin)". We will use the public one.
        // However, for admin purposes (seeing inactive ones), usually there is an admin specific route.
        // The collection has "Create", "Update", "Delete" under Admin.
        // I will try to use /api/attractions first.
        const response = await adminClient.get('/api/attractions', {
            params: { page, limit, ...filters }
        });
        return response.data;
    },

    createAttraction: async (data) => {
        const response = await adminClient.post('/api/admin/attractions', data);
        return response.data;
    },

    updateAttraction: async (id, data) => {
        const response = await adminClient.put(`/api/admin/attractions/${id}`, data);
        return response.data;
    },

    deleteAttraction: async (id) => {
        const response = await adminClient.delete(`/api/admin/attractions/${id}`);
        return response.data;
    },

    // --- Dashboard ---
    // Using direct calls or aggregating if no dedicated KPI endpoint
    getKPIs: async () => {
        // Mocking or deriving if no endpoint. 
        // We can fetch lists with limit 1 to get "total" count if metadata exists.
        // Or just fetch basic stats. 
        // Since there is no specific endpoint in the collection, I'll initiate parallel requests

        // We use Promise.allSettled so one failure doesn't block the others
        const results = await Promise.allSettled([
            adminClient.get('/api/admin/guides/pending?limit=1'),
            adminClient.get('/api/attractions?limit=1')
        ]);

        const stats = {
            pendingGuides: 0,
            totalAttractions: 0,
            featuredAttractions: 0
        };

        // Process Pending Guides Result
        if (results[0].status === 'fulfilled') {
            const res = results[0].value;
            // Handle varied response structures
            stats.pendingGuides = res.data?.results?.length ?? (res.data?.count || 0);
            if (res.data?.pagination?.total) {
                stats.pendingGuides = res.data.pagination.total;
            } else if (res.data?.totalRequest) {
                stats.pendingGuides = res.data.totalRequest;
            }
        } else {
            console.warn('Failed to fetch pending guides KPI:', results[0].reason);
        }

        // Process Attractions Result
        if (results[1].status === 'fulfilled') {
            const res = results[1].value;
            if (res.data?.pagination?.total) {
                stats.totalAttractions = res.data.pagination.total;
            } else if (Array.isArray(res.data?.data)) {
                stats.totalAttractions = res.data.data.length;
            } else if (Array.isArray(res.data)) {
                stats.totalAttractions = res.data.length;
            }
        } else {
            console.warn('Failed to fetch attractions KPI:', results[1].reason);
        }

        return stats;
    }
};

export default adminService;
