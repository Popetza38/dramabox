// ========================================
// Home Page Script
// ========================================

// State
let heroSlides = [];
let currentHeroIndex = 0;
let heroInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initHomePage();
    } catch (error) {
        console.error('Failed to initialize home page:', error);
        Utils.toast('ไม่สามารถโหลดข้อมูลได้', 'error');
    } finally {
        hideLoadingScreen();
    }
});

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
}

// Initialize home page
async function initHomePage() {
    // Show skeleton loaders
    showSkeletons();

    // Load data in parallel - fetch 3 pages for more content
    const [homeData1, homeData2, homeData3, recommendData] = await Promise.all([
        API.getHome(1),
        API.getHome(2),
        API.getHome(3),
        API.getRecommend()
    ]);

    // Combine all home data
    let allDramas = [];
    if (homeData1?.success) allDramas = allDramas.concat(homeData1.data || []);
    if (homeData2?.success) allDramas = allDramas.concat(homeData2.data || []);
    if (homeData3?.success) allDramas = allDramas.concat(homeData3.data || []);

    // Process home data
    if (allDramas.length > 0) {
        // Setup hero with first 5 dramas
        setupHero(allDramas.slice(0, 5));

        // Filter dramas for different categories
        const dubbed = allDramas.filter(d => d.name?.includes('พากย์ไทย'));
        const sub = allDramas.filter(d => !d.name?.includes('พากย์ไทย'));
        const popular = allDramas.filter(d => d.cornerName?.includes('มาแรง'));

        // Render categories with more items
        renderSeriesSlider('dubbed-slider', dubbed.length ? dubbed : allDramas.slice(0, 15));
        renderSeriesSlider('sub-slider', sub.length ? sub : allDramas.slice(5, 20));
        renderSeriesSlider('new-slider', allDramas);
        renderSeriesSlider('popular-slider', popular.length ? popular : allDramas);
    }

    // Render recommendations
    if (recommendData?.success && recommendData.data) {
        renderSeriesSlider('recommend-slider', recommendData.data.map(normalizeRecommendData));
    }

    // Setup event listeners
    setupEventListeners();
}

// Normalize recommendation data to match home data format
function normalizeRecommendData(item) {
    return {
        id: item.bookId,
        name: item.bookName,
        cover: item.coverWap,
        chapterCount: item.chapterCount,
        introduction: item.introduction,
        playCount: item.playCount,
        cornerName: item.corner?.name,
        cornerColor: item.corner?.color,
        tags: item.tags || item.tagV3s?.map(t => ({ tagName: t.tagName }))
    };
}

// Show skeleton loaders
function showSkeletons() {
    const sliders = ['dubbed-slider', 'sub-slider', 'new-slider', 'popular-slider', 'recommend-slider'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.innerHTML = Array(6).fill(0).map(() => `
                <div class="series-card skeleton">
                    <div class="series-poster"></div>
                    <div class="series-info">
                        <div class="series-title">&nbsp;</div>
                        <div class="series-views">&nbsp;</div>
                    </div>
                </div>
            `).join('');
        }
    });
}

