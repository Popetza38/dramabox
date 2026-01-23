/**
 * DramaPop Detail Page JavaScript
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
            // Get cover from dramaData.chapterList (has chapterImg)
            let coverFromChapter = '';
            if (dramaData.chapterList && dramaData.chapterList.length > 0) {
                coverFromChapter = dramaData.chapterList[0]?.chapterImg || '';
            }

            // Generate full chapter list from chapterCount
            let chapterList = [];
            if (chapterCount > 0) {
                // Create full episode list based on chapterCount
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

            // Detail Card
            document.getElementById('detailCard').innerHTML = `
                <div class="detail-card">
                    <div class="detail-poster">${cover ? `<img src="${cover}" alt="${bookName}" onerror="this.style.display='none'">` : '<div class="no-poster"><i class="fas fa-film"></i></div>'}</div>
                    <div class="detail-info">
                        <h1 class="detail-title">${bookName}</h1>
                        <div class="detail-tags">${tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}</div>
                        <div class="detail-stats">
                            <span class="detail-stat"><i class="fas fa-film"></i> ${chapterCount} ตอน</span>
                            <span class="detail-stat"><i class="fas fa-eye"></i> ${playCount}</span>
                        </div>
                        <p class="detail-desc">${introduction}</p>
                    </div>
                </div>
            `;

            // Action Buttons
            document.getElementById('detailActions').innerHTML = `
                <button class="detail-watch-btn" id="watchNowBtn">
                    <i class="fas fa-play"></i> ดูเลย
                </button>
                <button class="detail-fav-btn ${isFav ? 'active' : ''}" id="favBtn">
                    <i class="fas fa-heart"></i>
                </button>
            `;

            // Episodes Count
            document.getElementById('episodesCount').textContent = `${chapterCount} ตอน`;

            // Render episodes
            const episodesGrid = document.getElementById('episodesGrid');
            if (this.state.chapters.length > 0) {
                // Check for watch history to highlight last watched
                const history = WatchHistory.get(this.state.bookId);
                const lastEpisode = history?.lastEpisode || 0;

                episodesGrid.innerHTML = this.state.chapters.map((ch, i) => {
                    const epNum = (ch.chapterIndex !== undefined ? ch.chapterIndex : i) + 1;
                    const isLastWatched = epNum === lastEpisode;
                    return `<button class="episode-btn ${isLastWatched ? 'watched' : ''}" data-index="${epNum}">
                        ${isLastWatched ? '<i class="fas fa-play-circle"></i> ' : ''}ตอนที่ ${epNum}
                    </button>`;
                }).join('');
            } else {
                episodesGrid.innerHTML = '<p class="no-episodes">ไม่พบรายการตอน</p>';
            }

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
                    background: '#1a1a1a',
                    color: '#fff'
                });
            });

            document.querySelectorAll('.episode-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.location.href = `watch.html?id=${this.state.bookId}&ep=${btn.dataset.index}`;
                });
            });

            Common.closeLoading();
        } catch (error) {
            console.error('Detail error:', error);
            Common.showError('ไม่สามารถโหลดข้อมูลซีรี่ย์ได้');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => DetailPage.init());
