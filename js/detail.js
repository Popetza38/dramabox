/**
 * DramaBox - Detail Page Script
 * หน้ารายละเอียดซีรีส์ - Fixed Version
 */

let currentDrama = null;
let chapters = [];

document.addEventListener('DOMContentLoaded', () => {
    initDetailPage();
});

/**
 * Initialize Detail Page
 */
async function initDetailPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');

    if (!bookId) {
        showError('ไม่พบข้อมูลซีรีส์');
        return;
    }

    // Show initial loading with SweetAlert
    Swal.fire({
        title: 'กำลังโหลดข้อมูล...',
        html: '<div class="loading-status"><i class="loading-spinner"></i><p>กำลังเตรียมข้อมูลซีรีส์</p></div>',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        customClass: { popup: 'swal2-dark' },
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // First try to get drama from cache
        currentDrama = getCachedDrama(bookId);

        // Update loading status - fetching chapters
        Swal.update({
            title: 'กำลังโหลดรายการตอน...',
            html: '<div class="loading-status"><i class="loading-spinner"></i><p>กำลังดึงข้อมูลตอนทั้งหมด</p></div>'
        });

        // Fetch chapters from API (chapters always available)
        const chaptersData = await DramaAPI.getChapters(bookId);
        chapters = chaptersData.data || [];

        // Update loading status with episode count
        if (chapters.length > 0) {
            Swal.update({
                title: `พบ ${chapters.length} ตอน`,
                html: `<div class="loading-status"><i class="loading-spinner"></i><p>กำลังโหลดข้อมูลซีรีส์...</p></div>`
            });
        }

        // If no cached drama, try to fetch from home/recommend API
        if (!currentDrama || !currentDrama.bookName) {
            Swal.update({
                title: `โหลดข้อมูลซีรีส์...`,
                html: `<div class="loading-status"><i class="loading-spinner"></i><p>พบ ${chapters.length} ตอน - กำลังโหลดรายละเอียด</p></div>`
            });

            try {
                const [homeData, recommendData] = await Promise.all([
                    DramaAPI.getHome(),
                    DramaAPI.getRecommend()
                ]);

                const allDramas = [...(homeData.data || []), ...(recommendData.data || [])];
                currentDrama = allDramas.find(d => (d.bookId || d.id) == bookId);

                if (currentDrama) {
                    // Save to cache
                    cacheDrama(currentDrama);
                }
            } catch (e) {
                console.log('Could not fetch drama list:', e);
            }
        }

        // If still no drama info, create minimal object
        if (!currentDrama) {
            currentDrama = {
                bookId: bookId,
                bookName: 'ไม่พบชื่อซีรีส์',
                chapterCount: chapters.length
            };
        }

        // Final loading update
        const dramaName = currentDrama.bookName || currentDrama.name || 'ซีรีส์';
        Swal.update({
            title: 'โหลดเสร็จสมบูรณ์!',
            html: `<div class="loading-status success"><p><strong>${dramaName}</strong></p><p>${chapters.length} ตอน พร้อมรับชม</p></div>`,
            icon: 'success'
        });

        // Render UI first
        renderBanner();
        renderEpisodes();

        // Wait for icons to render
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.lucide) lucide.createIcons();

        // Show success message for 1 second before closing
        await new Promise(resolve => setTimeout(resolve, 1000));

        Swal.close();

    } catch (error) {
        console.error('Failed to load detail:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่',
            confirmButtonText: 'ลองใหม่',
            customClass: { popup: 'swal2-dark' }
        }).then((result) => {
            if (result.isConfirmed) location.reload();
        });
    }
}

/**
 * Get Cached Drama
 */
function getCachedDrama(bookId) {
    try {
        const cache = sessionStorage.getItem('dramaCache');
        if (cache) {
            const dramas = JSON.parse(cache);
            return dramas.find(d => (d.bookId || d.id) == bookId);
        }
    } catch (e) {
        console.error('Cache error:', e);
    }
    return null;
}

/**
 * Cache Drama
 */
function cacheDrama(drama) {
    const bookId = drama?.bookId || drama?.id;
    if (!bookId) return;

    try {
        const cache = sessionStorage.getItem('dramaCache');
        const dramas = cache ? JSON.parse(cache) : [];

        const existingIndex = dramas.findIndex(d => (d.bookId || d.id) == bookId);

        if (existingIndex >= 0) {
            dramas[existingIndex] = drama;
        } else {
            dramas.push(drama);
        }

        sessionStorage.setItem('dramaCache', JSON.stringify(dramas));
    } catch (e) {
        console.error('Cache save error:', e);
    }
}

/**
 * Render Banner Section
 */
