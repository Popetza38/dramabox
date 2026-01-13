/**
 * DramaBox API Service Layer
 * Handles all API calls to the local DramaBox REST API
 * API Docs: https://github.com/hndko/dramabox-rest-api-node
 */

const API_BASE = 'apith-gjmy-4m9if0vtu-popetza38s-projects.vercel.app/api';

// Placeholder image as data URI (no external dependency)
const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect fill="%231a1a1a" width="200" height="300"/%3E%3Ctext x="100" y="150" fill="%23666" font-size="14" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
const PLACEHOLDER_HERO = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"%3E%3Crect fill="%231a1a1a" width="800" height="450"/%3E%3Ctext x="400" y="225" fill="%23666" font-size="24" text-anchor="middle"%3EDramaBox%3C/text%3E%3C/svg%3E';

/**
 * Enhanced fetch with retry logic for 429 errors
 */
async function safeFetch(url, options = {}, retries = 3, backoff = 1000) {
    try {
        const response = await fetch(url, options);

        if (response.status === 429 && retries > 0) {
            console.warn(`Rate limited (429). Retrying in ${backoff}ms...`, url);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return safeFetch(url, options, retries - 1, backoff * 2);
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed. Retrying in ${backoff}ms...`, error.message);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return safeFetch(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

const dramaAPI = {
    /**
     * Get home dramas list (หน้าหลัก)
     * @param {number} page - Page number
     * @param {number} size - Items per page
     */
    getHome: async (page = 1, size = 10) => {
        try {
            const result = await safeFetch(`${API_BASE}/home?page=${page}&size=${size}`);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching home:', error);
            return [];
        }
    },

    /**
     * Get VIP dramas (ละคร VIP)
     * API returns nested structure: data.data.columnVoList[].bookList
     */
    getVip: async () => {
        try {
            const result = await safeFetch(`${API_BASE}/vip`);
            // Handle nested structure: data.data.columnVoList
            const vipData = result.data?.data || result.data || result;

            if (vipData && vipData.columnVoList) {
                // Flatten all bookLists from columnVoList into one array
                return vipData.columnVoList.flatMap(col => col.bookList || []);
            }
            return [];
        } catch (error) {
            console.error('Error fetching VIP:', error);
            return [];
        }
    },

    /**
     * Get recommendations (แนะนำ)
     */
    getRecommend: async () => {
        try {
            const result = await safeFetch(`${API_BASE}/recommend`);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            return [];
        }
    },

    /**
     * Search dramas by keyword (ค้นหา)
     * @param {string} keyword - Search keyword
     * @param {number} page - Page number
     * @param {number} size - Items per page
     */
    search: async (keyword, page = 1, size = 20) => {
        try {
            const result = await safeFetch(`${API_BASE}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
            return result.data || [];
        } catch (error) {
            console.error('Error searching:', error);
            return [];
        }
    },

    /**
     * Get drama detail by bookId (รายละเอียดละคร)
     * @param {string} bookId - Drama ID
     */
    getDetail: async (bookId) => {
        try {
            const result = await safeFetch(`${API_BASE}/detail/${bookId}/v2`);
            return result.data || null;
        } catch (error) {
            console.error('Error fetching detail:', error);
            return null;
        }
    },

    /**
     * Get chapters list by bookId (รายการตอน)
     * @param {string} bookId - Drama ID
     */
    getChapters: async (bookId) => {
        try {
            const result = await safeFetch(`${API_BASE}/chapters/${bookId}`);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching chapters:', error);
            return [];
        }
    },

    /**
     * Get stream URL for a specific episode (ลิงก์สตรีม)
     * @param {string} bookId - Drama ID
     * @param {number} episode - Episode number
     */
    getStreamUrl: async (bookId, episode) => {
        try {
            const result = await safeFetch(`${API_BASE}/stream?bookId=${bookId}&episode=${episode}`);
            return result.data || null;
        } catch (error) {
            console.error('Error fetching stream URL:', error);
            return null;
        }
    },

    /**
     * Get all categories (หมวดหมู่)
     */
    getCategories: async () => {
        try {
            const result = await safeFetch(`${API_BASE}/categories`);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    /**
     * Get dramas by category (ละครตามหมวดหมู่)
     * @param {number} categoryId - Category ID
     * @param {number} page - Page number
     * @param {number} size - Items per page
     */
    getByCategory: async (categoryId, page = 1, size = 10) => {
        try {
            const result = await safeFetch(`${API_BASE}/category/${categoryId}?page=${page}&size=${size}`);
            return result.data || [];
        } catch (error) {
            console.error('Error fetching category dramas:', error);
            return [];
        }
    },

    /**
     * Batch download all episodes (ดาวน์โหลดทั้งหมด)
     * @param {string} bookId - Drama ID
     */
    batchDownload: async (bookId) => {
        try {
            const result = await safeFetch(`http://localhost:3000/download/${bookId}`);
            return result.data || [];
        } catch (error) {
            console.error('Error batch downloading:', error);
            return [];
        }
    },

    // ============================================
    // Alias functions for backward compatibility
    // ============================================
    getTrending: async () => dramaAPI.getHome(1, 10),
    getLatest: async () => dramaAPI.getHome(1, 10),
    getForYou: async () => dramaAPI.getRecommend(),
    getAllEpisodes: async (bookId) => dramaAPI.getChapters(bookId),
};

// Utility functions
const utils = {
    /**
     * Debounce function for search
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Get URL parameters
     */
    getUrlParam: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    /**
     * Format number with K/M suffix
     */
    formatNumber: (num) => {
        if (!num) return '0';
        if (typeof num === 'string') {
            return num;
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    /**
     * Create drama card HTML
     * Handles both old format (bookId, bookName) and new format (id, name)
     */
    createDramaCard: (drama) => {
        // Handle different API response formats
        const id = drama.bookId || drama.id;
        const name = drama.bookName || drama.name;
        const cover = drama.coverWap || drama.cover || PLACEHOLDER_IMG;
        const episodes = drama.chapterCount;
        const tags = drama.tags || drama.tagV3s || [];

        // Skip null or invalid items
        if (!id || !name) {
            console.warn('Skipping invalid drama item:', drama);
            return '';
        }

        const episodeText = episodes ? `${episodes} ตอน` : '';
        const displayTags = Array.isArray(tags) ? tags.slice(0, 2) : [];

        return `
            <div class="drama-card" onclick="window.location.href='drama.html?id=${id}'">
                <div class="drama-card-poster">
                    <img src="${cover}" alt="${name}" loading="lazy" 
                         onerror="this.onerror=null; this.src='${PLACEHOLDER_IMG}'">
                    <div class="drama-card-overlay">
                        <div class="drama-card-play"><i data-lucide="play" fill="currentColor"></i></div>
                    </div>
                </div>
                <div class="drama-card-info">
                    <h3 class="drama-card-title">${name}</h3>
                    <div class="drama-card-meta">
                        ${episodeText ? `<span class="drama-card-episodes">${episodeText}</span>` : ''}
                        ${drama.playCount ? `<span><i data-lucide="eye" class="icon-xs"></i> ${utils.formatNumber(drama.playCount)}</span>` : ''}
                    </div>
                    ${displayTags.length > 0 ? `
                        <div class="drama-card-tags">
                            ${displayTags.map(tag => `<span class="tag">${typeof tag === 'string' ? tag : (tag.tagName || tag.name || tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Create skeleton card HTML for loading
     */
    createSkeletonCard: () => {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-poster"></div>
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-meta"></div>
            </div>
        `;
    },

    /**
     * Show loading skeletons
     */
    showLoading: (container, count = 6) => {
        container.innerHTML = Array(count).fill(utils.createSkeletonCard()).join('');
    },

    /**
     * Get placeholder images
     */
    getPlaceholder: () => PLACEHOLDER_IMG,
    getHeroPlaceholder: () => PLACEHOLDER_HERO,

    /**
     * Show SweetAlert loading with custom message
     * @param {string} title - Loading title
     * @param {string} message - Loading message (what is being loaded)
     */
    showLoading: (container, count = 6) => {
        container.innerHTML = Array(count).fill(utils.createSkeletonCard()).join('');
    },

    /**
     * SweetAlert Loading - แสดง loading สวยๆ
     */
    showSwalLoading: (title = 'กำลังโหลด...', message = '') => {
        Swal.fire({
            title: title,
            html: message ? `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                    <div class="swal-loading-spinner"></div>
                    <p style="color: #888; font-size: 0.9rem;">${message}</p>
                </div>
            ` : `
                <div class="swal-loading-spinner"></div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            background: 'linear-gradient(145deg, #1e1e1e, #2d2d2d)',
            color: '#fff',
            customClass: {
                popup: 'swal-loading-popup'
            },
            didOpen: () => {
                // Add custom spinner styles if not exist
                if (!document.getElementById('swal-loading-styles')) {
                    const style = document.createElement('style');
                    style.id = 'swal-loading-styles';
                    style.textContent = `
                        .swal-loading-spinner {
                            width: 50px;
                            height: 50px;
                            border: 4px solid rgba(229, 9, 20, 0.2);
                            border-top-color: #E50914;
                            border-radius: 50%;
                            animation: swal-spin 1s linear infinite;
                        }
                        @keyframes swal-spin {
                            to { transform: rotate(360deg); }
                        }
                        .swal-loading-popup {
                            border-radius: 16px !important;
                            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5) !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        });
    },

    /**
     * Hide SweetAlert loading
     */
    hideSwalLoading: () => {
        Swal.close();
    },

    /**
     * Show SweetAlert loading with progress steps
     */
    showSwalProgress: (title, steps = [], currentStep = 0) => {
        const stepsHtml = steps.map((step, index) => {
            let status = '';
            let icon = '';
            if (index < currentStep) {
                status = 'completed';
                icon = '✓';
            } else if (index === currentStep) {
                status = 'active';
                icon = '◉';
            } else {
                status = 'pending';
                icon = '○';
            }
            return `
                <div class="swal-step ${status}">
                    <span class="swal-step-icon">${icon}</span>
                    <span class="swal-step-text">${step}</span>
                </div>
            `;
        }).join('');

        Swal.fire({
            title: title,
            html: `
                <div class="swal-steps-container">
                    ${stepsHtml}
                </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            allowEscapeKey: false,
            background: 'linear-gradient(145deg, #1e1e1e, #2d2d2d)',
            color: '#fff',
            customClass: {
                popup: 'swal-loading-popup'
            },
            didOpen: () => {
                if (!document.getElementById('swal-steps-styles')) {
                    const style = document.createElement('style');
                    style.id = 'swal-steps-styles';
                    style.textContent = `
                        .swal-steps-container {
                            display: flex;
                            flex-direction: column;
                            gap: 0.75rem;
                            padding: 1rem 0;
                        }
                        .swal-step {
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                            padding: 0.5rem 1rem;
                            border-radius: 8px;
                            transition: all 0.3s ease;
                        }
                        .swal-step.completed {
                            background: rgba(16, 185, 129, 0.2);
                            color: #10b981;
                        }
                        .swal-step.active {
                            background: rgba(229, 9, 20, 0.2);
                            color: #E50914;
                            animation: swal-pulse 1.5s ease-in-out infinite;
                        }
                        .swal-step.pending {
                            color: #666;
                        }
                        .swal-step-icon {
                            font-size: 1.2rem;
                            width: 24px;
                            text-align: center;
                        }
                        .swal-step-text {
                            font-size: 0.9rem;
                        }
                        @keyframes swal-pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.6; }
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        });
    },

    /**
     * Show success notification
     */
    showSuccess: (title, message = '', timer = 2000) => {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            timer: timer,
            showConfirmButton: false,
            background: 'linear-gradient(145deg, #1e1e1e, #2d2d2d)',
            color: '#fff'
        });
    },

    /**
     * Show error notification
     */
    showError: (title, message = '') => {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonColor: '#E50914',
            background: 'linear-gradient(145deg, #1e1e1e, #2d2d2d)',
            color: '#fff'
        });
    }
};

// Export for use in other files
window.dramaAPI = dramaAPI;
window.utils = utils;
window.PLACEHOLDER_IMG = PLACEHOLDER_IMG;
window.PLACEHOLDER_HERO = PLACEHOLDER_HERO;
