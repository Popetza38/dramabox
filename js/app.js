/**
 * DramaPop Main Application - Enhanced with more categories
 */

const App = {
    state: {
        currentPage: 'home',
        searchPage: 1,
        categoryPage: 1,
        currentDrama: null,
        currentEpisode: 1,
        chapters: [],
        hls: null,
        allDramas: [], // Store all loaded dramas for filtering
        forYouSlider: {
            currentIndex: 0,
            itemsPerView: 6,
            autoScrollInterval: null
        },
        // Category page state
        currentCategoryType: null,
        categoryDramas: [],
        categoryDisplayCount: 20
    },

    init() {
        this.bindEvents();
        this.loadHomePage();
        setTimeout(() => document.getElementById('loadingOverlay').classList.add('hidden'), 1500);
    },

    bindEvents() {
        // Search
        document.getElementById('searchForm')?.addEventListener('submit', e => {
            e.preventDefault();
            this.performSearch(document.getElementById('searchInput').value);
        });
        document.getElementById('mobileSearchForm')?.addEventListener('submit', e => {
            e.preventDefault();
            this.performSearch(document.getElementById('mobileSearchInput').value);
            document.getElementById('mobileSearchModal').classList.remove('active');
        });
        document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
            document.getElementById('mobileSearchModal').classList.add('active');
            document.getElementById('mobileSearchInput').focus();
        });
        document.getElementById('mobileSearchClose')?.addEventListener('click', () => {
            document.getElementById('mobileSearchModal').classList.remove('active');
        });

        // Navigation - Mobile bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                this.handleNavigation(item.dataset.page);
            });
        });

        // Navigation - Desktop nav
        document.querySelectorAll('.nav-desktop .nav-link').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const page = item.dataset.page;

                // Update active state
                document.querySelectorAll('.nav-desktop .nav-link').forEach(link => link.classList.remove('active'));
                item.classList.add('active');

                this.handleNavigation(page);
            });
        });

        // Back buttons
        document.getElementById('searchBackBtn')?.addEventListener('click', () => this.showPage('home'));
        document.getElementById('detailBackBtn')?.addEventListener('click', () => this.showPage('home'));
        document.getElementById('watchBackBtn')?.addEventListener('click', () => this.showDetailPage(this.state.currentDrama));
        document.getElementById('categoryBackBtn')?.addEventListener('click', () => this.showPage('home'));

        // See all buttons
        document.querySelectorAll('.see-all-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                const section = btn.dataset.section;
                this.loadCategoryPage(section);
            });
        });

        // Category load more button
        document.getElementById('categoryLoadMore')?.addEventListener('click', () => {
            this.loadMoreCategory();
        });

        // Language selector
        this.initLanguageSelector();

        // Video controls
        this.initVideoPlayer();
    },

    initLanguageSelector() {
        const selector = document.getElementById('languageSelector');
        const btn = document.getElementById('languageBtn');
        const dropdown = document.getElementById('languageDropdown');

        if (!selector || !btn || !dropdown) return;

        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!selector.contains(e.target)) {
                selector.classList.remove('active');
            }
        });

        // Language option click
        dropdown.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', () => {
                const lang = option.dataset.lang;
                const flag = option.querySelector('.flag-icon').textContent;
                const langName = option.querySelector('span:not(.flag-icon)').textContent;

                // Update button
                btn.querySelector('.flag-icon').textContent = flag;
                btn.querySelector('.lang-text').textContent = langName;

                // Update active state
                dropdown.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');

                // Store preference
                localStorage.setItem('preferredLanguage', lang);

                // Update API language
                API.setLanguage(lang);

                // Close dropdown
                selector.classList.remove('active');

                // Show notification and reload content
                Swal.fire({
                    icon: 'success',
                    title: 'เปลี่ยนภาษาเสียงสำเร็จ',
                    text: `กำลังโหลดหนัง${langName}...`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#1a1a1a',
                    color: '#fff'
                }).then(() => {
                    // Reload home page with new language
                    this.loadHomePage();
                });
            });
        });

        // Load saved preference
        const savedLang = localStorage.getItem('preferredLanguage');
        if (savedLang) {
            // Update API language first
            API.setLanguage(savedLang);

            // Update UI only (without triggering reload)
            const savedOption = dropdown.querySelector(`[data-lang="${savedLang}"]`);
            if (savedOption) {
                const flag = savedOption.querySelector('.flag-icon').textContent;
                const langName = savedOption.querySelector('span:not(.flag-icon)').textContent;
                btn.querySelector('.flag-icon').textContent = flag;
                btn.querySelector('.lang-text').textContent = langName;
                dropdown.querySelectorAll('.language-option').forEach(o => o.classList.remove('active'));
                savedOption.classList.add('active');
            }
        }
    },

    async loadHomePage() {
        try {
            // Show loading toast
            Swal.fire({
                title: 'กำลังโหลดข้อมูล...',
                html: '<i class="fas fa-spinner fa-spin"></i> โปรดรอสักครู่',
                allowOutsideClick: false,
                showConfirmButton: false,
                background: '#1a1a1a',
                color: '#fff',
                timer: 2000
            });

            // Fetch multiple pages for more content (use allSettled to handle failures gracefully)
            const results = await Promise.allSettled([
                API.getForYou(1),
                API.getForYou(2),
                API.getForYou(3),
                API.getForYou(4),
                API.getForYou(5),
                API.getNew(1),
                API.getNew(2),
                API.getNew(3),
                API.getNew(4),
                API.getNew(5),
                API.getRanking(1),
                API.getRanking(2),
                API.getRanking(3),
                API.getRanking(4),
                API.getRanking(5)
            ]);

            // Extract successful results
            const getData = (result) => result.status === 'fulfilled' ? result.value : null;

            // Combine forYou (results 0-4)
            const forYouList = [
                ...(getData(results[0])?.list || []),
                ...(getData(results[1])?.list || []),
                ...(getData(results[2])?.list || []),
                ...(getData(results[3])?.list || []),
                ...(getData(results[4])?.list || [])
            ];

            // Combine new dramas (results 5-9)
            const newList = [
                ...(getData(results[5])?.list || []),
                ...(getData(results[6])?.list || []),
                ...(getData(results[7])?.list || []),
                ...(getData(results[8])?.list || []),
                ...(getData(results[9])?.list || [])
            ];

            // Combine ranking (results 10-14)
            const rankingList = [
                ...(getData(results[10])?.list || []),
                ...(getData(results[11])?.list || []),
                ...(getData(results[12])?.list || []),
                ...(getData(results[13])?.list || []),
                ...(getData(results[14])?.list || [])
            ];

            // Remove duplicates based on bookId
            const uniqueDramas = [];
            const seenIds = new Set();
            [...forYouList, ...newList, ...rankingList].forEach(d => {
                if (d && d.bookId && !seenIds.has(d.bookId)) {
                    seenIds.add(d.bookId);
                    uniqueDramas.push(d);
                }
            });

            // Store all for filtering
            this.state.allDramas = uniqueDramas;

            // Render main sections (show more items - 30 per section)
            this.renderDramaGrid('forYouGrid', forYouList.slice(0, 30));
            this.renderDramaGrid('newDramasGrid', newList.slice(0, 30));
            this.renderDramaGrid('rankingGrid', rankingList.slice(0, 30));
            this.renderDramaGrid('classifyGrid', rankingList.slice(0, 20));

            // Helper function for fuzzy tag matching
            const matchesCategory = (drama, keywords) => {
                if (!drama) return false;
                const tags = drama.tags || [];
                const name = (drama.bookName || '').toLowerCase();
                const intro = (drama.introduction || '').toLowerCase();

                return keywords.some(kw => {
                    const keyword = kw.toLowerCase();
                    // Check in tags
                    if (tags.some(t => t && t.toLowerCase().includes(keyword))) return true;
                    // Check in name
                    if (name.includes(keyword)) return true;
                    // Check in introduction
                    if (intro.includes(keyword)) return true;
                    return false;
                });
            };

            const allDramas = this.state.allDramas;

            // Romance - โรแมนติก
            const romanceKeywords = ['โรแมนติก', 'รัก', 'หวาน', 'แต่งงาน', 'คู่รัก', 'พรหมลิขิต', 'หัวใจ', 'รักแรก', 'จีบ', 'แฟน', 'ความรัก', 'romance', 'love'];
            const romance = allDramas.filter(d => matchesCategory(d, romanceKeywords));
            this.renderDramaGrid('romanceGrid', romance.slice(0, 30));

            // CEO/President - ท่านประธาน
            const ceoKeywords = ['ประธาน', 'CEO', 'เจ้าพ่อ', 'มหาเศรษฐี', 'ตระกูล', 'รวย', 'บริษัท', 'เศรษฐี', 'ผู้บริหาร', 'boss', 'rich'];
            const ceo = allDramas.filter(d => matchesCategory(d, ceoKeywords));
            this.renderDramaGrid('ceoGrid', ceo.slice(0, 30));

            // Fantasy - แฟนตาซี
            const fantasyKeywords = ['แฟนตาซี', 'เหนือธรรมชาติ', 'วิญญาณ', 'เกิดใหม่', 'ระบบ', 'พลัง', 'เวทมนตร์', 'fantasy', 'ปีศาจ', 'นรก', 'สวรรค์', 'อมตะ'];
            const fantasy = allDramas.filter(d => matchesCategory(d, fantasyKeywords));
            this.renderDramaGrid('fantasyGrid', fantasy.slice(0, 30));

            // Period/Historical - พีเรียด
            const periodKeywords = ['พีเรียด', 'ย้อนยุค', 'ข้ามเวลา', 'ราชวงศ์', 'โบราณ', 'ฮองเฮา', 'จักรพรรดิ', 'องค์ชาย', 'องค์หญิง', 'วังหลวง', 'period', 'historical'];
            const period = allDramas.filter(d => matchesCategory(d, periodKeywords));
            this.renderDramaGrid('periodGrid', period.slice(0, 30));

            // Revenge/Action - แก้แค้น
            const revengeKeywords = ['แก้แค้น', 'ล้างแค้น', 'ตบหน้า', 'หักหลัง', 'ทวงคืน', 'revenge', 'ปกป้อง', 'สู้', 'แก้เผ็ด', 'หักมุม'];
            const revenge = allDramas.filter(d => matchesCategory(d, revengeKeywords));
            this.renderDramaGrid('revengeGrid', revenge.slice(0, 30));

            // Set hero background
            if (forYouList[0]?.cover) {
                document.getElementById('heroSlider').style.backgroundImage = `url(${forYouList[0].cover})`;
            }

            // Initialize all sliders with item counts
            this.initAllSliders({
                forYou: forYouList.length,
                newDramas: newList.length,
                ranking: rankingList.length,
                classify: Math.min(rankingList.length, 10),
                romance: romance.length,
                ceo: ceo.length,
                fantasy: fantasy.length,
                period: period.length,
                revenge: revenge.length
            });

            Swal.close();

        } catch (error) {
            console.error('Load error:', error);
            this.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    },

    renderDramaGrid(containerId, dramas) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!dramas || dramas.length === 0) {
            container.innerHTML = '<p style="color:#808080; padding:20px;">ไม่มีข้อมูล</p>';
            return;
        }

        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" data-id="${drama.bookId}">
                <div class="drama-poster">
                    <img src="${drama.cover}" alt="${drama.bookName}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
                    ${drama.corner ? `<span class="drama-badge" style="background:${drama.corner.color}">${drama.corner.name}</span>` : ''}
                    <div class="drama-play-overlay">
                        <div class="drama-play-btn"><i class="fas fa-play"></i></div>
                    </div>
                </div>
                <div class="drama-info">
                    <h3 class="drama-title">${drama.bookName}</h3>
                    <div class="drama-meta">
                        <span><i class="fas fa-film"></i> ${drama.chapterCount || 0} ตอน</span>
                        <span><i class="fas fa-eye"></i> ${drama.playCount || '0'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.drama-card').forEach(card => {
            card.addEventListener('click', () => this.showDetailPage(card.dataset.id));
        });
    },

    // Generic slider initialization for all sections
    sliderStates: {},

    initSlider(sliderName, gridId, totalItems) {
        const sliderContainer = document.querySelector(`[data-slider="${sliderName}"]`);
        const grid = document.getElementById(gridId);
        const pagination = document.querySelector(`[data-for="${sliderName}"]`);

        if (!sliderContainer || !grid) return;

        const prevBtn = sliderContainer.querySelector('.slider-nav.prev');
        const nextBtn = sliderContainer.querySelector('.slider-nav.next');

        if (!prevBtn || !nextBtn) return;

        // Initialize state for this slider
        this.sliderStates[sliderName] = {
            currentIndex: 0,
            itemsPerView: 6,
            autoScrollInterval: null
        };

        const state = this.sliderStates[sliderName];

        // Calculate items per view based on screen width
        const updateItemsPerView = () => {
            const width = window.innerWidth;
            if (width <= 480) state.itemsPerView = 3;
            else if (width <= 768) state.itemsPerView = 4;
            else if (width <= 1024) state.itemsPerView = 5;
            else state.itemsPerView = 6;
        };

        updateItemsPerView();

        const itemsToShow = Math.min(totalItems, 15);
        const totalPages = Math.ceil(itemsToShow / state.itemsPerView);

        // Create pagination dots
        if (pagination && totalPages > 1) {
            pagination.innerHTML = '';
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('span');
                dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
                dot.dataset.index = i;
                dot.addEventListener('click', () => scrollTo(i));
                pagination.appendChild(dot);
            }
        }

        // Scroll function
        const scrollTo = (index) => {
            const cards = grid.querySelectorAll('.drama-card');
            if (cards.length === 0) return;

            const cardWidth = cards[0].offsetWidth + 10; // include gap
            const scrollPosition = index * state.itemsPerView * cardWidth;
            grid.scrollTo({ left: scrollPosition, behavior: 'smooth' });

            state.currentIndex = index;

            // Update pagination dots
            if (pagination) {
                pagination.querySelectorAll('.slider-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }

            // Update button states
            prevBtn.disabled = index === 0;
            nextBtn.disabled = index >= totalPages - 1;
        };

        // Button click handlers
        prevBtn.addEventListener('click', () => {
            if (state.currentIndex > 0) {
                scrollTo(state.currentIndex - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (state.currentIndex < totalPages - 1) {
                scrollTo(state.currentIndex + 1);
            }
        });

        // Auto-scroll every 5 seconds (only for forYou slider)
        if (sliderName === 'forYou') {
            const startAutoScroll = () => {
                state.autoScrollInterval = setInterval(() => {
                    let nextIndex = state.currentIndex + 1;
                    if (nextIndex >= totalPages) nextIndex = 0;
                    scrollTo(nextIndex);
                }, 5000);
            };

            const stopAutoScroll = () => {
                if (state.autoScrollInterval) {
                    clearInterval(state.autoScrollInterval);
                }
            };

            // Pause auto-scroll on hover
            sliderContainer.addEventListener('mouseenter', stopAutoScroll);
            sliderContainer.addEventListener('mouseleave', startAutoScroll);

            // Start auto-scroll
            startAutoScroll();
        }

        // Initial state
        prevBtn.disabled = true;
        nextBtn.disabled = totalPages <= 1;
    },

    // Initialize all sliders
    initAllSliders(counts) {
        this.initSlider('forYou', 'forYouGrid', counts.forYou || 15);
        this.initSlider('newDramas', 'newDramasGrid', counts.newDramas || 15);
        this.initSlider('ranking', 'rankingGrid', counts.ranking || 15);
        this.initSlider('classify', 'classifyGrid', counts.classify || 10);
        this.initSlider('romance', 'romanceGrid', counts.romance || 15);
        this.initSlider('ceo', 'ceoGrid', counts.ceo || 15);
        this.initSlider('fantasy', 'fantasyGrid', counts.fantasy || 15);
        this.initSlider('period', 'periodGrid', counts.period || 15);
        this.initSlider('revenge', 'revengeGrid', counts.revenge || 15);

        // Add resize listener once
        window.addEventListener('resize', () => {
            Object.keys(this.sliderStates).forEach(name => {
                const state = this.sliderStates[name];
                const width = window.innerWidth;
                if (width <= 480) state.itemsPerView = 3;
                else if (width <= 768) state.itemsPerView = 4;
                else if (width <= 1024) state.itemsPerView = 5;
                else state.itemsPerView = 6;
            });
        });
    },

    async showDetailPage(bookId) {
        this.state.currentDrama = bookId;
        this.showPage('detail');

        Swal.fire({
            title: 'กำลังโหลด...',
            allowOutsideClick: false,
            showConfirmButton: false,
            background: '#141414',
            color: '#fff',
            didOpen: () => Swal.showLoading()
        });

        try {
            const [detail, chapters] = await Promise.all([
                API.getDramaDetail(bookId),
                API.getChapters(bookId)
            ]);

            console.log('Drama Detail:', detail);
            console.log('Chapters:', chapters);

            // Handle different response structures
            const dramaData = detail?.drama || detail?.data || detail || {};

            // Try to get cover from detail, or fallback to cached drama data
            let cover = dramaData.cover || dramaData.poster || dramaData.image || dramaData.coverUrl || '';

            // Fallback: find cover from allDramas cache if not in detail
            if (!cover) {
                const cachedDrama = this.state.allDramas.find(d => d.bookId == bookId);
                if (cachedDrama?.cover) {
                    cover = cachedDrama.cover;
                }
            }

            const bookName = dramaData.bookName || dramaData.name || dramaData.title || 'ไม่ทราบชื่อ';
            const tags = dramaData.tags || dramaData.genres || [];
            const chapterCount = dramaData.chapterCount || dramaData.episodeCount || 0;
            const playCount = dramaData.playCount || dramaData.viewCount || '0';
            const introduction = dramaData.introduction || dramaData.description || dramaData.synopsis || 'ไม่มีเรื่องย่อ';

            // Handle chapters - could be array directly or in list property
            let chapterList = [];
            if (Array.isArray(chapters)) {
                chapterList = chapters;
            } else if (chapters?.list && Array.isArray(chapters.list)) {
                chapterList = chapters.list;
            } else if (chapters?.chapters && Array.isArray(chapters.chapters)) {
                chapterList = chapters.chapters;
            } else if (chapters?.data && Array.isArray(chapters.data)) {
                chapterList = chapters.data;
            }

            // If still empty, create from chapterCount
            if (chapterList.length === 0 && chapterCount > 0) {
                chapterList = Array.from({ length: chapterCount }, (_, i) => ({ index: i + 1 }));
            }

            this.state.chapters = chapterList;
            console.log('Parsed chapters:', chapterList);

            document.getElementById('detailBackdrop').style.backgroundImage = cover ? `url(${cover})` : 'none';
            document.getElementById('detailInfo').innerHTML = `
                <div class="detail-poster">${cover ? `<img src="${cover}" alt="${bookName}" onerror="this.style.display='none'">` : '<div class="no-poster"><i class="fas fa-film"></i></div>'}</div>
                <div class="detail-text">
                    <h1 class="detail-title">${bookName}</h1>
                    <div class="detail-tags">${tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}</div>
                    <div class="detail-stats">
                        <span><i class="fas fa-film"></i> ${chapterCount} ตอน</span>
                        <span><i class="fas fa-eye"></i> ${playCount} ยอดชม</span>
                    </div>
                    <p class="detail-desc">${introduction}</p>
                    <button class="detail-watch-btn" id="watchNowBtn">
                        <i class="fas fa-play"></i> ดูเลย
                    </button>
                </div>
            `;

            // Render episode buttons
            const episodesGrid = document.getElementById('episodesGrid');
            if (this.state.chapters.length > 0) {
                episodesGrid.innerHTML = this.state.chapters.map((ch, i) => `
                    <button class="episode-btn" data-index="${ch.index || i + 1}">ตอนที่ ${ch.index || i + 1}</button>
                `).join('');
            } else {
                episodesGrid.innerHTML = '<p class="no-episodes">ไม่พบรายการตอน</p>';
            }

            document.getElementById('watchNowBtn')?.addEventListener('click', () => this.playEpisode(1));
            document.querySelectorAll('.episode-btn').forEach(btn => {
                btn.addEventListener('click', () => this.playEpisode(parseInt(btn.dataset.index)));
            });

            Swal.close();

        } catch (error) {
            console.error('Detail page error:', error);
            this.showError('ไม่สามารถโหลดข้อมูลซีรี่ย์ได้');
        }
    },

    async playEpisode(index) {
        this.state.currentEpisode = index;
        this.showPage('watch');
        document.getElementById('videoLoading').classList.remove('hidden');
        document.getElementById('currentEpisode').textContent = `ตอนที่ ${index}`;

        try {
            const video = await API.getVideoUrl(this.state.currentDrama, index);
            const videoUrl = video.url || video.videoUrl || video;
            this.loadVideo(videoUrl);

            this.renderEpisodeList();
            this.updateEpisodeNav();
        } catch (error) {
            this.showError('ไม่สามารถโหลดวิดีโอได้');
        }
    },

    loadVideo(url) {
        const video = document.getElementById('videoPlayer');
        if (this.state.hls) this.state.hls.destroy();

        if (Hls.isSupported() && url.includes('.m3u8')) {
            this.state.hls = new Hls();
            this.state.hls.loadSource(url);
            this.state.hls.attachMedia(video);
            this.state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play();
                document.getElementById('videoLoading').classList.add('hidden');
            });
        } else {
            video.src = url;
            video.addEventListener('loadeddata', () => {
                video.play();
                document.getElementById('videoLoading').classList.add('hidden');
            }, { once: true });
        }
    },

    renderEpisodeList() {
        document.getElementById('episodeList').innerHTML = this.state.chapters.map((ch, i) => `
            <button class="episode-btn ${i + 1 === this.state.currentEpisode ? 'active' : ''}" 
                    data-index="${i + 1}">ตอนที่ ${i + 1}</button>
        `).join('');

        document.querySelectorAll('#episodeList .episode-btn').forEach(btn => {
            btn.addEventListener('click', () => this.playEpisode(parseInt(btn.dataset.index)));
        });
    },

    updateEpisodeNav() {
        const prev = document.getElementById('prevEpisodeBtn');
        const next = document.getElementById('nextEpisodeBtn');
        prev.disabled = this.state.currentEpisode <= 1;
        next.disabled = this.state.currentEpisode >= this.state.chapters.length;

        prev.onclick = () => this.playEpisode(this.state.currentEpisode - 1);
        next.onclick = () => this.playEpisode(this.state.currentEpisode + 1);
    },

    initVideoPlayer() {
        const video = document.getElementById('videoPlayer');
        const playPause = document.getElementById('playPauseBtn');
        const progress = document.getElementById('progressBar');
        const progressCurrent = document.getElementById('progressCurrent');
        const currentTime = document.getElementById('currentTime');
        const duration = document.getElementById('duration');
        const fullscreen = document.getElementById('fullscreenBtn');
        const volume = document.getElementById('volumeSlider');
        const mute = document.getElementById('muteBtn');

        playPause?.addEventListener('click', () => {
            if (video.paused) { video.play(); playPause.innerHTML = '<i class="fas fa-pause"></i>'; }
            else { video.pause(); playPause.innerHTML = '<i class="fas fa-play"></i>'; }
        });

        video?.addEventListener('timeupdate', () => {
            const pct = (video.currentTime / video.duration) * 100;
            progressCurrent.style.width = `${pct}%`;
            currentTime.textContent = this.formatTime(video.currentTime);
        });

        video?.addEventListener('loadedmetadata', () => {
            duration.textContent = this.formatTime(video.duration);
        });

        video?.addEventListener('ended', () => {
            // Auto play next episode
            if (this.state.currentEpisode < this.state.chapters.length) {
                Swal.fire({
                    title: 'ตอนถัดไป',
                    text: 'กำลังเล่นตอนถัดไปใน 5 วินาที...',
                    timer: 5000,
                    timerProgressBar: true,
                    showCancelButton: true,
                    confirmButtonText: 'เล่นเลย',
                    cancelButtonText: 'ยกเลิก',
                    background: '#1a1a1a',
                    color: '#fff'
                }).then((result) => {
                    if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
                        this.playEpisode(this.state.currentEpisode + 1);
                    }
                });
            }
        });

        progress?.addEventListener('click', e => {
            const rect = progress.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            video.currentTime = pct * video.duration;
        });

        fullscreen?.addEventListener('click', () => {
            const container = document.getElementById('videoContainer');
            if (document.fullscreenElement) document.exitFullscreen();
            else container.requestFullscreen();
        });

        volume?.addEventListener('input', () => { video.volume = volume.value; });
        mute?.addEventListener('click', () => {
            video.muted = !video.muted;
            mute.innerHTML = video.muted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        });

        document.getElementById('skipBackBtn')?.addEventListener('click', () => { video.currentTime -= 10; });
        document.getElementById('skipForwardBtn')?.addEventListener('click', () => { video.currentTime += 10; });
    },

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    async performSearch(query) {
        if (!query.trim()) return;
        document.getElementById('searchQuery').textContent = query;
        this.showPage('search');

        Swal.fire({
            title: 'กำลังค้นหา...',
            allowOutsideClick: false,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff',
            didOpen: () => Swal.showLoading()
        });

        try {
            const [results1, results2] = await Promise.all([
                API.search(query, 1),
                API.search(query, 2)
            ]);
            const allResults = [...(results1?.list || []), ...(results2?.list || [])];
            this.renderSearchResults(allResults);
            Swal.close();
        } catch (error) {
            this.showError('ไม่สามารถค้นหาได้');
        }
    },

    renderSearchResults(dramas) {
        const container = document.getElementById('searchResults');
        if (dramas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>ไม่พบผลลัพธ์</h3><p>ลองค้นหาด้วยคำอื่น</p></div>';
            return;
        }
        container.innerHTML = dramas.map(drama => `
            <div class="drama-card" data-id="${drama.bookId}">
                <div class="drama-poster">
                    <img src="${drama.cover}" alt="${drama.bookName}" loading="lazy">
                    ${drama.corner ? `<span class="drama-badge" style="background:${drama.corner.color}">${drama.corner.name}</span>` : ''}
                </div>
                <div class="drama-info">
                    <h3 class="drama-title">${drama.bookName}</h3>
                    <div class="drama-meta">
                        <span><i class="fas fa-film"></i> ${drama.chapterCount || 0} ตอน</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.drama-card').forEach(card => {
            card.addEventListener('click', () => this.showDetailPage(card.dataset.id));
        });
    },

    handleNavigation(page) {
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`.bottom-nav-item[data-page="${page}"]`)?.classList.add('active');

        if (page === 'search') {
            document.getElementById('mobileSearchModal').classList.add('active');
        } else if (page === 'new' || page === 'ranking') {
            this.loadCategoryPage(page);
        } else {
            this.showPage('home');
        }
    },

    async loadCategoryPage(type) {
        const titles = {
            'new': 'ซีรี่ย์มาใหม่',
            'ranking': 'ยอดนิยม',
            'foryou': 'แนะนำสำหรับคุณ',
            'classify': 'มาแรง',
            'romance': 'โรแมนติก',
            'ceo': 'ท่านประธาน',
            'fantasy': 'แฟนตาซี',
            'period': 'พีเรียด/ย้อนยุค',
            'revenge': 'แก้แค้น'
        };

        document.getElementById('categoryTitle').textContent = titles[type] || 'หมวดหมู่';
        this.showPage('category');

        Swal.fire({
            title: 'กำลังโหลด...',
            allowOutsideClick: false,
            showConfirmButton: false,
            background: '#1a1a1a',
            color: '#fff',
            didOpen: () => Swal.showLoading()
        });

        try {
            let dramas = [];

            // Fetch multiple pages for more content
            if (type === 'new') {
                const [p1, p2, p3] = await Promise.all([API.getNew(1), API.getNew(2), API.getNew(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else if (type === 'ranking') {
                const [p1, p2, p3] = await Promise.all([API.getRanking(1), API.getRanking(2), API.getRanking(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else if (type === 'foryou') {
                const [p1, p2, p3] = await Promise.all([API.getForYou(1), API.getForYou(2), API.getForYou(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else if (type === 'classify') {
                // Use forYou as fallback since classify endpoint doesn't exist
                const [p1, p2] = await Promise.all([API.getForYou(1), API.getForYou(2)]);
                dramas = [...(p1?.list || []), ...(p2?.list || [])];
            } else {
                // Filter from cached data by tag
                const tagFilters = {
                    'romance': ['โรแมนติก', 'รักแรกพบ', 'แต่งก่อนค่อยรัก', 'พรหมลิขิต', 'คู่ชายหญิง'],
                    'ceo': ['ท่านประธาน', 'เจ้าพ่อใหญ่', 'มหาเศรษฐี'],
                    'fantasy': ['แฟนตาซี', 'เหนือธรรมชาติ', 'ระบบ', 'สลับวิญญาณ', 'เกิดใหม่'],
                    'period': ['พีเรียด', 'ข้ามเวลา', 'ราชวงศ์ชนชั้นสูง'],
                    'revenge': ['แก้แค้น', 'ตบหน้าเอาคืน', 'หักมุม']
                };
                dramas = this.state.allDramas.filter(d =>
                    d.tags?.some(t => (tagFilters[type] || []).includes(t))
                );
            }

            // Store dramas for loading more
            this.state.categoryDramas = dramas;
            this.state.currentCategoryType = type;
            this.state.categoryDisplayCount = 20;

            this.renderCategoryResults();
            Swal.close();

        } catch (error) {
            this.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    },

    renderCategoryResults() {
        const container = document.getElementById('categoryResults');
        const loadMoreBtn = document.getElementById('categoryLoadMore');
        const dramas = this.state.categoryDramas;
        const displayCount = this.state.categoryDisplayCount;

        if (!dramas || dramas.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-film"></i><h3>ไม่มีข้อมูล</h3></div>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        const toShow = dramas.slice(0, displayCount);
        container.innerHTML = toShow.map(drama => `
            <div class="drama-card" data-id="${drama.bookId}">
                <div class="drama-poster">
                    <img src="${drama.cover}" alt="${drama.bookName}" loading="lazy">
                    ${drama.corner ? `<span class="drama-badge" style="background:${drama.corner.color}">${drama.corner.name}</span>` : ''}
                </div>
                <div class="drama-info">
                    <h3 class="drama-title">${drama.bookName}</h3>
                    <div class="drama-meta">
                        <span><i class="fas fa-film"></i> ${drama.chapterCount || 0} ตอน</span>
                        <span><i class="fas fa-eye"></i> ${drama.playCount || '0'}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.drama-card').forEach(card => {
            card.addEventListener('click', () => this.showDetailPage(card.dataset.id));
        });

        // Show/hide load more button
        if (loadMoreBtn) {
            loadMoreBtn.style.display = displayCount < dramas.length ? 'flex' : 'none';
        }
    },

    loadMoreCategory() {
        this.state.categoryDisplayCount += 20;
        this.renderCategoryResults();
    },

    showPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`)?.classList.add('active');
        this.state.currentPage = page;
        window.scrollTo(0, 0);
    },

    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: message,
            confirmButtonText: 'ตกลง',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#e50914'
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
