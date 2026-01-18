// ========================================
// API Module
// ========================================

const API = {
    // Base fetch helper
    async fetch(endpoint, options = {}) {
        try {
            const url = `${CONFIG.API_BASE_URL}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Get home page dramas
    async getHome(page = 1) {
        const data = await this.fetch(`/api/home?page=${page}`);
        return data;
    },

    // Get recommendations
    async getRecommend() {
        const data = await this.fetch('/api/recommend');
        return data;
    },

    // Get VIP/Theater dramas
    async getVIP() {
        const data = await this.fetch('/api/vip');
        return data;
    },

    // Get all categories
    async getCategories() {
        const data = await this.fetch('/api/categories');
        return data;
    },

    // Get dramas by category
    async getByCategory(categoryId, page = 1) {
        const data = await this.fetch(`/api/category/${categoryId}?page=${page}`);
        return data;
    },

    // Search dramas
    async search(query) {
        const data = await this.fetch(`/api/search?keyword=${encodeURIComponent(query)}`);
        return data;
    },

    // Get drama detail
    async getDetail(bookId) {
        const data = await this.fetch(`/api/detail/${bookId}/v2`);
        return data;
    },

    // Get chapters/episodes
    async getChapters(bookId) {
        const data = await this.fetch(`/api/chapters/${bookId}`);
        return data;
    },

    // Get stream URL
    async getStream(bookId, chapterId) {
        const data = await this.fetch(`/api/stream?bookId=${bookId}&chapterId=${chapterId}`);
        return data;
    },

    // Download all chapters info
    async downloadAll(bookId) {
        const data = await this.fetch(`/download/${bookId}`);
        return data;
    }
};

// Make API globally available
window.API = API;
