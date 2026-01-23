/**
 * DramaPop Common Module - Shared code for all pages
 */

const Common = {
    // Initialize common functionality
    init() {
        this.initHeader();
        this.initMobileSearch();
        this.initLanguageSelector();
        this.initBottomNav();
        this.hideLoading();
    },

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            setTimeout(() => overlay.classList.add('hidden'), 800);
        }
    },

    initHeader() {
        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.getElementById('header');
            if (header) {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }
        });
    },

    initMobileSearch() {
        const mobileSearchBtn = document.getElementById('mobileSearchBtn');
        const mobileSearchModal = document.getElementById('mobileSearchModal');
        const mobileSearchClose = document.getElementById('mobileSearchClose');
        const mobileSearchForm = document.getElementById('mobileSearchForm');
        const mobileSearchInput = document.getElementById('mobileSearchInput');

        mobileSearchBtn?.addEventListener('click', () => {
            mobileSearchModal?.classList.add('active');
            mobileSearchInput?.focus();
        });

        mobileSearchClose?.addEventListener('click', () => {
            mobileSearchModal?.classList.remove('active');
        });

        mobileSearchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = mobileSearchInput?.value?.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        });

        // Desktop search form
        const searchForm = document.getElementById('searchForm');
        const searchInput = document.getElementById('searchInput');

        searchForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = searchInput?.value?.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        });
    },

    initLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        const btn = document.getElementById('languageBtn');
        const dropdown = document.getElementById('languageDropdown');

        if (!selector || !btn || !dropdown) return;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                selector.classList.remove('active');
            }
        });

        dropdown.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.dataset.lang;
                const flag = option.querySelector('.flag-icon').textContent;
                const langName = option.querySelector('span:not(.flag-icon)').textContent;

                btn.querySelector('.flag-icon').textContent = flag;
                btn.querySelector('.lang-text').textContent = langName;

                dropdown.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                localStorage.setItem('preferredLanguage', lang);
                API.setLanguage(lang);

                // Update I18n and translate page
                if (window.I18n) {
                    I18n.setLanguage(lang);
                }

                selector.classList.remove('active');

                Swal.fire({
                    icon: 'success',
                    title: I18n ? I18n.t('alerts.languageChanged') : 'Language Changed',
                    text: `${langName}...`,
                    timer: 1200,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#fff'
                }).then(() => {
                    // Reload page to fetch content in new language
                    window.location.reload();
                });
            });
        });

        // Load saved preference
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            API.setLanguage(savedLang);
            if (window.I18n) {
                I18n.setLanguage(savedLang, false);
            }
            const savedOption = dropdown.querySelector(`[data-lang="${savedLang}"]`);
            if (savedOption) {
                const flag = savedOption.querySelector('.flag-icon').textContent;
                const langName = savedOption.querySelector('span:not(.flag-icon)').textContent;
                btn.querySelector('.flag-icon').textContent = flag;
                btn.querySelector('.lang-text').textContent = langName;
                dropdown.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
                savedOption.classList.add('active');
            }
        }
    },

    initBottomNav() {
        const currentPage = this.getCurrentPageName();
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === currentPage);
        });
    },

    getCurrentPageName() {
        const path = window.location.pathname;
        if (path.includes('history')) return 'history';
        if (path.includes('search')) return 'search';
        if (path.includes('detail')) return 'detail';
        if (path.includes('watch')) return 'watch';
        if (path.includes('category')) return 'category';
        return 'home';
    },

    // Utility functions
    getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    formatTime(sec) {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: message,
            confirmButtonText: 'ตกลง',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#e50914'
        });
    },

    showLoading(message = 'กำลังโหลด...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff',
            didOpen: () => Swal.showLoading()
        });
    },

    closeLoading() {
        Swal.close();
    },

    // Drama card rendering
    renderDramaCard(drama) {
        return `
            <div class="drama-card" data-id="${drama.bookId}">
                <div class="drama-poster">
                    <img src="${drama.cover}" alt="${drama.bookName}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                    ${drama.corner ? `<span class="drama-badge" style="background:${drama.corner.color}">${drama.corner.name}</span>` : ''}
                    <div class="drama-play-overlay">
                        <div class="drama-play-btn"><i class="fas fa-play"></i></div>
                    </div>
                </div>
                <div class="drama-info">
                    <h3 class="drama-title">${drama.bookName}</h3>
                    <div class="drama-meta">
                        <span><i class="fas fa-film"></i> ${drama.chapterCount || 0} ตอน</span>
                        <span><i class="fas fa-eye"></i> ${drama.playCount || '0'}</span>
                    </div>
                </div>
            </div>
        `;
    },

    // Bind click events to drama cards
    bindDramaCardEvents(container) {
        container.querySelectorAll('.drama-card').forEach(card => {
            card.addEventListener('click', () => {
                window.location.href = `detail.html?id=${card.dataset.id}`;
            });
        });
    }
};