function renderBanner() {
    const banner = document.getElementById('detail-banner');
    if (!banner || !currentDrama) return;

    const bookId = currentDrama.bookId || currentDrama.id;
    const name = currentDrama.bookName || currentDrama.name || 'ไม่ทราบชื่อ';
    const cover = currentDrama.coverWap || currentDrama.cover || '';
    const description = currentDrama.introduction || '';
    const chapterCount = currentDrama.chapterCount || chapters.length || 0;
    const playCount = formatPlayCount(currentDrama.playCount);
    const cornerName = currentDrama.corner?.name || currentDrama.cornerName || 'พากย์ไทย';

    // Update page title
    document.title = `${name} - DramaBox`;

    banner.innerHTML = `
        <div class="detail-banner-bg" style="background-image: url('${cover}')"></div>
        <div class="detail-banner-content">
            <div class="drama-detail-layout">
                <div class="drama-poster-wrapper">
                    <img src="${cover}" alt="${name}" class="drama-poster" onerror="this.src='https://via.placeholder.com/220x293?text=No+Image'">
                </div>
                <div class="drama-main-info">
                    <span class="drama-badge">
                        <i data-lucide="star"></i>
                        ${cornerName}
                    </span>
                    <h1 class="drama-title">${name}</h1>
                    <div class="drama-stats">
                        <div class="drama-stat">
                            <i data-lucide="film"></i>
                            <span>${chapterCount} ตอน</span>
                        </div>
                        <div class="drama-stat">
                            <i data-lucide="eye"></i>
                            <span>${playCount} ครั้ง</span>
                        </div>
                        <div class="drama-stat">
                            <i data-lucide="clock"></i>
                            <span>อัปเดตล่าสุด</span>
                        </div>
                    </div>
                    <p class="drama-description">${description || 'ไม่มีคำอธิบาย'}</p>
                    <div class="drama-actions">
                        <button class="action-btn action-btn-primary" onclick="playFirstEpisode()">
                            <i data-lucide="play"></i>
                            เล่นตอนแรก
                        </button>
                        <button class="action-btn action-btn-secondary" onclick="addToFavorites('${bookId}')">
                            <i data-lucide="heart"></i>
                            ชอบ
                        </button>
                        <button class="action-btn action-btn-secondary action-btn-icon" onclick="shareContent()">
                            <i data-lucide="share-2"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();
}

/**
 * Render Episodes Grid
 */
function renderEpisodes() {
    const container = document.getElementById('episodes-grid');
    const countEl = document.getElementById('episode-count');

    if (!container) return;

    if (chapters.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">
                <i data-lucide="film" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                <p>ไม่พบรายการตอน</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    if (countEl) countEl.textContent = `${chapters.length} ตอน`;

    container.innerHTML = chapters.map((ep, index) => {
        const epNumber = ep.chapterIndex !== undefined ? ep.chapterIndex + 1 : (index + 1);
        const chapterId = ep.chapterId || ep.id || ep.itemId;

        return `
            <button class="episode-btn" 
                    data-chapter-id="${chapterId}"
                    data-index="${index}"
                    onclick="playEpisode('${chapterId}', ${index})">
                <span class="episode-number">${epNumber}</span>
                <span class="episode-label">ตอน</span>
            </button>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

/**
 * Format play count
 */
function formatPlayCount(count) {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return count.toString();
}

/**
 * Play First Episode
 */
function playFirstEpisode() {
    if (chapters.length > 0) {
        const firstEp = chapters[0];
        const chapterId = firstEp.chapterId || firstEp.id || firstEp.itemId;
        playEpisode(chapterId, 0);
    } else {
        showToast('ไม่พบตอนที่สามารถเล่นได้', 'warning');
    }
}

/**
 * Play Specific Episode
 */
function playEpisode(chapterId, index) {
    const bookId = currentDrama?.bookId || currentDrama?.id || new URLSearchParams(window.location.search).get('id');

    if (!chapterId || !bookId) {
        showToast('ไม่พบข้อมูลตอนที่ต้องการ', 'error');
        return;
    }

    // Cache current drama before navigating
    if (currentDrama) {
        cacheDrama(currentDrama);
    }

    window.location.href = `watch.html?id=${bookId}&ep=${chapterId}&index=${index}`;
}

/**
 * Add to Favorites
 */
function addToFavorites(bookId) {
    showToast('เพิ่มในรายการโปรดแล้ว', 'success');
}

/**
 * Share Content
 */
async function shareContent() {
    const name = currentDrama?.bookName || currentDrama?.name || 'DramaBox';
    const url = window.location.href;

    if (navigator.share) {
        try {
            await navigator.share({
                title: name,
                text: `ดู ${name} บน DramaBox`,
                url: url
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                copyToClipboard(url);
            }
        }
    } else {
        copyToClipboard(url);
    }
}

/**
 * Copy to Clipboard
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('คัดลอกลิงก์แล้ว!', 'success');
    }).catch(() => {
        showToast('ไม่สามารถคัดลอกได้', 'error');
    });
}

/**
 * Go Back
 */
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'index.html';
    }
}

// Export functions
window.playFirstEpisode = playFirstEpisode;
window.playEpisode = playEpisode;
window.addToFavorites = addToFavorites;
window.shareContent = shareContent;
window.goBack = goBack;
