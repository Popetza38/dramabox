// ========================================
// Detail Page Script
// ========================================

let seriesData = null;
let chaptersData = [];
let isReversed = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const bookId = Utils.getUrlParam('id');
    if (!bookId) {
        Utils.toast('ไม่พบข้อมูลซีรี่ย์', 'error');
        setTimeout(() => Utils.navigate('index.html'), 1500);
        return;
    }

    try {
        await loadSeriesDetail(bookId);
    } catch (error) {
        console.error('Failed to load series detail:', error);
        Utils.toast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
        hideLoadingScreen();
    }

    setupEventListeners();
});

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 300);
    }
}

async function loadSeriesDetail(bookId) {
    // Load chapters first
    const chaptersResult = await API.getChapters(bookId);

    if (chaptersResult?.success && chaptersResult.data) {
        chaptersData = chaptersResult.data;
        renderEpisodes(chaptersData);
    }

    // Try to find series info from recommend and home endpoints
    // since /api/detail/:id/v2 doesn't return metadata
    try {
        // Try recommend first (uses bookId)
        const recommendResult = await API.getRecommend();
        let foundInRecommend = null;

        if (recommendResult?.success && recommendResult.data) {
            foundInRecommend = recommendResult.data.find(s => s.bookId === bookId);
            if (foundInRecommend) {
                seriesData = foundInRecommend;
                renderSeriesInfo(seriesData);
                renderRelated(recommendResult.data);
            }
        }

        // If not found in recommend, try home
        if (!foundInRecommend) {
            const homeResult = await API.getHome();
            if (homeResult?.success && homeResult.data && Array.isArray(homeResult.data)) {
                // Home API returns array of series directly with 'id' property (not 'bookId')
                const found = homeResult.data.find(s => s.id === bookId || s.bookId === bookId);

                if (found) {
                    // Normalize the data structure
                    seriesData = {
                        bookId: found.id || found.bookId,
                        bookName: found.name || found.bookName,
                        coverWap: found.cover || found.coverWap,
                        introduction: found.introduction || found.intro,
                        chapterCount: found.chapterCount,
                        playCount: found.playCount,
                        tags: found.tags,
                        tagV3s: found.tagV3s || found.tags
                    };
                    renderSeriesInfo(seriesData);
                } else {
                    // Use fallback with chapters count
                    seriesData = {
                        bookId,
                        bookName: 'ซีรี่ย์',
                        chapterCount: chaptersData?.length || 0
                    };
                    renderSeriesInfo(seriesData);
                }
            }

            // Still render related from recommend if available
            if (recommendResult?.success && recommendResult.data) {
                renderRelated(recommendResult.data);
            }
        }
    } catch (e) {
        console.log('Could not load series info:', e);
        // Fallback to basic info
        seriesData = {
            bookId,
            bookName: 'ซีรี่ย์',
            chapterCount: chaptersData?.length || 0
        };
        renderSeriesInfo(seriesData);
    }

    // Add to history
    if (seriesData) {
        Storage.history.add({
            bookId,
            name: seriesData.bookName || seriesData.name,
            cover: seriesData.coverWap || seriesData.cover,
            chapterCount: seriesData.chapterCount || chaptersData?.length || 0
        });
    }
}

function renderSeriesInfo(data) {
    const name = data.bookName || data.name || 'ไม่ทราบชื่อ';
    const cover = data.coverWap || data.cover || '';
    const intro = data.introduction || data.intro || 'ไม่มีข้อมูลเรื่องย่อ';
    const tags = data.tags || data.tagV3s || [];

    // Update page title
    document.title = `${name} - DramaPop`;
    document.getElementById('nav-title').textContent = name;

    // Cover image
    const coverImage = document.getElementById('cover-image');
    coverImage.style.backgroundImage = `url('${cover}')`;

    // Cover poster
    const coverPoster = document.getElementById('cover-poster');
    coverPoster.innerHTML = `<img src="${cover}" alt="${Utils.escapeHtml(name)}">`;

    // Title
    document.getElementById('series-title').textContent = name;

    // Meta info
    const metaHtml = `
        <span><i class="fas fa-play-circle"></i> ${data.chapterCount || 0} ตอน</span>
        <span><i class="fas fa-eye"></i> ${data.playCount || '0'}</span>
        ${data.year ? `<span><i class="fas fa-calendar"></i> ${data.year}</span>` : ''}
        ${data.status ? `<span><i class="fas fa-broadcast-tower"></i> ${data.status}</span>` : ''}
    `;
    document.getElementById('series-meta').innerHTML = metaHtml;

    // Tags
    const tagsHtml = tags.slice(0, 5).map(tag => {
        const tagName = typeof tag === 'string' ? tag : (tag.tagName || tag.name);
        return `<span class="badge-tag">${tagName}</span>`;
    }).join('');
    document.getElementById('series-tags').innerHTML = tagsHtml;

    // Synopsis
    document.getElementById('synopsis').textContent = intro;

    // Update favorite button
    updateFavoriteButton();
}

