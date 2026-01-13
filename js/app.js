/**
 * DramaBox - Homepage Application Logic
 */

// Global state
let heroDramas = [];
let currentHeroIndex = 0;
let heroInterval = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

async function init() {
    // Setup navbar scroll effect
    setupNavbar();

    // Show loading with steps
    const steps = ['กำลังโหลดละครแนะนำ', 'กำลังโหลดละครกำลังฮิต', 'กำลังโหลดละครล่าสุด', 'กำลังโหลดละคร VIP'];
    utils.showSwalProgress('🎬 กำลังเตรียมข้อมูล', steps, 0);

    // Load Home dramas first and reuse for Hero
    const homeData = await dramaAPI.getHome(1, 20);

    // Update Hero section with Home data (Carousel mode)
    setupHeroCarousel(homeData);

    // Load Favorites section
    loadFavorites();

    // Load other sections with progress
    utils.showSwalProgress('🎬 กำลังโหลดข้อมูล', steps, 1);
    await loadCarouselSection('trending', () => Promise.resolve(homeData));

    utils.showSwalProgress('🎬 กำลังโหลดข้อมูล', steps, 2);
    await loadCarouselSection('latest', () => dramaAPI.getHome(2, 10));

    utils.showSwalProgress('🎬 กำลังโหลดข้อมูล', steps, 3);
    await loadCarouselSection('foryou', dramaAPI.getRecommend);

    await loadCarouselSection('vip', dramaAPI.getVip);

    // Hide loading and show success
    utils.hideSwalLoading();
    // Note: dubindo section removed - API doesn't support it for Thai region
}

/**
 * Setup navbar scroll effect
 */
function setupNavbar() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/**
 * Setup hero carousel with multiple dramas
 */
function setupHeroCarousel(trending) {
    if (!trending) return;

    try {
        // Handle both array and object with .data
        let dramas = Array.isArray(trending) ? trending : (trending.data || trending);
        if (!dramas || !Array.isArray(dramas) || dramas.length === 0) return;

        // Filter out invalid dramas (no cover image)
        dramas = dramas.filter(d => d && (d.cover || d.coverWap));

        // Take top 5 for the hero carousel
        heroDramas = dramas.slice(0, 5);

        // Create indicators
        const indicatorsContainer = document.getElementById('heroIndicators');
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = heroDramas.map((_, index) =>
                `<div class="indicator ${index === 0 ? 'active' : ''}" onclick="goToHero(${index})"></div>`
            ).join('');
        }

        // Initial set
        setHeroDrama(0);

        // Start auto-slide
        startHeroAutoSlide();
    } catch (error) {
        console.error('Error setting up hero carousel:', error);
    }
}

/**
 * Set a specific drama in the hero section
 */
function setHeroDrama(index) {
    if (!heroDramas[index]) return;

    const drama = heroDramas[index];
    currentHeroIndex = index;

    const heroContent = document.querySelector('.hero-content');
    const heroImage = document.getElementById('heroImage');

    // Update indicators
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((ind, i) => {
        if (i === index) ind.classList.add('active');
        else ind.classList.remove('active');
    });

    // Fade out effect
    heroContent.classList.add('fade-out');
    heroImage.style.opacity = '0.3';

    setTimeout(() => {
        // Update content - handle both old (bookName) and new (name) formats
        const cover = drama.coverWap || drama.cover || (window.PLACEHOLDER_HERO || '');
        const name = drama.bookName || drama.name || 'Drama';
        const id = drama.bookId || drama.id;
        const episodes = drama.chapterCount || 0;
        const tags = drama.tags || drama.tagV3s || [];

        if (cover) heroImage.src = cover;
        document.getElementById('heroTitle').textContent = name;
        document.getElementById('heroDescription').textContent = drama.introduction || '';
        document.getElementById('heroEpisodes').textContent = episodes;
        document.getElementById('heroHot').textContent = drama.playCount ? utils.formatNumber(drama.playCount) : '0';

        if (tags && tags.length > 0) {
            const firstTag = typeof tags[0] === 'string' ? tags[0] : (tags[0].tagName || tags[0].name || 'Trending');
            document.getElementById('heroTag').textContent = firstTag;
        } else {
            document.getElementById('heroTag').textContent = 'Trending';
        }

        // Finalize state
        heroImage.style.opacity = '1';
        heroContent.classList.remove('fade-out');

        // Re-initialize icons
        if (window.lucide) lucide.createIcons();
    }, 400);
}

/**
 * Go to a specific hero slide manually
 */
function goToHero(index) {
    stopHeroAutoSlide();
    setHeroDrama(index);
    startHeroAutoSlide();
}

/**
 * Start auto-sliding the hero
 */
