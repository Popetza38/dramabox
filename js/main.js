/**
 * DramaBox - Main Page Script
 * หน้าหลักของเว็บไซต์ - Redesigned
 */

// Store data for view all
let allPopularDramas = [];
let allRecommendDramas = [];
let heroSlideIndex = 0;
let heroSlideInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Initialize Application
 */
async function initApp() {
    showLoading('กำลังโหลดซีรีส์...');

    try {
        // Load watch history first
        renderContinueWatching();

        // Load data in parallel
        const [homeData, categoriesData, recommendData] = await Promise.all([
            DramaAPI.getHome(),
            DramaAPI.getCategories(),
            DramaAPI.getRecommend()
        ]);

        // Store for view all
        allPopularDramas = homeData.data || [];
        allRecommendDramas = recommendData.data || [];

        // Cache dramas
        const allDramas = [...allPopularDramas, ...allRecommendDramas];
        sessionStorage.setItem('dramaCache', JSON.stringify(allDramas));

        // Render sections
        renderHeroSlider(allRecommendDramas.slice(0, 5));
        renderCategories(categoriesData.data);
        renderDramaGrid('popular-grid', allPopularDramas.slice(0, 12));
        renderDramaGrid('recommend-grid', allRecommendDramas.slice(0, 12));

        hideLoading();

    } catch (error) {
        console.error('Failed to load data:', error);
        showError('ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
}

/**
 * Render Hero Slider
 */
function renderHeroSlider(dramas) {
    const hero = document.getElementById('hero');
    if (!hero || !dramas.length) return;

    const slides = dramas.map((drama, index) => {
        const cover = drama.coverWap || drama.cover;
        const id = drama.bookId || drama.id;
        const name = drama.bookName || drama.name;
        const description = drama.introduction || '';
        const chapterCount = drama.chapterCount || 0;
        const playCount = formatPlayCount(drama.playCount);
        const cornerName = drama.corner?.name || drama.cornerName || 'มาแรง';

        return `
            <div class="hero-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="hero-slide-bg" style="background-image: url('${cover}')"></div>
                <div class="hero-slide-content">
                    <span class="hero-badge">
                        <i data-lucide="flame"></i>
                        ${cornerName}
                    </span>
                    <h1 class="hero-title">${name}</h1>
                    <div class="hero-meta">
                        <span><i data-lucide="film"></i> ${chapterCount} ตอน</span>
                        <span><i data-lucide="eye"></i> ${playCount}</span>
                    </div>
                    <p class="hero-description">${description}</p>
                    <div class="hero-actions">
                        <a href="detail.html?id=${id}" class="btn btn-primary">
                            <i data-lucide="play"></i>
                            ดูเลย
                        </a>
                        <button class="btn btn-secondary" onclick="showInfo('${id}')">
                            <i data-lucide="info"></i>
                            รายละเอียด
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const indicators = dramas.map((_, index) => `
        <div class="hero-indicator ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>
    `).join('');

    hero.innerHTML = `
        ${slides}
        <div class="hero-indicators">${indicators}</div>
    `;

    if (window.lucide) lucide.createIcons();

    // Start auto slide
    startHeroSlider(dramas.length);
}

/**
 * Start Hero Slider Auto Play
 */
function startHeroSlider(totalSlides) {
    if (heroSlideInterval) clearInterval(heroSlideInterval);

    heroSlideInterval = setInterval(() => {
        heroSlideIndex = (heroSlideIndex + 1) % totalSlides;
        goToSlide(heroSlideIndex);
    }, 5000);
}

/**
 * Go to specific slide
 */
function goToSlide(index) {
    heroSlideIndex = index;

    document.querySelectorAll('.hero-slide').forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });

    document.querySelectorAll('.hero-indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

/**
 * Format play count
 */
function formatPlayCount(count) {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return count;
}

/**
 * Render Categories
 */
function renderCategories(categories) {
    const container = document.getElementById('categories-scroll');
    if (!container || !categories) return;

    // Add "All" category at the beginning
    container.innerHTML = `
        <button class="category-chip active" data-category-id="all" onclick="resetCategoryFilter(this)">
            ทั้งหมด
        </button>
        ${categories.map(cat => `
            <button class="category-chip" data-category-id="${cat.id}" onclick="filterByCategory(${cat.id}, this)">
                ${cat.name}
            </button>
        `).join('')}
    `;
}

/**
 * Reset Category Filter
 */
function resetCategoryFilter(btn) {
    document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
    btn.classList.add('active');
    renderDramaGrid('popular-grid', allPopularDramas.slice(0, 12));
}

/**
 * Render Drama Grid
 */
function renderDramaGrid(containerId, dramas) {
    const container = document.getElementById(containerId);
    if (!container || !dramas) return;

    container.innerHTML = dramas.map(drama => createDramaCard(drama)).join('');

    if (window.lucide) lucide.createIcons();

    container.querySelectorAll('.drama-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 0.05}s`;
        card.classList.add('fade-in');
    });
}

/**
 * Create Drama Card HTML
 */
function createDramaCard(drama) {
    const id = drama.bookId || drama.id;
    const name = drama.bookName || drama.name;
    const cover = drama.coverWap || drama.cover;
    const chapterCount = drama.chapterCount || 0;
    const playCount = formatPlayCount(drama.playCount);
    const cornerName = drama.corner?.name || drama.cornerName || '';

    return `
        <a href="detail.html?id=${id}" class="drama-card">
            <div class="drama-card-image">
                <img src="${cover}" alt="${name}" loading="lazy">
                <div class="drama-card-overlay">
                    <div class="play-icon">
                        <i data-lucide="play"></i>
                    </div>
                </div>
                ${cornerName ? `<span class="drama-card-badge">${cornerName}</span>` : ''}
            </div>
            <div class="drama-card-content">
                <h3 class="drama-card-title">${name}</h3>
                <div class="drama-card-meta">
                    <span><i data-lucide="film"></i> ${chapterCount}</span>
                    <span><i data-lucide="eye"></i> ${playCount}</span>
                </div>
            </div>
        </a>
    `;
}

/**
 * Show View All Modal
 */
function showViewAll(type, title) {
    const modal = document.getElementById('view-all-modal');
    const titleEl = document.getElementById('view-all-title');
    const grid = document.getElementById('view-all-grid');

    if (!modal || !grid) return;

    titleEl.textContent = title;

    const dramas = type === 'popular' ? allPopularDramas : allRecommendDramas;
    grid.innerHTML = dramas.map(drama => createDramaCard(drama)).join('');

    if (window.lucide) lucide.createIcons();

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

/**
 * Close View All Modal
 */
function closeViewAll() {
    const modal = document.getElementById('view-all-modal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Filter by Category
 */
async function filterByCategory(categoryId, btn) {
    document.querySelectorAll('.category-chip').forEach(chip => chip.classList.remove('active'));
    btn.classList.add('active');

    showLoading('กำลังโหลดซีรีส์...');

    try {
        const data = await DramaAPI.getDramasByCategory(categoryId);
        const dramas = data.data?.bookList || [];

        if (dramas.length === 0) {
            const container = document.getElementById('popular-grid');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                        <i data-lucide="film" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);"></i>
                        <p style="color: var(--text-secondary);">ไม่พบซีรีส์ในหมวดหมู่นี้</p>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
            }
        } else {
            renderDramaGrid('popular-grid', dramas.slice(0, 12));
        }
        hideLoading();
    } catch (error) {
        console.error('Failed to filter:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    }
}

/**
 * Search Handler
 */
function handleSearch(event) {
    event.preventDefault();
    const input = document.getElementById('search-input');
    const keyword = input?.value?.trim();

    if (!keyword) {
        showToast('กรุณากรอกคำค้นหา', 'warning');
        return;
    }

    window.location.href = `search.html?q=${encodeURIComponent(keyword)}`;
}

/**
 * Show Drama Info
 */
async function showInfo(bookId) {
    showLoading('กำลังโหลด...');

    try {
        const data = await DramaAPI.getDetail(bookId);
        const drama = data.data;

        hideLoading();

        Swal.fire({
            title: drama.bookInfo?.bookName || drama.bookName,
            html: `
                <div style="text-align: left;">
                    <p><strong>จำนวนตอน:</strong> ${drama.bookInfo?.chapterCount || drama.chapterCount} ตอน</p>
                    <p><strong>ยอดรับชม:</strong> ${formatPlayCount(drama.bookInfo?.playCount || drama.playCount)}</p>
                    <p style="margin-top: 10px; color: var(--text-secondary);">${drama.bookInfo?.introduction || drama.introduction || ''}</p>
                </div>
            `,
            imageUrl: drama.bookInfo?.cover || drama.cover,
            imageWidth: 200,
            confirmButtonText: 'ดูซีรีส์',
            showCancelButton: true,
            cancelButtonText: 'ปิด',
            customClass: { popup: 'swal2-dark' }
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = `detail.html?id=${bookId}`;
            }
        });

    } catch (error) {
        console.error('Failed to load info:', error);
        showError('ไม่สามารถโหลดข้อมูลได้');
    }
}

// ============================================
// Loading & Notification Functions
// ============================================

function showLoading(message = 'กำลังโหลด...') {
    Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => Swal.showLoading(),
        customClass: { popup: 'swal2-dark' }
    });
}

function hideLoading() {
    Swal.close();
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: message,
        confirmButtonText: 'ลองใหม่',
        customClass: { popup: 'swal2-dark' }
    }).then((result) => {
        if (result.isConfirmed) location.reload();
    });
}

