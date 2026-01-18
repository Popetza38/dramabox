// ========================================
// Utility Functions
// ========================================

const Utils = {
    // Format number with K, M suffix
    formatNumber(num) {
        if (!num) return '0';
        if (typeof num === 'string') {
            if (num.includes('K') || num.includes('M')) return num;
            num = parseFloat(num.replace(/,/g, ''));
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Format time (seconds to mm:ss or hh:mm:ss)
    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // Format date
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) {
            return 'เมื่อสักครู่';
        }
        // Less than 1 hour
        if (diff < 3600000) {
            return `${Math.floor(diff / 60000)} นาทีที่แล้ว`;
        }
        // Less than 1 day
        if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)} ชั่วโมงที่แล้ว`;
        }
        // Less than 7 days
        if (diff < 604800000) {
            return `${Math.floor(diff / 86400000)} วันที่แล้ว`;
        }
        // Format as date
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Debounce function
    debounce(func, wait) {
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

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Parse URL params
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },

    // Get URL param
    getUrlParam(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    },

    // Navigate to page with smooth transition
    navigate(page, params = {}) {
        const queryString = Object.keys(params).length
            ? '?' + new URLSearchParams(params).toString()
            : '';

        // Add page transition effect
        document.body.classList.add('page-exit');

        setTimeout(() => {
            window.location.href = page + queryString;
        }, 200);
    },

    // Show toast notification using SweetAlert2
    toast(message, type = 'info') {
        const icons = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: icons[type] || 'info',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#1a1a25',
            color: '#ffffff',
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    },

    // Show loading
    showLoading(message = 'กำลังโหลด...') {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: '#1a1a25',
            color: '#ffffff',
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    // Hide loading
    hideLoading() {
        Swal.close();
    },

    // Confirm dialog
    async confirm(title, text, confirmText = 'ตกลง', cancelText = 'ยกเลิก') {
        const result = await Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            background: '#1a1a25',
            color: '#ffffff',
            confirmButtonColor: '#6366f1',
            cancelButtonColor: '#52525b'
        });
        return result.isConfirmed;
    },

    // Create element helper
    createElement(tag, className, innerHTML = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (innerHTML) el.innerHTML = innerHTML;
        return el;
    },

    // Lazy load images
    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px' });

        images.forEach(img => observer.observe(img));
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Check if mobile
    isMobile() {
        return window.innerWidth < 768;
    },

    // Get corner color class
    getCornerClass(cornerName) {
        if (!cornerName) return '';
        const name = cornerName.toLowerCase();
        if (name.includes('มาแรง') || name.includes('hot')) return 'hot';
        if (name.includes('พากย์') || name.includes('dub')) return 'dubbed';
        if (name.includes('ใหม่') || name.includes('new')) return 'new';
        return '';
    }
};

// Make Utils globally available
window.Utils = Utils;
