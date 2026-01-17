/**
 * DramaBox API Service
 * ใช้สำหรับเรียกข้อมูลจาก API
 */

const API_BASE = 'https://apith-git-main-popetza38s-projects.vercel.app';

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'API request failed');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * ดึงรายการซีรีส์หน้าหลัก
 */
async function getHome() {
    return fetchAPI('/api/home');
}

/**
 * ดึงรายการซีรีส์แนะนำ
 */
async function getRecommend() {
    return fetchAPI('/api/recommend');
}

/**
 * ดึงรายการ VIP Channel
 */
async function getVIP() {
    return fetchAPI('/api/vip');
}

/**
 * ดึงรายละเอียดซีรีส์
 * @param {string} bookId - ID ของซีรีส์
 */
async function getDetail(bookId) {
    return fetchAPI(`/api/detail/${bookId}/v2`);
}

/**
 * ดึงรายการตอนของซีรีส์
 * @param {string} bookId - ID ของซีรีส์
 */
async function getChapters(bookId) {
    return fetchAPI(`/api/chapters/${bookId}`);
}

/**
 * ดึง URL สำหรับ streaming
 * @param {string} itemId - ID ของตอน
 */
async function getStreamUrl(itemId) {
    return fetchAPI(`/api/stream?itemId=${itemId}`);
}

/**
 * ค้นหาซีรีส์
 * @param {string} keyword - คำค้นหา
 */
async function search(keyword) {
    return fetchAPI(`/api/search?keyword=${encodeURIComponent(keyword)}`);
}

/**
 * ดึงรายการหมวดหมู่ทั้งหมด
 */
async function getCategories() {
    return fetchAPI('/api/categories');
}

/**
 * ดึงซีรีส์ตามหมวดหมู่
 * @param {number} categoryId - ID ของหมวดหมู่
 */
async function getDramasByCategory(categoryId) {
    return fetchAPI(`/api/category/${categoryId}`);
}

/**
 * ดึงข้อมูลทุกตอนสำหรับ download
 * @param {string} bookId - ID ของซีรีส์
 */
async function getDownloadAll(bookId) {
    return fetchAPI(`/download/${bookId}`);
}

// Export functions สำหรับใช้ใน modules อื่น
window.DramaAPI = {
    getHome,
    getRecommend,
    getVIP,
    getDetail,
    getChapters,
    getStreamUrl,
    search,
    getCategories,
    getDramasByCategory,
    getDownloadAll
};
