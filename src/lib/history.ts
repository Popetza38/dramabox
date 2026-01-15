// Watch History Management with localStorage

const HISTORY_KEY = "dramabox_watch_history";
const AUTOPLAY_KEY = "dramabox_autoplay";
const MAX_HISTORY_ITEMS = 50;

export interface WatchHistoryItem {
    bookId: string;
    bookName: string;
    coverWap: string;
    currentEpisode: number;
    totalEpisodes: number;
    progress: number; // 0-100 percentage
    lastWatchedAt: number; // timestamp
}

/**
 * Get all watch history items, sorted by most recent first
 */
export function getWatchHistory(): WatchHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        const history = data ? JSON.parse(data) : [];
        return history.sort(
            (a: WatchHistoryItem, b: WatchHistoryItem) =>
                b.lastWatchedAt - a.lastWatchedAt
        );
    } catch {
        return [];
    }
}

/**
 * Add or update a drama in watch history
 */
export function addToWatchHistory(item: Omit<WatchHistoryItem, "lastWatchedAt">): void {
    if (typeof window === "undefined") return;

    try {
        const history = getWatchHistory();
        const existingIndex = history.findIndex((h) => h.bookId === item.bookId);

        const newItem: WatchHistoryItem = {
            ...item,
            lastWatchedAt: Date.now(),
        };

        if (existingIndex !== -1) {
            // Update existing entry
            history.splice(existingIndex, 1);
        }

        // Add to beginning
        history.unshift(newItem);

        // Limit history size
        const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Update progress for a drama in history
 */
export function updateProgress(bookId: string, progress: number): void {
    if (typeof window === "undefined") return;

    try {
        const history = getWatchHistory();
        const existingIndex = history.findIndex((h) => h.bookId === bookId);

        if (existingIndex !== -1) {
            history[existingIndex].progress = Math.min(100, Math.max(0, progress));
            history[existingIndex].lastWatchedAt = Date.now();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Get the last watched episode for a specific drama
 */
export function getLastWatchedEpisode(bookId: string): number | null {
    const history = getWatchHistory();
    const item = history.find((h) => h.bookId === bookId);
    return item ? item.currentEpisode : null;
}

/**
 * Remove a drama from watch history
 */
export function removeFromHistory(bookId: string): void {
    if (typeof window === "undefined") return;

    try {
        const history = getWatchHistory();
        const filtered = history.filter((h) => h.bookId !== bookId);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Clear all watch history
 */
export function clearWatchHistory(): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch {
        // Ignore localStorage errors
    }
}

/**
 * Get auto-play preference
 */
export function getAutoPlayEnabled(): boolean {
    if (typeof window === "undefined") return true;
    try {
        const data = localStorage.getItem(AUTOPLAY_KEY);
        return data === null ? true : data === "true";
    } catch {
        return true;
    }
}

/**
 * Set auto-play preference
 */
export function setAutoPlayEnabled(enabled: boolean): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(AUTOPLAY_KEY, String(enabled));
    } catch {
        // Ignore localStorage errors
    }
}
