// ========================================
// Storage Module
// ========================================

const Storage = {
    // Get item from localStorage
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },

    // Set item to localStorage
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    // Remove item from localStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    // Clear all storage
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    // Watch History
    history: {
        get() {
            return Storage.get(CONFIG.STORAGE_KEYS.WATCH_HISTORY) || [];
        },

        add(item) {
            const history = this.get();
            const existingIndex = history.findIndex(h => h.bookId === item.bookId);

            const newItem = {
                ...item,
                watchedAt: Date.now(),
                progress: item.progress || 0
            };

            if (existingIndex > -1) {
                history.splice(existingIndex, 1);
            }

            history.unshift(newItem);

            // Keep only last 100 items
            if (history.length > 100) {
                history.pop();
            }

            Storage.set(CONFIG.STORAGE_KEYS.WATCH_HISTORY, history);
        },

        updateProgress(bookId, chapterId, progress, duration) {
            const history = this.get();
            const item = history.find(h => h.bookId === bookId);

            if (item) {
                item.lastChapterId = chapterId;
                item.progress = progress;
                item.duration = duration;
                item.progressPercent = duration > 0 ? Math.round((progress / duration) * 100) : 0;
                item.watchedAt = Date.now();
                Storage.set(CONFIG.STORAGE_KEYS.WATCH_HISTORY, history);
            }
        },

        remove(bookId) {
            const history = this.get();
            const filtered = history.filter(h => h.bookId !== bookId);
            Storage.set(CONFIG.STORAGE_KEYS.WATCH_HISTORY, filtered);
        },

        clear() {
            Storage.set(CONFIG.STORAGE_KEYS.WATCH_HISTORY, []);
        }
    },

    // Favorites
    favorites: {
        get() {
            return Storage.get(CONFIG.STORAGE_KEYS.FAVORITES) || [];
        },

        add(item) {
            const favorites = this.get();
            if (!favorites.find(f => f.bookId === item.bookId)) {
                favorites.unshift({
                    ...item,
                    addedAt: Date.now()
                });
                Storage.set(CONFIG.STORAGE_KEYS.FAVORITES, favorites);
            }
        },

        remove(bookId) {
            const favorites = this.get();
            const filtered = favorites.filter(f => f.bookId !== bookId);
            Storage.set(CONFIG.STORAGE_KEYS.FAVORITES, filtered);
        },

        isFavorite(bookId) {
            const favorites = this.get();
            return favorites.some(f => f.bookId === bookId);
        },

        toggle(item) {
            if (this.isFavorite(item.bookId)) {
                this.remove(item.bookId);
                return false;
            } else {
                this.add(item);
                return true;
            }
        }
    },

    // Ad unlock tracking
    adUnlock: {
        get(bookId) {
            const unlocks = Storage.get(CONFIG.STORAGE_KEYS.AD_UNLOCK) || {};
            return unlocks[bookId] || null;
        },

        set(bookId) {
            const unlocks = Storage.get(CONFIG.STORAGE_KEYS.AD_UNLOCK) || {};
            unlocks[bookId] = Date.now();
            Storage.set(CONFIG.STORAGE_KEYS.AD_UNLOCK, unlocks);
        },

        isUnlocked(bookId) {
            const unlockTime = this.get(bookId);
            if (!unlockTime) return false;
            return (Date.now() - unlockTime) < CONFIG.ADS.UNLOCK_DURATION;
        },

        getRemainingTime(bookId) {
            const unlockTime = this.get(bookId);
            if (!unlockTime) return 0;
            const remaining = CONFIG.ADS.UNLOCK_DURATION - (Date.now() - unlockTime);
            return Math.max(0, remaining);
        }
    },

    // Points
    points: {
        get() {
            return Storage.get(CONFIG.STORAGE_KEYS.POINTS) || 0;
        },

        add(amount) {
            const current = this.get();
            Storage.set(CONFIG.STORAGE_KEYS.POINTS, current + amount);
            return current + amount;
        },

        subtract(amount) {
            const current = this.get();
            const newAmount = Math.max(0, current - amount);
            Storage.set(CONFIG.STORAGE_KEYS.POINTS, newAmount);
            return newAmount;
        }
    },

    // Daily Check-in
    dailyCheck: {
        get() {
            return Storage.get(CONFIG.STORAGE_KEYS.DAILY_CHECK) || {
                lastCheck: null,
                streak: 0
            };
        },

        canCheck() {
            const data = this.get();
            if (!data.lastCheck) return true;

            const lastDate = new Date(data.lastCheck).toDateString();
            const today = new Date().toDateString();
            return lastDate !== today;
        },

        check() {
            if (!this.canCheck()) return null;

            const data = this.get();
            const now = Date.now();
            const lastDate = data.lastCheck ? new Date(data.lastCheck) : null;
            const today = new Date();

            // Check if streak continues (yesterday)
            let newStreak = 1;
            if (lastDate) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate.toDateString() === yesterday.toDateString()) {
                    newStreak = (data.streak % 7) + 1;
                }
            }

            const reward = CONFIG.DAILY_REWARDS[(newStreak - 1) % 7];
            Storage.points.add(reward);

            Storage.set(CONFIG.STORAGE_KEYS.DAILY_CHECK, {
                lastCheck: now,
                streak: newStreak
            });

            return { streak: newStreak, reward };
        }
    }
};

// Make Storage globally available
window.Storage = Storage;