function showToast(message, icon = 'info') {
    Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: 'swal2-dark' }
    }).fire({ icon, title: message });
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: message,
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'swal2-dark' }
    });
}

// ============================================
// Watch History / Continue Watching Functions
// ============================================

const WATCH_HISTORY_KEY = 'dramabox_watch_history';

function getWatchHistory() {
    try {
        const history = localStorage.getItem(WATCH_HISTORY_KEY);
        return history ? JSON.parse(history) : {};
    } catch (e) {
        return {};
    }
}

function renderContinueWatching() {
    const section = document.getElementById('continue-watching-section');
    const container = document.getElementById('continue-watching-grid');
    if (!section || !container) return;

    const history = getWatchHistory();
    const items = Object.values(history)
        .filter(item => item.bookName && item.currentTime > 30)
        .sort((a, b) => b.lastWatched - a.lastWatched)
        .slice(0, 10);

    if (items.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    container.innerHTML = items.map(item => {
        const progress = Math.min(item.progress || 0, 100);
        const epNumber = (item.episodeIndex || 0) + 1;

        return `
            <a href="watch.html?id=${item.bookId}&ep=${item.chapterId}&index=${item.episodeIndex}" class="continue-card">
                <div class="continue-card-image">
                    <img src="${item.cover}" alt="${item.bookName}" loading="lazy">
                    <div class="continue-card-overlay">
                        <div class="play-icon"><i data-lucide="play"></i></div>
                    </div>
                    <div class="continue-progress-bar">
                        <div class="continue-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="continue-card-content">
                    <h4 class="continue-card-title">${item.bookName}</h4>
                    <div class="continue-card-meta">
                        <span>ตอน ${epNumber}</span>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

function clearWatchHistory() {
    Swal.fire({
        title: 'ล้างประวัติการดู?',
        text: 'ข้อมูลการดูต่อทั้งหมดจะถูกลบ',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ล้างประวัติ',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'swal2-dark' }
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem(WATCH_HISTORY_KEY);
            const section = document.getElementById('continue-watching-section');
            if (section) section.style.display = 'none';
            showToast('ล้างประวัติแล้ว', 'success');
        }
    });
}

// Export functions
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showError = showError;
window.showToast = showToast;
window.showSuccess = showSuccess;
window.filterByCategory = filterByCategory;
window.resetCategoryFilter = resetCategoryFilter;
window.handleSearch = handleSearch;
window.showInfo = showInfo;
window.showViewAll = showViewAll;
window.closeViewAll = closeViewAll;
window.goToSlide = goToSlide;
window.clearWatchHistory = clearWatchHistory;
window.getWatchHistory = getWatchHistory;
window.renderContinueWatching = renderContinueWatching;
