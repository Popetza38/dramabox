// ========================================
// Configuration
// ========================================

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://apith-git-main-popetza38s-projects.vercel.app',

    // Site Info
    SITE_NAME: 'DramaPop',
    SITE_TITLE: 'DramaPop - ดูซีรี่ย์ออนไลน์ฟรี',
    SITE_DESCRIPTION: 'ดูซีรี่ย์ออนไลน์ พากย์ไทย ซับไทย คุณภาพสูง อัพเดทใหม่ทุกวัน',

    // Local Storage Keys
    STORAGE_KEYS: {
        USER: 'DramaPop_user',
        TOKEN: 'DramaPop_token',
        WATCH_HISTORY: 'DramaPop_history',
        FAVORITES: 'DramaPop_favorites',
        SETTINGS: 'DramaPop_settings',
        DAILY_CHECK: 'DramaPop_daily_check',
        POINTS: 'DramaPop_points',
        AD_UNLOCK: 'DramaPop_ad_unlock'
    },

    // Ads Configuration
    ADS: {
        UNLOCK_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds
        SKIP_POINTS_COST: 10,
        AD_POPUP_ENABLED: false
    },

    // VIP Configuration
    VIP: {
        PACKAGES: [
            { id: 1, name: '7 วัน', days: 7, price: 29, coins: 30 },
            { id: 2, name: '1 เดือน', days: 30, price: 99, coins: 100 },
            { id: 3, name: '3 เดือน', days: 90, price: 249, coins: 250 },
            { id: 4, name: '1 ปี', days: 365, price: 799, coins: 800 }
        ]
    },

    // Daily Check-in Rewards
    DAILY_REWARDS: [5, 5, 10, 10, 15, 20, 30], // Points for each day

    // Video Player
    PLAYER: {
        CONTROLS_HIDE_DELAY: 5000, // 5 seconds
        SKIP_DURATION: 5, // 5 seconds
        VOLUME_STEP: 0.1
    },

    // Pagination
    PAGE_SIZE: 20,

    // Categories
    CATEGORIES: {
        DUBBED: 683,  // พากย์ไทย
        SUB: 0,       // Will filter from API
        NEW: 'new',
        POPULAR: 'popular',
        RECOMMEND: 'recommend'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.ADS);
Object.freeze(CONFIG.VIP);
Object.freeze(CONFIG.PLAYER);
Object.freeze(CONFIG.CATEGORIES);