// Setup hero section
function setupHero(dramas) {
    heroSlides = dramas;
    const heroSlider = document.getElementById('hero-slider');
    const heroIndicators = document.getElementById('hero-indicators');

    if (!heroSlider || !dramas.length) return;

    // Render hero slides
    heroSlider.innerHTML = dramas.map((drama, index) => `
        <div class="hero-slide" style="background-image: url('${drama.cover}')" data-index="${index}">
            <div class="hero-content">
                <span class="hero-badge ${drama.cornerName?.includes('มาแรง') ? 'hot' : ''}">
                    <i class="fas ${drama.cornerName?.includes('มาแรง') ? 'fa-fire' : 'fa-star'}"></i>
                    ${drama.cornerName || 'แนะนำ'}
                </span>
                <h1 class="hero-title">${Utils.escapeHtml(drama.name)}</h1>
                <div class="hero-meta">
                    <span><i class="fas fa-play-circle"></i> ${drama.chapterCount || 0} ตอน</span>
                    <span><i class="fas fa-eye"></i> ${drama.playCount || '0'}</span>
                </div>
                <p class="hero-description">${Utils.escapeHtml(drama.introduction || '')}</p>
                <div class="hero-actions">
                    <a href="detail.html?id=${drama.id}" class="hero-btn primary">
                        <i class="fas fa-play"></i> ดูเลย
                    </a>
                    <button class="hero-btn secondary" onclick="toggleFavorite('${drama.id}', '${Utils.escapeHtml(drama.name)}', '${drama.cover}')">
                        <i class="fas ${Storage.favorites.isFavorite(drama.id) ? 'fa-heart' : 'fa-heart'}"></i>
                        ${Storage.favorites.isFavorite(drama.id) ? 'บันทึกแล้ว' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Render indicators
    heroIndicators.innerHTML = dramas.map((_, index) => `
        <div class="hero-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');

    // Add click events to indicators
    heroIndicators.querySelectorAll('.hero-indicator').forEach(indicator => {
        indicator.addEventListener('click', () => {
            goToHeroSlide(parseInt(indicator.dataset.index));
        });
    });

    // Start auto-slide
    startHeroAutoSlide();

    // Add touch/swipe support
    setupHeroSwipe(heroSlider);
}

// Go to specific hero slide
function goToHeroSlide(index) {
    const heroSlider = document.getElementById('hero-slider');
    const indicators = document.querySelectorAll('.hero-indicator');

    currentHeroIndex = index;
    heroSlider.style.transform = `translateX(-${index * 100}%)`;

    indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === index);
    });
}

// Start hero auto-slide
function startHeroAutoSlide() {
    stopHeroAutoSlide();
    heroInterval = setInterval(() => {
        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;
        goToHeroSlide(currentHeroIndex);
    }, 5000);
}

// Stop hero auto-slide
function stopHeroAutoSlide() {
    if (heroInterval) {
        clearInterval(heroInterval);
        heroInterval = null;
    }
}

// Setup hero swipe
function setupHeroSwipe(element) {
    let startX = 0;
    let isDragging = false;

    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        stopHeroAutoSlide();
    }, { passive: true });

    element.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentHeroIndex < heroSlides.length - 1) {
                goToHeroSlide(currentHeroIndex + 1);
            } else if (diff < 0 && currentHeroIndex > 0) {
                goToHeroSlide(currentHeroIndex - 1);
            }
        }

        isDragging = false;
        startHeroAutoSlide();
    }, { passive: true });
}

// Render series slider
function renderSeriesSlider(sliderId, dramas) {
    const slider = document.getElementById(sliderId);
    if (!slider || !dramas.length) return;

    slider.innerHTML = dramas.map(drama => createSeriesCard(drama)).join('');
}

// Create series card HTML
function createSeriesCard(drama) {
    const id = drama.id || drama.bookId;
    const name = drama.name || drama.bookName;
    const cover = drama.cover || drama.coverWap;
    const cornerClass = Utils.getCornerClass(drama.cornerName || drama.corner?.name);
    const cornerName = drama.cornerName || drama.corner?.name;

    return `
        <a href="detail.html?id=${id}" class="series-card">
            <div class="series-poster">
                <img src="${cover}" alt="${Utils.escapeHtml(name)}" loading="lazy">
                ${cornerName ? `<span class="series-corner ${cornerClass}">${cornerName}</span>` : ''}
                <div class="series-play-overlay">
                    <div class="series-play-btn">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <span class="series-episodes">${drama.chapterCount || 0} ตอน</span>
            </div>
            <div class="series-info">
                <h3 class="series-title">${Utils.escapeHtml(name)}</h3>
                <p class="series-views"><i class="fas fa-eye"></i> ${drama.playCount || '0'}</p>
            </div>
        </a>
    `;
}

