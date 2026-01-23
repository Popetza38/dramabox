/**
 * DramaPop API Module
 */
const API = {
    BASE_URL: 'https://dramabos.asia/api/dramabox/api',
    DEFAULT_LANG: localStorage.getItem('preferredLanguage') || 'th',

    setLanguage(lang) {
        this.DEFAULT_LANG = lang;
        localStorage.setItem('preferredLanguage', lang);
    },

    async request(endpoint, params = {}) {
        const url = new URL(`${this.BASE_URL}${endpoint}`);
        if (!params.lang) params.lang = this.DEFAULT_LANG;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'API request failed');
        return data.data;
    },

    async getForYou(page = 1) { return this.request(`/foryou/${page}`); },
    async getNew(page = 1) { return this.request(`/new/${page}`); },
    async getRanking(page = 1) { return this.request(`/rank/${page}`); },
    async search(query, page = 1) { return this.request(`/search/${encodeURIComponent(query)}/${page}`); },
    async getSuggestions(query) { return this.request(`/suggest/${encodeURIComponent(query)}`); },
    async getDramaDetail(bookId) { return this.request(`/drama/${bookId}`); },
    async getChapters(bookId) { return this.request(`/chapters/${bookId}`); },
    async getVideoUrl(bookId, index) { return this.request('/watch/player', { bookId, index }); },
    async getClassify(page = 1) { return this.request(`/classify/${page}`); }
};
window.API = API;
