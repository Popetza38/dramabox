/**
 * DramaPop Detail Page JavaScript
 * Premium Netflix-Style UI with Horizontal Episode Carousel
 */

const DetailPage = {
    state: {
        bookId: null,
        dramaData: null,
        chapters: []
    },

    async init() {
        Common.init();
        this.state.bookId = Common.getUrlParam('id');

        if (!this.state.bookId) {
            Common.showError('ไม่พบข้อมูลซีรี่ย์');
            return;
        }

        this.bindEvents();
        await this.loadDetail();
    },

    bindEvents() {
        document.getElementById('detailBackBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        // Share button
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareContent();
        });
    },

    async shareContent() {
        const url = window.location.href;
        const title = this.state.dramaData?.bookName || 'DramaPop';

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `ดู ${title} บน DramaPop`,
                    url: url
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.copyToClipboard(url);
                }
            }
        } else {
            this.copyToClipboard(url);
        }
    },

    copyToClipboard(text) {
        navigator.clipboard?.writeText(text).then(() => {
            Swal.fire({
                toast: true,
                position: 'top',
                icon: 'success',
                title: 'คัดลอกลิงก์แล้ว',
                showConfirmButton: false,
                timer: 1500,
                background: 'rgba(20, 20, 45, 0.95)',
                color: '#fff'
            });
        });
    },

    generateRatingStars(score = 4.5) {
        const fullStars = Math.floor(score);
        const hasHalf = score % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        let html = '<div class="rating-stars">';
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="fas fa-star"></i>';
        }
        if (hasHalf) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            html += '<i class="far fa-star empty"></i>';
        }
        html += '</div>';
        html += `<span class="rating-score">${score.toFixed(1)}</span>`;
        return html;
    },

    async loadDetail() {
        Common.showLoading('กำลังโหลด...');

        try {
            const [detail, chapters] = await Promise.all([
                API.getDramaDetail(this.state.bookId),
                API.getChapters(this.state.bookId)
            ]);

            const dramaData = detail?.drama || detail?.data || detail || {};
            this.state.dramaData = dramaData;

            // Get cover
            let cover = dramaData.cover || dramaData.poster || dramaData.image || '';

            const bookName = dramaData.bookName || dramaData.name || dramaData.title || 'ไม่ทราบชื่อ';
            const tags = dramaData.tags || dramaData.genres || [];
            const chapterCount = dramaData.chapterCount || dramaData.episodeCount || 0;
            const playCount = dramaData.playCount || dramaData.viewCount || '0';
            const introduction = dramaData.introduction || dramaData.description || 'ไม่มีเรื่องย่อ';

            // Handle chapters - use chapterCount to generate full episode list
            let coverFromChapter = '';
            if (dramaData.chapterList && dramaData.chapterList.length > 0) {
                coverFromChapter = dramaData.chapterList[0]?.chapterImg || '';
            }

            // Generate full chapter list from chapterCount
            let chapterList = [];
            if (chapterCount > 0) {
                chapterList = Array.from({ length: chapterCount }, (_, i) => ({ chapterIndex: i }));
            } else if (Array.isArray(chapters)) {
                chapterList = chapters;
            } else if (chapters?.chapterList) {
                chapterList = chapters.chapterList;
            } else if (chapters?.list) {
                chapterList = chapters.list;
            } else if (chapters?.chapters) {
                chapterList = chapters.chapters;
            } else if (chapters?.data) {
                chapterList = chapters.data;
            }

            this.state.chapters = chapterList;

            // Fallback cover to first chapter image if main cover is missing
            if (!cover) {
                cover = coverFromChapter;
            }

            // Check if already favorited
            const isFav = Favorites.isFavorite(this.state.bookId);

            // Render UI
            document.getElementById('detailBackdrop').style.backgroundImage = cover ? `url(${cover})` : 'none';

            // Generate random rating for demo (in production, would come from API)
            const rating = (Math.random() * 1.5 + 3.5).toFixed(1);

            // Detail Card - Premium Design
            document.getElementById('detailCard').innerHTML = `
                <div class="detail-card">
                    <div class="detail-poster">
                        ${cover
                    ? `<img src="${cover}" alt="${bookName}" onerror="this.parentElement.innerHTML='<div class=\\'no-poster\\'><i class=\\'fas fa-film\\'></i></div>'">`
                    : '<div class="no-poster"><i class="fas fa-film"></i></div>'
                }
                    </div>
                    <div class="detail-info">
                        <h1 class="detail-title">${bookName}</h1>
                        <div class="detail-rating">
                            ${this.generateRatingStars(parseFloat(rating))}
                        </div>
                        <div class="detail-tags">
                            ${chapterCount > 50 ? '<span class="detail-tag hot">🔥 HOT</span>' : ''}
                            ${tags.slice(0, 4).map(t => `<span class="detail-tag">${t}</span>`).join('')}
                        </div>
                        <div class="detail-stats">
                            <span class="detail-stat"><i class="fas fa-film"></i> ${chapterCount} ตอน</span>
                            <span class="detail-stat"><i class="fas fa-eye"></i> ${this.formatViewCount(playCount)}</span>
                        </div>
                        <p class="detail-desc">${introduction}</p>
                    </div>
                </div>
            `;

            // Action Buttons - Premium
            document.getElementById('detailActions').innerHTML = `
                <button class="detail-watch-btn" id="watchNowBtn">
                    <i class="fas fa-play"></i> ดูเลย
                </button>
                <button class="detail-fav-btn ${isFav ? 'active' : ''}" id="favBtn" title="เพิ่มในรายการโปรด">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="detail-action-btn" id="inlineShareBtn" title="แชร์">
                    <i class="fas fa-share"></i>
                </button>
            `;

            // Episodes Count
            document.getElementById('episodesCount').textContent = `${chapterCount} ตอน`;

            // Render episodes carousel
            this.renderEpisodesCarousel();

            // Bind events
            document.getElementById('watchNowBtn')?.addEventListener('click', () => {
                const history = WatchHistory.get(this.state.bookId);
                const ep = history?.lastEpisode || 1;
                window.location.href = `watch.html?id=${this.state.bookId}&ep=${ep}`;
            });

            // Favorite button
            document.getElementById('favBtn')?.addEventListener('click', () => {
                const added = Favorites.toggle({
                    bookId: this.state.bookId,
                    bookName: bookName,
                    cover: cover,
                    chapterCount: chapterCount
                });

                const btn = document.getElementById('favBtn');
                btn.classList.toggle('active', added);

                Swal.fire({
                    toast: true,
                    position: 'top',
                    icon: added ? 'success' : 'info',
                    title: added ? 'เพิ่มในรายการโปรดแล้ว' : 'ลบออกจากรายการโปรดแล้ว',
                    showConfirmButton: false,
                    timer: 1500,
                    background: 'rgba(20, 20, 45, 0.95)',
                    color: '#fff'
                });
            });

            // Inline share button
            document.getElementById('inlineShareBtn')?.addEventListener('click', () => {
                this.shareContent();
            });

            Common.closeLoading();
        } catch (error) {
            console.error('Detail error:', error);
            Common.showError('ไม่สามารถโหลดข้อมูลซีรี่ย์ได้');
        }
    },

    formatViewCount(count) {
        if (typeof count === 'string') {
            count = parseInt(count.replace(/,/g, '')) || 0;
        }
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    },

    renderEpisodesCarousel() {
        const carousel = document.getElementById('episodesCarousel');
        if (!carousel) return;

        // Check for watch history to highlight last watched
        const history = WatchHistory.get(this.state.bookId);
        const lastEpisode = history?.lastEpisode || 0;

        if (this.state.chapters.length > 0) {
            carousel.innerHTML = this.state.chapters.map((ch, i) => {
                const epNum = (ch.chapterIndex !== undefined ? ch.chapterIndex : i) + 1;
                const isLastWatched = epNum === lastEpisode;
                return `
                    <div class="episode-card ${isLastWatched ? 'watching' : ''}" data-index="${epNum}">
                        <div class="ep-title">ตอนที่ ${epNum}</div>
                    </div>
                `;
            }).join('');

            // Bind click events
            carousel.querySelectorAll('.episode-card').forEach(card => {
                card.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${this.state.bookId}&ep=${card.dataset.index}`;
                });
            });

            // Scroll to active episode
            setTimeout(() => {
                const activeCard = carousel.querySelector('.episode-card.watching');
                if (activeCard) {
                    activeCard.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }, 100);
        } else {
            carousel.innerHTML = '<p class="no-episodes"><i class="fas fa-inbox"></i>ไม่พบรายการตอน</p>';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => DetailPage.init());

