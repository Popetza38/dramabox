// ========================================
// Auth Module
// ========================================

const Auth = {
    // Get current user
    getUser() {
        return Storage.get(CONFIG.STORAGE_KEYS.USER);
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getUser();
    },

    // Check if user is VIP
    isVIP() {
        const user = this.getUser();
        if (!user || !user.vipExpiry) return false;
        return new Date(user.vipExpiry) > new Date();
    },

    // Get VIP remaining days
    getVIPDays() {
        const user = this.getUser();
        if (!user || !user.vipExpiry) return 0;
        const expiry = new Date(user.vipExpiry);
        const now = new Date();
        const diff = expiry - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    // Login (mock - will be replaced with real auth)
    async login(email, password) {
        // Simulate API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    const user = {
                        id: 'user_' + Date.now(),
                        email,
                        name: email.split('@')[0],
                        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=6366f1&color=fff`,
                        coins: 0,
                        points: 0,
                        vipExpiry: null,
                        createdAt: Date.now()
                    };
                    Storage.set(CONFIG.STORAGE_KEYS.USER, user);
                    resolve(user);
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1000);
        });
    },

    // Register (mock)
    async register(email, password, name) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password && name) {
                    const user = {
                        id: 'user_' + Date.now(),
                        email,
                        name,
                        avatar: `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`,
                        coins: 0,
                        points: 0,
                        vipExpiry: null,
                        createdAt: Date.now()
                    };
                    Storage.set(CONFIG.STORAGE_KEYS.USER, user);
                    resolve(user);
                } else {
                    reject(new Error('Please fill all fields'));
                }
            }, 1000);
        });
    },

    // Logout
    logout() {
        Storage.remove(CONFIG.STORAGE_KEYS.USER);
        Storage.remove(CONFIG.STORAGE_KEYS.TOKEN);
        window.location.href = 'index.html';
    },

    // Update user
    updateUser(updates) {
        const user = this.getUser();
        if (user) {
            const updated = { ...user, ...updates };
            Storage.set(CONFIG.STORAGE_KEYS.USER, updated);
            return updated;
        }
        return null;
    },

    // Add coins
    addCoins(amount) {
        const user = this.getUser();
        if (user) {
            user.coins = (user.coins || 0) + amount;
            Storage.set(CONFIG.STORAGE_KEYS.USER, user);
            return user.coins;
        }
        return 0;
    },

    // Subtract coins
    subtractCoins(amount) {
        const user = this.getUser();
        if (user && user.coins >= amount) {
            user.coins -= amount;
            Storage.set(CONFIG.STORAGE_KEYS.USER, user);
            return true;
        }
        return false;
    },

    // Activate VIP
    activateVIP(days) {
        const user = this.getUser();
        if (user) {
            const now = new Date();
            const currentExpiry = user.vipExpiry ? new Date(user.vipExpiry) : now;
            const baseDate = currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(baseDate);
            newExpiry.setDate(newExpiry.getDate() + days);

            user.vipExpiry = newExpiry.toISOString();
            Storage.set(CONFIG.STORAGE_KEYS.USER, user);
            return newExpiry;
        }
        return null;
    },

    // Redeem gift code (mock)
    async redeemGiftCode(code) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Mock gift codes
                const codes = {
                    'VIP7DAYS': { type: 'vip', days: 7 },
                    'VIP30DAYS': { type: 'vip', days: 30 },
                    'COIN100': { type: 'coins', amount: 100 },
                    'COIN500': { type: 'coins', amount: 500 },
                    'POINTS50': { type: 'points', amount: 50 }
                };

                const giftCode = codes[code.toUpperCase()];
                if (giftCode) {
                    if (giftCode.type === 'vip') {
                        this.activateVIP(giftCode.days);
                        resolve({ success: true, message: `ได้รับ VIP ${giftCode.days} วัน!`, data: giftCode });
                    } else if (giftCode.type === 'coins') {
                        this.addCoins(giftCode.amount);
                        resolve({ success: true, message: `ได้รับ ${giftCode.amount} Coins!`, data: giftCode });
                    } else if (giftCode.type === 'points') {
                        Storage.points.add(giftCode.amount);
                        resolve({ success: true, message: `ได้รับ ${giftCode.amount} Points!`, data: giftCode });
                    }
                } else {
                    reject(new Error('รหัสไม่ถูกต้องหรือหมดอายุแล้ว'));
                }
            }, 1000);
        });
    }
};

// Make Auth globally available
window.Auth = Auth;

// Update UI based on auth state
function updateAuthUI() {
    const user = Auth.getUser();
    const userName = document.getElementById('user-name');
    const userStatus = document.getElementById('user-status');
    const userAvatar = document.querySelector('.user-avatar');
    const authAction = document.getElementById('auth-action');

    if (user) {
        if (userName) userName.textContent = user.name;
        if (userStatus) {
            if (Auth.isVIP()) {
                userStatus.textContent = `VIP (เหลือ ${Auth.getVIPDays()} วัน)`;
                userStatus.classList.add('vip');
            } else {
                userStatus.textContent = 'สมาชิกทั่วไป';
                userStatus.classList.remove('vip');
            }
        }
        if (userAvatar) userAvatar.src = user.avatar;
        if (authAction) {
            authAction.innerHTML = '<a href="#" onclick="Auth.logout()"><i class="fas fa-sign-out-alt"></i> ออกจากระบบ</a>';
        }
    } else {
        if (userName) userName.textContent = 'ผู้เยี่ยมชม';
        if (userStatus) {
            userStatus.textContent = 'ยังไม่ได้เข้าสู่ระบบ';
            userStatus.classList.remove('vip');
        }
        if (authAction) {
            authAction.innerHTML = '<a href="login.html"><i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ</a>';
        }
    }
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);