function renderEpisodes(chapters) {
    const grid = document.getElementById('episodes-grid');
    const history = Storage.history.get();
    const current = history.find(h => h.bookId === Utils.getUrlParam('id'));

    const sortedChapters = isReversed ? [...chapters].reverse() : chapters;

    grid.innerHTML = sortedChapters.map((chapter, index) => {
        const epNum = isReversed ? chapters.length - index : index + 1;
        const isCurrent = current?.lastChapterId === chapter.chapterId;
        const progress = isCurrent ? (current.progressPercent || 0) : 0;

        return `
            <div class="episode-card ${isCurrent ? 'current' : ''}" 
                 onclick="playEpisode('${chapter.chapterId}', ${epNum})"
                 data-chapter-id="${chapter.chapterId}">
                <span class="episode-number">${epNum}</span>
                <span class="episode-title">ตอนที่ ${epNum}</span>
                ${progress > 0 ? `
                    <div class="episode-progress">
                        <div class="episode-progress-bar" style="width: ${progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function renderRelated(dramas) {
    const slider = document.getElementById('related-slider');
    if (!slider || !dramas.length) return;

    slider.innerHTML = dramas.slice(0, 10).map(drama => {
        const id = drama.bookId || drama.id;
        const name = drama.bookName || drama.name;
        const cover = drama.coverWap || drama.cover;

        if (id === Utils.getUrlParam('id')) return '';

        return `
            <a href="detail.html?id=${id}" class="series-card">
                <div class="series-poster">
                    <img src="${cover}" alt="${Utils.escapeHtml(name)}" loading="lazy">
                    <div class="series-play-overlay">
                        <div class="series-play-btn">
                            <i class="fas fa-play"></i>
                        </div>
                    </div>
                </div>
                <div class="series-info">
                    <h3 class="series-title">${Utils.escapeHtml(name)}</h3>
                </div>
            </a>
        `;
    }).join('');
}

function playEpisode(chapterId, epNum) {
    const bookId = Utils.getUrlParam('id');
    const name = seriesData?.bookName || seriesData?.name || '';
    Utils.navigate('watch.html', { id: bookId, ep: chapterId, num: epNum, name: encodeURIComponent(name) });
}

function updateFavoriteButton() {
    const bookId = Utils.getUrlParam('id');
    const isFavorite = Storage.favorites.isFavorite(bookId);

    const btnFavorite = document.getElementById('btn-favorite');
    const btnAddFavorite = document.getElementById('btn-add-favorite');

    if (btnFavorite) {
        btnFavorite.innerHTML = `<i class="${isFavorite ? 'fas' : 'far'} fa-heart" style="color: ${isFavorite ? '#ec4899' : 'inherit'}"></i>`;
    }

    if (btnAddFavorite) {
        btnAddFavorite.classList.toggle('active', isFavorite);
        btnAddFavorite.innerHTML = `
            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            <span>${isFavorite ? 'ชื่นชอบแล้ว' : 'ชื่นชอบ'}</span>
        `;
    }
}

function toggleFavorite() {
    const bookId = Utils.getUrlParam('id');
    if (!seriesData) return;

    const isFav = Storage.favorites.toggle({
        bookId,
        name: seriesData.bookName || seriesData.name,
        cover: seriesData.coverWap || seriesData.cover,
        chapterCount: seriesData.chapterCount
    });

    updateFavoriteButton();
    Utils.toast(isFav ? 'เพิ่มในรายการโปรดแล้ว' : 'ลบออกจากรายการโปรดแล้ว', 'success');
}

function shareSeries() {
    const name = seriesData?.bookName || seriesData?.name || 'ซีรี่ย์';
    const url = window.location.href;

    if (navigator.share) {
        navigator.share({
            title: name,
            text: `ดู ${name} บน DramaPop`,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        Utils.toast('คัดลอกลิงก์แล้ว', 'success');
    }
}

function setupEventListeners() {
    // Play button
    document.getElementById('btn-play')?.addEventListener('click', () => {
        if (chaptersData.length > 0) {
            const history = Storage.history.get();
            const current = history.find(h => h.bookId === Utils.getUrlParam('id'));

            if (current?.lastChapterId) {
                // Continue from last watched
                const epIndex = chaptersData.findIndex(c => c.chapterId === current.lastChapterId);
                playEpisode(current.lastChapterId, epIndex + 1);
            } else {
                // Play first episode
                playEpisode(chaptersData[0].chapterId, 1);
            }
        }
    });

    // Favorite buttons
    document.getElementById('btn-favorite')?.addEventListener('click', toggleFavorite);
    document.getElementById('btn-add-favorite')?.addEventListener('click', toggleFavorite);

    // Share buttons
    document.getElementById('btn-share')?.addEventListener('click', shareSeries);
    document.getElementById('btn-share-action')?.addEventListener('click', shareSeries);

    // Expand synopsis
    const btnExpand = document.getElementById('btn-expand-synopsis');
    const synopsis = document.getElementById('synopsis');

    btnExpand?.addEventListener('click', () => {
        synopsis.classList.toggle('expanded');
        btnExpand.classList.toggle('expanded');
        btnExpand.innerHTML = synopsis.classList.contains('expanded')
            ? 'ย่อ <i class="fas fa-chevron-up"></i>'
            : 'อ่านเพิ่มเติม <i class="fas fa-chevron-down"></i>';
    });

    // Sort episodes
    document.getElementById('btn-sort')?.addEventListener('click', () => {
        isReversed = !isReversed;
        document.getElementById('btn-sort').classList.toggle('reversed', isReversed);
        renderEpisodes(chaptersData);
    });

    // Scroll effect for nav
    const detailNav = document.querySelector('.detail-nav');
    window.addEventListener('scroll', Utils.throttle(() => {
        detailNav.classList.toggle('scrolled', window.scrollY > 100);
    }, 100));

    // Download button
    document.getElementById('btn-download')?.addEventListener('click', () => {
        Utils.toast('ฟีเจอร์นี้ยังไม่พร้อมใช้งาน', 'info');
    });
}
