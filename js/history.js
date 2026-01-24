/**
 * DramaPop History Page JavaScript
 */

const HistoryPage = {
    async init() {
        Common.init();
        this.bindEvents();
        this.renderHistory();
    },

    bindEvents() {
        document.getElementById('historyBackBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('clearAllHistory')?.addEventListener('click', () => {
            this.clearAllHistory();
        });
    },

    renderHistory() {
        const container = document.getElementById('historyResults');
        const clearBtn = document.getElementById('clearAllHistory');
        const history = WatchHistory.getAll();

        if (!history || history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <h3>ยังไม่มีประวัติการดู</h3>
                    <p>เริ่มดูซีรี่ย์เพื่อบันทึกประวัติ</p>
                    <a href="index.html" class="browse-btn">
                        <i class="fas fa-play"></i> เริ่มดูเลย
                    </a>
                </div>
            `;
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }

        if (clearBtn) clearBtn.style.display = 'flex';

        container.innerHTML = history.map(item => {
            const lastWatched = new Date(item.lastWatched);
            const timeAgo = this.getTimeAgo(lastWatched);
            const progressPct = Math.round((item.progress || 0) * 100);

            return `
                <div class="history-card" data-id="${item.bookId}">
                    <div class="history-poster">
                        <img src="${item.cover}" alt="${item.bookName}" loading="lazy" 
                             onerror="this.src='https://via.placeholder.com/120x180?text=No+Image'">
                        <div class="history-progress-bar">
                            <div class="history-progress-fill" style="width: ${progressPct}%"></div>
                        </div>
                        <div class="history-play-overlay">
                            <div class="history-play-btn"><i class="fas fa-play"></i></div>
                        </div>
                    </div>
                    <div class="history-info">
                        <h3 class="history-title-text">${item.bookName}</h3>
                        <div class="history-meta">
                            <span class="history-episode">
                                <i class="fas fa-play-circle"></i> ตอนที่ ${item.lastEpisode}/${item.totalEpisodes || '?'}
                            </span>
                            <span class="history-time">
                                <i class="fas fa-clock"></i> ${timeAgo}
                            </span>
                        </div>
                        <div class="history-actions">
                            <button class="history-continue-btn" data-id="${item.bookId}" data-ep="${item.lastEpisode}">
                                <i class="fas fa-play"></i> ดูต่อ
                            </button>
                            <button class="history-remove-btn" data-id="${item.bookId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Bind events
        container.querySelectorAll('.history-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.history-actions')) {
                    window.location.href = `detail.html?id=${card.dataset.id}`;
                }
            });
        });

        container.querySelectorAll('.history-continue-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = `watch.html?id=${btn.dataset.id}&ep=${btn.dataset.ep}`;
            });
        });

        container.querySelectorAll('.history-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeItem(btn.dataset.id);
            });
        });
    },

    getTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'เมื่อสักครู่';
        if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
        if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
        if (days < 7) return `${days} วันที่แล้ว`;
        return date.toLocaleDateString('th-TH');
    },

    removeItem(bookId) {
        Swal.fire({
            title: 'ลบประวัติ?',
            text: 'ต้องการลบรายการนี้ออกจากประวัติหรือไม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#e50914',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                WatchHistory.remove(bookId);
                this.renderHistory();
                Swal.fire({
                    icon: 'success',
                    title: 'ลบแล้ว',
                    timer: 1000,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#fff'
                });
            }
        });
    },

    clearAllHistory() {
        Swal.fire({
            title: 'ลบประวัติทั้งหมด?',
            text: 'การกระทำนี้ไม่สามารถย้อนกลับได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#e50914',
            background: '#1a1a1a',
            color: '#fff'
        }).then((result) => {
            if (result.isConfirmed) {
                WatchHistory.clear();
                this.renderHistory();
                Swal.fire({
                    icon: 'success',
                    title: 'ลบประวัติทั้งหมดแล้ว',
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#fff'
                });
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => HistoryPage.init());