function startHeroAutoSlide() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        let nextIndex = (currentHeroIndex + 1) % heroDramas.length;
        setHeroDrama(nextIndex);
    }, 6000); // Cycle every 6 seconds
}

/**
 * Stop auto-sliding the hero
 */
function stopHeroAutoSlide() {
    if (heroInterval) clearInterval(heroInterval);
}

/**
 * Load carousel section with dramas
 */
async function loadCarouselSection(sectionId, fetchFunction) {
    const carousel = document.getElementById(`${sectionId}Carousel`);

    // Show loading skeletons
    utils.showLoading(carousel, 8);

    try {
        let dramas = await fetchFunction();

        // Handle different API response structures
        if (dramas && dramas.data) {
            dramas = dramas.data;
        }

        if (dramas && dramas.length > 0) {
            carousel.innerHTML = dramas.map(drama => utils.createDramaCard(drama)).join('');
            // Re-initialize icons for new cards
            if (window.lucide) lucide.createIcons();
        } else {
            carousel.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">ไม่มีละครที่พร้อมใช้งาน</p>';
        }
    } catch (error) {
        console.error(`Error loading ${sectionId}:`, error);
        carousel.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">ไม่สามารถโหลดข้อมูลได้</p>';

        // Show SweetAlert notification on first error only
        if (window.Swal && !window._errorShown) {
            window._errorShown = true;
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลละครได้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#E50914',
                background: '#1e1e1e',
                color: '#fff'
            });
        }
    }
}

/**
 * Scroll carousel left or right
 */
function scrollCarousel(sectionId, direction) {
    const carousel = document.getElementById(`${sectionId}Carousel`);
    const scrollAmount = 600;

    carousel.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

/**
 * Toggle search input visibility
 */
function toggleSearch() {
    const container = document.getElementById('searchContainer');
    const input = document.getElementById('navSearchInput');

    container.classList.toggle('active');

    if (container.classList.contains('active')) {
        input.focus();
    }
}

/**
 * Handle search from navbar
 */
function handleNavSearch(event) {
    if (event.key === 'Enter') {
        const query = document.getElementById('navSearchInput').value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    }
}

/**
 * Watch hero drama
 */
function watchHero() {
    const drama = heroDramas[currentHeroIndex];
    if (drama) {
        const id = drama.bookId || drama.id;
        window.location.href = `drama.html?id=${id}`;
    }
}

/**
 * View hero drama detail
 */
function viewHeroDetail() {
    const drama = heroDramas[currentHeroIndex];
    if (drama) {
        const id = drama.bookId || drama.id;
        window.location.href = `drama.html?id=${id}`;
    }
}

// Close search on click outside
document.addEventListener('click', (e) => {
    const searchContainer = document.getElementById('searchContainer');
    if (searchContainer && !searchContainer.contains(e.target)) {
        searchContainer.classList.remove('active');
    }
});



/**
 * Load Favorites section from storage
 */
function loadFavorites() {
    const favorites = storage.getFavorites();
    const section = document.getElementById('favoritesSection');
    const carousel = document.getElementById('favoritesCarousel');

    if (!favorites || favorites.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    carousel.innerHTML = favorites.slice(0, 10).map(item => `
        <div class="drama-card" onclick="window.location.href='drama.html?id=${item.dramaId}'">
            <div class="drama-card-poster">
                <img src="${item.cover || utils.placeholderImage}" alt="${item.dramaName}" 
                     onerror="this.src='${utils.placeholderImage}'">
                <button class="favorite-btn active" onclick="event.stopPropagation(); toggleFavoriteFromCard('${item.dramaId}', this)" title="ลบจากรายการโปรด">
                    <i data-lucide="heart"></i>
                </button>
                <div class="drama-card-overlay">
                    <div class="drama-card-play"><i data-lucide="play"></i></div>
                </div>
            </div>
            <div class="drama-card-info">
                <div class="drama-card-title">${item.dramaName}</div>
                <div class="drama-card-meta">
                    <span><i data-lucide="tv" class="icon-xs"></i> ${item.totalEpisodes || '?'} ตอน</span>
                </div>
            </div>
        </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

/**
 * Toggle favorite from card
 */
function toggleFavoriteFromCard(dramaId, btn) {
    storage.removeFavorite(dramaId);
    btn.closest('.drama-card').remove();

    // Check if favorites section is now empty
    const favorites = storage.getFavorites();
    if (!favorites || favorites.length === 0) {
        document.getElementById('favoritesSection').style.display = 'none';
    }

    Swal.fire({
        icon: 'success',
        title: '💔 ลบจากรายการโปรดแล้ว',
        timer: 1000,
        showConfirmButton: false,
        background: 'linear-gradient(145deg, #1e1e1e, #2d2d2d)',
        color: '#fff'
    });
}
