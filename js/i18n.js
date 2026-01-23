/**
 * DramaPop Internationalization (i18n) Module
 * Supports: Thai (th), English (en), Chinese (zh), Korean (ko)
 */

const I18n = {
    currentLang: 'th',

    translations: {
        th: {
            // Navigation
            nav: {
                home: 'หน้าแรก',
                new: 'มาใหม่',
                popular: 'ยอดนิยม',
                history: 'ประวัติ',
                search: 'ค้นหา'
            },

            // Section titles
            sections: {
                forYou: 'แนะนำสำหรับคุณ',
                newDramas: 'ซีรี่ย์มาใหม่',
                ranking: 'ยอดนิยม',
                trending: 'มาแรง',
                romance: 'โรแมนติก',
                ceo: 'ท่านประธาน',
                fantasy: 'แฟนตาซี',
                period: 'พีเรียด/ย้อนยุค',
                revenge: 'แก้แค้น'
            },

            // Video player
            player: {
                play: 'เล่น',
                pause: 'หยุด',
                skipBack: 'ย้อนกลับ 10 วินาที',
                skipForward: 'ข้ามไป 10 วินาที',
                fullscreen: 'เต็มจอ',
                exitFullscreen: 'ออกจากเต็มจอ',
                speed: 'ความเร็ว',
                mute: 'ปิดเสียง',
                unmute: 'เปิดเสียง',
                selectEpisode: 'เลือกตอน',
                prevEpisode: 'ก่อนหน้า',
                nextEpisode: 'ถัดไป',
                loading: 'กำลังโหลดวิดีโอ...'
            },

            // Common UI
            common: {
                loading: 'กำลังโหลด...',
                error: 'เกิดข้อผิดพลาด',
                viewAll: 'ดูทั้งหมด',
                episodes: 'ตอน',
                episode: 'ตอนที่',
                search: 'ค้นหาซีรี่ย์...',
                noResults: 'ไม่พบผลลัพธ์',
                noData: 'ไม่มีข้อมูล',
                retry: 'ลองอีกครั้ง',
                back: 'กลับ',
                watchNow: 'ดูเลย',
                continueWatching: 'ดูต่อ',
                addToFavorites: 'เพิ่มเข้ารายการโปรด',
                removeFromFavorites: 'ลบออกจากรายการโปรด',
                clearAll: 'ล้างทั้งหมด',
                confirmClear: 'ยืนยันการล้าง',
                cancel: 'ยกเลิก',
                confirm: 'ยืนยัน',
                pullToRefresh: 'ดึงลงเพื่อรีเฟรช',
                releaseToRefresh: 'ปล่อยเพื่อรีเฟรช',
                refreshing: 'กำลังรีเฟรช...'
            },

            // Detail page
            detail: {
                synopsis: 'เรื่องย่อ',
                cast: 'นักแสดง',
                episodeList: 'รายการตอน',
                tags: 'แท็ก',
                views: 'ยอดชม'
            },

            // History page
            history: {
                title: 'ประวัติการรับชม',
                empty: 'ยังไม่มีประวัติการรับชม',
                watchedOn: 'ดูเมื่อ',
                progress: 'ดูถึง',
                clearHistory: 'ล้างประวัติ',
                confirmClearHistory: 'ต้องการล้างประวัติทั้งหมดหรือไม่?'
            },

            // Search page
            searchPage: {
                title: 'ค้นหา',
                placeholder: 'พิมพ์ชื่อซีรี่ย์...',
                recentSearches: 'ค้นหาล่าสุด',
                clearRecent: 'ล้าง',
                searching: 'กำลังค้นหา...',
                resultsFor: 'ผลการค้นหาสำหรับ'
            },

            // PWA & Offline
            pwa: {
                install: 'ติดตั้งแอป',
                installPrompt: 'เพิ่ม DramaPop ลงหน้าจอหลักเพื่อเข้าถึงได้ง่ายขึ้น',
                installNow: 'ติดตั้งเลย',
                later: 'ไว้ทีหลัง',
                newVersion: 'มีเวอร์ชันใหม่',
                updateNow: 'อัพเดทเลย'
            },

            offline: {
                title: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต',
                subtitle: 'ดูเหมือนว่าคุณออฟไลน์อยู่ กรุณาตรวจสอบการเชื่อมต่อของคุณแล้วลองอีกครั้ง',
                retry: 'ลองอีกครั้ง',
                viewHistory: 'ดูประวัติการรับชม (Offline)',
                tipsTitle: '💡 เคล็ดลับ',
                tip1: 'ตรวจสอบว่า WiFi หรือข้อมูลมือถือเปิดอยู่',
                tip2: 'ลองเปิด-ปิดโหมดเครื่องบิน',
                tip3: 'เนื้อหาที่ดูแล้วอาจยังใช้งานได้จาก Cache'
            },

            // Language names
            languages: {
                th: 'ไทย',
                en: 'English',
                zh: '中文',
                ko: '한국어'
            },

            // Alerts/Messages
            alerts: {
                languageChanged: 'เปลี่ยนภาษาสำเร็จ',
                loadingContent: 'กำลังโหลดเนื้อหา...',
                errorLoading: 'ไม่สามารถโหลดข้อมูลได้',
                addedToFavorites: 'เพิ่มเข้ารายการโปรดแล้ว',
                removedFromFavorites: 'ลบออกจากรายการโปรดแล้ว',
                historyCleared: 'ล้างประวัติเรียบร้อย'
            },

            // Hero section
            hero: {
                welcome: 'ยินดีต้อนรับสู่ DramaPop',
                tagline: 'ดูซีรี่ย์ออนไลน์ฟรี คมชัด HD พากย์ไทย ซับไทย'
            }
        },

        en: {
            nav: {
                home: 'Home',
                new: 'New',
                popular: 'Popular',
                history: 'History',
                search: 'Search'
            },

            sections: {
                forYou: 'For You',
                newDramas: 'New Releases',
                ranking: 'Popular',
                trending: 'Trending',
                romance: 'Romance',
                ceo: 'CEO',
                fantasy: 'Fantasy',
                period: 'Historical',
                revenge: 'Revenge'
            },

            player: {
                play: 'Play',
                pause: 'Pause',
                skipBack: 'Back 10s',
                skipForward: 'Forward 10s',
                fullscreen: 'Fullscreen',
                exitFullscreen: 'Exit Fullscreen',
                speed: 'Speed',
                mute: 'Mute',
                unmute: 'Unmute',
                selectEpisode: 'Select Episode',
                prevEpisode: 'Previous',
                nextEpisode: 'Next',
                loading: 'Loading video...'
            },

            common: {
                loading: 'Loading...',
                error: 'Error occurred',
                viewAll: 'View All',
                episodes: 'episodes',
                episode: 'Episode',
                search: 'Search dramas...',
                noResults: 'No results found',
                noData: 'No data available',
                retry: 'Retry',
                back: 'Back',
                watchNow: 'Watch Now',
                continueWatching: 'Continue Watching',
                addToFavorites: 'Add to Favorites',
                removeFromFavorites: 'Remove from Favorites',
                clearAll: 'Clear All',
                confirmClear: 'Confirm Clear',
                cancel: 'Cancel',
                confirm: 'Confirm',
                pullToRefresh: 'Pull to refresh',
                releaseToRefresh: 'Release to refresh',
                refreshing: 'Refreshing...'
            },

            detail: {
                synopsis: 'Synopsis',
                cast: 'Cast',
                episodeList: 'Episodes',
                tags: 'Tags',
                views: 'Views'
            },

            history: {
                title: 'Watch History',
                empty: 'No watch history yet',
                watchedOn: 'Watched on',
                progress: 'Progress',
                clearHistory: 'Clear History',
                confirmClearHistory: 'Clear all watch history?'
            },

            searchPage: {
                title: 'Search',
                placeholder: 'Enter drama name...',
                recentSearches: 'Recent Searches',
                clearRecent: 'Clear',
                searching: 'Searching...',
                resultsFor: 'Results for'
            },

            pwa: {
                install: 'Install App',
                installPrompt: 'Add DramaPop to your home screen for quick access',
                installNow: 'Install Now',
                later: 'Later',
                newVersion: 'New version available',
                updateNow: 'Update Now'
            },

            offline: {
                title: 'No Internet Connection',
                subtitle: 'It seems you are offline. Please check your connection and try again.',
                retry: 'Try Again',
                viewHistory: 'View Watch History (Offline)',
                tipsTitle: '💡 Tips',
                tip1: 'Check if WiFi or mobile data is enabled',
                tip2: 'Try toggling airplane mode',
                tip3: 'Previously viewed content may still be available from cache'
            },

            languages: {
                th: 'Thai',
                en: 'English',
                zh: 'Chinese',
                ko: 'Korean'
            },

            alerts: {
                languageChanged: 'Language changed',
                loadingContent: 'Loading content...',
                errorLoading: 'Failed to load data',
                addedToFavorites: 'Added to favorites',
                removedFromFavorites: 'Removed from favorites',
                historyCleared: 'History cleared'
            },

            hero: {
                welcome: 'Welcome to DramaPop',
                tagline: 'Watch dramas online for free in HD quality'
            }
        },

        zh: {
            nav: {
                home: '首页',
                new: '最新',
                popular: '热门',
                history: '历史',
                search: '搜索'
            },

            sections: {
                forYou: '为你推荐',
                newDramas: '最新上线',
                ranking: '热门排行',
                trending: '正在热播',
                romance: '浪漫爱情',
                ceo: '霸道总裁',
                fantasy: '奇幻仙侠',
                period: '古装剧',
                revenge: '复仇逆袭'
            },

            player: {
                play: '播放',
                pause: '暂停',
                skipBack: '后退10秒',
                skipForward: '前进10秒',
                fullscreen: '全屏',
                exitFullscreen: '退出全屏',
                speed: '倍速',
                mute: '静音',
                unmute: '取消静音',
                selectEpisode: '选集',
                prevEpisode: '上一集',
                nextEpisode: '下一集',
                loading: '视频加载中...'
            },

            common: {
                loading: '加载中...',
                error: '发生错误',
                viewAll: '查看全部',
                episodes: '集',
                episode: '第',
                search: '搜索剧集...',
                noResults: '未找到结果',
                noData: '暂无数据',
                retry: '重试',
                back: '返回',
                watchNow: '立即观看',
                continueWatching: '继续观看',
                addToFavorites: '添加收藏',
                removeFromFavorites: '取消收藏',
                clearAll: '清空全部',
                confirmClear: '确认清空',
                cancel: '取消',
                confirm: '确认',
                pullToRefresh: '下拉刷新',
                releaseToRefresh: '释放刷新',
                refreshing: '刷新中...'
            },

            detail: {
                synopsis: '剧情简介',
                cast: '演员表',
                episodeList: '剧集列表',
                tags: '标签',
                views: '播放量'
            },

            history: {
                title: '观看历史',
                empty: '暂无观看记录',
                watchedOn: '观看于',
                progress: '观看进度',
                clearHistory: '清空历史',
                confirmClearHistory: '确定要清空所有历史记录吗？'
            },

            searchPage: {
                title: '搜索',
                placeholder: '输入剧名...',
                recentSearches: '最近搜索',
                clearRecent: '清空',
                searching: '搜索中...',
                resultsFor: '搜索结果'
            },

            pwa: {
                install: '安装应用',
                installPrompt: '将DramaPop添加到主屏幕以便快速访问',
                installNow: '立即安装',
                later: '稍后',
                newVersion: '有新版本',
                updateNow: '立即更新'
            },

            offline: {
                title: '无网络连接',
                subtitle: '您似乎处于离线状态。请检查网络连接后重试。',
                retry: '重试',
                viewHistory: '查看观看历史(离线)',
                tipsTitle: '💡 提示',
                tip1: '检查WiFi或移动数据是否开启',
                tip2: '尝试开关飞行模式',
                tip3: '之前观看的内容可能仍可从缓存访问'
            },

            languages: {
                th: '泰语',
                en: '英语',
                zh: '中文',
                ko: '韩语'
            },

            alerts: {
                languageChanged: '语言已更改',
                loadingContent: '正在加载内容...',
                errorLoading: '加载数据失败',
                addedToFavorites: '已添加到收藏',
                removedFromFavorites: '已从收藏移除',
                historyCleared: '历史已清空'
            },

            hero: {
                welcome: '欢迎来到 DramaPop',
                tagline: '免费在线观看高清剧集'
            }
        },

        ko: {
            nav: {
                home: '홈',
                new: '최신',
                popular: '인기',
                history: '기록',
                search: '검색'
            },

            sections: {
                forYou: '추천',
                newDramas: '신작',
                ranking: '인기 순위',
                trending: '화제작',
                romance: '로맨스',
                ceo: 'CEO',
                fantasy: '판타지',
                period: '사극',
                revenge: '복수극'
            },

            player: {
                play: '재생',
                pause: '일시정지',
                skipBack: '10초 뒤로',
                skipForward: '10초 앞으로',
                fullscreen: '전체화면',
                exitFullscreen: '전체화면 나가기',
                speed: '배속',
                mute: '음소거',
                unmute: '음소거 해제',
                selectEpisode: '회차 선택',
                prevEpisode: '이전',
                nextEpisode: '다음',
                loading: '비디오 로딩 중...'
            },

            common: {
                loading: '로딩 중...',
                error: '오류가 발생했습니다',
                viewAll: '전체보기',
                episodes: '화',
                episode: '회',
                search: '드라마 검색...',
                noResults: '검색 결과 없음',
                noData: '데이터 없음',
                retry: '다시 시도',
                back: '뒤로',
                watchNow: '지금 보기',
                continueWatching: '이어보기',
                addToFavorites: '즐겨찾기 추가',
                removeFromFavorites: '즐겨찾기 제거',
                clearAll: '전체 삭제',
                confirmClear: '삭제 확인',
                cancel: '취소',
                confirm: '확인',
                pullToRefresh: '당겨서 새로고침',
                releaseToRefresh: '놓으면 새로고침',
                refreshing: '새로고침 중...'
            },

            detail: {
                synopsis: '줄거리',
                cast: '출연진',
                episodeList: '회차 목록',
                tags: '태그',
                views: '조회수'
            },

            history: {
                title: '시청 기록',
                empty: '시청 기록이 없습니다',
                watchedOn: '시청일',
                progress: '진행률',
                clearHistory: '기록 삭제',
                confirmClearHistory: '모든 시청 기록을 삭제하시겠습니까?'
            },

            searchPage: {
                title: '검색',
                placeholder: '드라마 제목 입력...',
                recentSearches: '최근 검색',
                clearRecent: '삭제',
                searching: '검색 중...',
                resultsFor: '검색 결과'
            },

            pwa: {
                install: '앱 설치',
                installPrompt: 'DramaPop을 홈 화면에 추가하여 빠르게 접근하세요',
                installNow: '지금 설치',
                later: '나중에',
                newVersion: '새 버전 있음',
                updateNow: '지금 업데이트'
            },

            offline: {
                title: '인터넷 연결 없음',
                subtitle: '오프라인 상태입니다. 연결을 확인하고 다시 시도해 주세요.',
                retry: '다시 시도',
                viewHistory: '시청 기록 보기 (오프라인)',
                tipsTitle: '💡 팁',
                tip1: 'WiFi 또는 모바일 데이터가 켜져 있는지 확인하세요',
                tip2: '비행기 모드를 껐다 켜보세요',
                tip3: '이전에 본 콘텐츠는 캐시에서 사용 가능할 수 있습니다'
            },

            languages: {
                th: '태국어',
                en: '영어',
                zh: '중국어',
                ko: '한국어'
            },

            alerts: {
                languageChanged: '언어가 변경되었습니다',
                loadingContent: '콘텐츠 로딩 중...',
                errorLoading: '데이터 로드 실패',
                addedToFavorites: '즐겨찾기에 추가됨',
                removedFromFavorites: '즐겨찾기에서 제거됨',
                historyCleared: '기록이 삭제되었습니다'
            },

            hero: {
                welcome: 'DramaPop에 오신 것을 환영합니다',
                tagline: '무료로 HD 드라마를 온라인으로 시청하세요'
            }
        }
    },

    /**
     * Initialize i18n with saved language or default
     */
    init() {
        const savedLang = localStorage.getItem('preferredLanguage') || 'th';
        this.setLanguage(savedLang, true); // true = translate page on init
    },

    /**
     * Get translation for a key path (e.g., 'nav.home')
     * @param {string} keyPath - Dot-separated key path
     * @param {Object} params - Optional parameters for string interpolation
     * @returns {string} Translated string or key if not found
     */
    t(keyPath, params = {}) {
        const keys = keyPath.split('.');
        let result = this.translations[this.currentLang];

        for (const key of keys) {
            if (result && typeof result === 'object' && key in result) {
                result = result[key];
            } else {
                // Fallback to Thai if key not found
                result = this.translations['th'];
                for (const k of keys) {
                    if (result && typeof result === 'object' && k in result) {
                        result = result[k];
                    } else {
                        return keyPath; // Return key path if not found
                    }
                }
                break;
            }
        }

        // String interpolation for parameters
        if (typeof result === 'string' && Object.keys(params).length > 0) {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(new RegExp(`{${key}}`, 'g'), value);
            });
        }

        return result;
    },

    /**
     * Set current language and optionally update the page
     * @param {string} lang - Language code (th, en, zh, ko)
     * @param {boolean} updatePage - Whether to update all page elements
     */
    setLanguage(lang, updatePage = true) {
        if (!this.translations[lang]) {
            console.warn(`Language '${lang}' not supported, falling back to Thai`);
            lang = 'th';
        }

        this.currentLang = lang;
        localStorage.setItem('preferredLanguage', lang);

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        if (updatePage) {
            this.translatePage();
        }
    },

    /**
     * Translate all elements with data-i18n attribute
     */
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');

        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);

            if (translation !== key) {
                // Check if it's an input placeholder
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.placeholder = translation;
                }
                // Check if it's a title attribute
                else if (el.hasAttribute('data-i18n-attr')) {
                    const attr = el.getAttribute('data-i18n-attr');
                    el.setAttribute(attr, translation);
                }
                // Default: update text content
                else {
                    el.textContent = translation;
                }
            }
        });

        // Translate placeholders separately
        const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Translate title attributes
        const titles = document.querySelectorAll('[data-i18n-title]');
        titles.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });
    },

    /**
     * Get current language code
     * @returns {string} Current language code
     */
    getCurrentLanguage() {
        return this.currentLang;
    },

    /**
     * Get all available languages
     * @returns {Array} Array of language objects with code and name
     */
    getAvailableLanguages() {
        return Object.keys(this.translations).map(code => ({
            code,
            name: this.translations[code].languages[code],
            flag: this.getFlag(code)
        }));
    },

    /**
     * Get flag emoji for language code
     * @param {string} code - Language code
     * @returns {string} Flag emoji
     */
    getFlag(code) {
        const flags = {
            th: '🇹🇭',
            en: '🇺🇸',
            zh: '🇨🇳',
            ko: '🇰🇷'
        };
        return flags[code] || '🌐';
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => I18n.init());
} else {
    I18n.init();
}

// Export for global use
window.I18n = I18n;