// Toggle favorite
function toggleFavorite(bookId, name, cover) {
    const isFav = Storage.favorites.toggle({
        bookId,
        name,
        cover
    });

    Utils.toast(isFav ? 'เพิ่มในรายการโปรดแล้ว' : 'ลบออกจากรายการโปรดแล้ว', 'success');

    // Refresh hero to update button
    if (heroSlides.length) {
        setupHero(heroSlides);
        goToHeroSlide(currentHeroIndex);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    const searchModal = document.getElementById('search-modal');
    const modalSearchInput = document.getElementById('modal-search-input');
    const closeSearch = document.getElementById('close-search');
    const clearSearch = document.getElementById('clear-search');
    const searchResults = document.getElementById('search-results');

    // Open search modal on mobile
    if (searchInput) {
        searchInput.addEventListener('focus', () => {
            if (Utils.isMobile()) {
                searchModal.classList.add('active');
                modalSearchInput.focus();
            }
        });

        // Desktop search
        searchInput.addEventListener('input', Utils.debounce(async (e) => {
            if (!Utils.isMobile() && e.target.value.length >= 2) {
                await performSearch(e.target.value);
            }
        }, 500));
    }

    // Modal search input
    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', Utils.debounce(async (e) => {
            const query = e.target.value.trim();
            clearSearch.classList.toggle('visible', query.length > 0);

            if (query.length >= 2) {
                await performSearch(query, searchResults);
            } else {
                searchResults.innerHTML = `
                    <div class="search-placeholder">
                        <i class="fas fa-search"></i>
                        <p>ค้นหาซีรี่ย์ที่คุณต้องการดู</p>
                    </div>
                `;
            }
        }, 500));
    }

    // Close search
    if (closeSearch) {
        closeSearch.addEventListener('click', () => {
            searchModal.classList.remove('active');
            modalSearchInput.value = '';
            clearSearch.classList.remove('visible');
        });
    }

    // Clear search
    if (clearSearch) {
        clearSearch.addEventListener('click', () => {
            modalSearchInput.value = '';
            modalSearchInput.focus();
            clearSearch.classList.remove('visible');
            searchResults.innerHTML = `
                <div class="search-placeholder">
                    <i class="fas fa-search"></i>
                    <p>ค้นหาซีรี่ย์ที่คุณต้องการดู</p>
                </div>
            `;
        });
    }

    // Hide header on scroll down (mobile)
    let lastScrollY = 0;
    const topNav = document.querySelector('.top-nav');

    window.addEventListener('scroll', Utils.throttle(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            topNav.classList.add('hidden');
        } else {
            topNav.classList.remove('hidden');
        }

        lastScrollY = currentScrollY;
    }, 100));
}

// Perform search
async function performSearch(query, resultsContainer = null) {
    const container = resultsContainer || document.getElementById('search-results');

    try {
        container.innerHTML = `
            <div class="search-placeholder">
                <div class="loader" style="width: 40px; height: 40px;">
                    <div class="loader-ring"></div>
                </div>
                <p>กำลังค้นหา...</p>
            </div>
        `;

        const result = await API.search(query);

        if (result?.success && result.data?.length) {
            container.innerHTML = `
                <div class="search-results-list">
                    ${result.data.map(drama => `
                        <a href="detail.html?id=${drama.bookId || drama.id}" class="search-result-item">
                            <div class="search-result-poster">
                                <img src="${drama.coverWap || drama.cover}" alt="${Utils.escapeHtml(drama.bookName || drama.name)}">
                            </div>
                            <div class="search-result-info">
                                <h4 class="search-result-title">${Utils.escapeHtml(drama.bookName || drama.name)}</h4>
                                <p class="search-result-meta">${drama.chapterCount || 0} ตอน • ${drama.playCount || '0'} views</p>
                            </div>
                        </a>
                    `).join('')}
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>ไม่พบผลลัพธ์สำหรับ "${Utils.escapeHtml(query)}"</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>เกิดข้อผิดพลาดในการค้นหา</p>
            </div>
        `;
    }
}

// Make functions globally available
window.toggleFavorite = toggleFavorite;