// History management
const WatchHistory = {
    STORAGE_KEY: 'dramapop_watch_history',
    MAX_ITEMS: 50,

    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    save(items) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items.slice(0, this.MAX_ITEMS)));
        } catch (e) {
            console.error('Failed to save watch history:', e);
        }
    },

    add(drama) {
        const history = this.getAll();
        // Remove existing entry if exists
        const filtered = history.filter(h => h.bookId !== drama.bookId);
        // Add to beginning
        filtered.unshift({
            bookId: drama.bookId,
            bookName: drama.bookName,
            cover: drama.cover,
            lastEpisode: drama.lastEpisode || 1,
            totalEpisodes: drama.totalEpisodes || 0,
            lastWatched: new Date().toISOString(),
            progress: drama.progress || 0,
            videoPosition: drama.videoPosition || 0  // จำตำแหน่งวิดีโอ
        });
        this.save(filtered);
    },

    update(bookId, updates) {
        const history = this.getAll();
        const index = history.findIndex(h => h.bookId === bookId);
        if (index !== -1) {
            history[index] = { ...history[index], ...updates, lastWatched: new Date().toISOString() };
            this.save(history);
        }
    },

    remove(bookId) {
        const history = this.getAll();
        const filtered = history.filter(h => h.bookId !== bookId);
        this.save(filtered);
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    get(bookId) {
        const history = this.getAll();
        return history.find(h => h.bookId === bookId);
    }
};

window.Common = Common;
window.WatchHistory = WatchHistory;

// Favorites management (รายการโปรด)
const Favorites = {
    STORAGE_KEY: 'dramapop_favorites',

    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    save(items) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Failed to save favorites:', e);
        }
    },

    add(drama) {
        const favorites = this.getAll();
        if (this.isFavorite(drama.bookId)) return;

        favorites.unshift({
            bookId: drama.bookId,
            bookName: drama.bookName,
            cover: drama.cover,
            chapterCount: drama.chapterCount || 0,
            addedAt: new Date().toISOString()
        });
        this.save(favorites);
    },

    remove(bookId) {
        const favorites = this.getAll();
        const filtered = favorites.filter(f => f.bookId !== bookId);
        this.save(filtered);
    },

    isFavorite(bookId) {
        const favorites = this.getAll();
        return favorites.some(f => f.bookId === bookId);
    },

    toggle(drama) {
        if (this.isFavorite(drama.bookId)) {
            this.remove(drama.bookId);
            return false;
        } else {
            this.add(drama);
            return true;
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};

// Video Settings (ตั้งค่าวิดีโอ)
const VideoSettings = {
    STORAGE_KEY: 'dramapop_video_settings',

    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { playbackSpeed: 1, volume: 1 };
        } catch {
            return { playbackSpeed: 1, volume: 1 };
        }
    },

    save(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save video settings:', e);
        }
    },

    getSpeed() {
        return this.getAll().playbackSpeed || 1;
    },

    setSpeed(speed) {
        const settings = this.getAll();
        settings.playbackSpeed = speed;
        this.save(settings);
    },

    getVolume() {
        return this.getAll().volume ?? 1;
    },

    setVolume(volume) {
        const settings = this.getAll();
        settings.volume = volume;
        this.save(settings);
    }
};

window.Favorites = Favorites;
window.VideoSettings = VideoSettings;
