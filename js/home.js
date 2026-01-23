/**
 * DramaPop Home Page JavaScript
 */

const HomePage = {
    state: {
        allDramas: [],
        sliderStates: {}
    },

    async init() {
        Common.init();
        await this.loadContent();
    },

    async loadContent() {
        try {
            Common.showLoading('กำลังโหลดข้อมูล...');

            const results = await Promise.allSettled([
                API.getForYou(1), API.getForYou(2), API.getForYou(3), API.getForYou(4), API.getForYou(5),
                API.getNew(1), API.getNew(2), API.getNew(3), API.getNew(4), API.getNew(5),
                API.getRanking(1), API.getRanking(2), API.getRanking(3), API.getRanking(4), API.getRanking(5)
            ]);

            const getData = (result) => result.status === 'fulfilled' ? result.value : null;

            const forYouList = [
                ...(getData(results[0])?.list || []),
                ...(getData(results[1])?.list || []),
                ...(getData(results[2])?.list || []),
                ...(getData(results[3])?.list || []),
                ...(getData(results[4])?.list || [])
            ];

            const newList = [
                ...(getData(results[5])?.list || []),
                ...(getData(results[6])?.list || []),
                ...(getData(results[7])?.list || []),
                ...(getData(results[8])?.list || []),
                ...(getData(results[9])?.list || [])
            ];

            const rankingList = [
                ...(getData(results[10])?.list || []),
                ...(getData(results[11])?.list || []),
                ...(getData(results[12])?.list || []),
                ...(getData(results[13])?.list || []),
                ...(getData(results[14])?.list || [])
            ];

            // Remove duplicates
            const uniqueDramas = [];
            const seenIds = new Set();
            [...forYouList, ...newList, ...rankingList].forEach(d => {
                if (d && d.bookId && !seenIds.has(d.bookId)) {
                    seenIds.add(d.bookId);
                    uniqueDramas.push(d);
                }
            });
            this.state.allDramas = uniqueDramas;

            // Render main sections
            this.renderDramaGrid('forYouGrid', forYouList.slice(0, 30));
            this.renderDramaGrid('newDramasGrid', newList.slice(0, 30));
            this.renderDramaGrid('rankingGrid', rankingList.slice(0, 30));
            this.renderDramaGrid('classifyGrid', rankingList.slice(0, 20));

            // Category filtering
            const matchesCategory = (drama, keywords) => {
                if (!drama) return false;
                const tags = drama.tags || [];
                const name = (drama.bookName || '').toLowerCase();
                const intro = (drama.introduction || '').toLowerCase();
                return keywords.some(kw => {
                    const keyword = kw.toLowerCase();
                    if (tags.some(t => t && t.toLowerCase().includes(keyword))) return true;
                    if (name.includes(keyword)) return true;
                    if (intro.includes(keyword)) return true;
                    return false;
                });
            };

            const romanceKeywords = ['โรแมนติก', 'รัก', 'หวาน', 'แต่งงาน', 'คู่รัก', 'พรหมลิขิต', 'หัวใจ', 'รักแรก', 'จีบ', 'แฟน', 'ความรัก', 'romance', 'love'];
            const ceoKeywords = ['ประธาน', 'CEO', 'เจ้าพ่อ', 'มหาเศรษฐี', 'ตระกูล', 'รวย', 'บริษัท', 'เศรษฐี', 'ผู้บริหาร', 'boss', 'rich'];
            const fantasyKeywords = ['แฟนตาซี', 'เหนือธรรมชาติ', 'วิญญาณ', 'เกิดใหม่', 'ระบบ', 'พลัง', 'เวทมนตร์', 'fantasy', 'ปีศาจ', 'นรก', 'สวรรค์', 'อมตะ'];
            const periodKeywords = ['พีเรียด', 'ย้อนยุค', 'ข้ามเวลา', 'ราชวงศ์', 'โบราณ', 'ฮองเฮา', 'จักรพรรดิ', 'องค์ชาย', 'องค์หญิง', 'วังหลวง', 'period', 'historical'];
            const revengeKeywords = ['แก้แค้น', 'ล้างแค้น', 'ตบหน้า', 'หักหลัง', 'ทวงคืน', 'revenge', 'ปกป้อง', 'สู้', 'แก้เผ็ด', 'หักมุม'];

            const romance = uniqueDramas.filter(d => matchesCategory(d, romanceKeywords));
            const ceo = uniqueDramas.filter(d => matchesCategory(d, ceoKeywords));
            const fantasy = uniqueDramas.filter(d => matchesCategory(d, fantasyKeywords));
            const period = uniqueDramas.filter(d => matchesCategory(d, periodKeywords));
            const revenge = uniqueDramas.filter(d => matchesCategory(d, revengeKeywords));

            this.renderDramaGrid('romanceGrid', romance.slice(0, 30));
            this.renderDramaGrid('ceoGrid', ceo.slice(0, 30));
            this.renderDramaGrid('fantasyGrid', fantasy.slice(0, 30));
            this.renderDramaGrid('periodGrid', period.slice(0, 30));
            this.renderDramaGrid('revengeGrid', revenge.slice(0, 30));

            // Set hero background
            if (forYouList[0]?.cover) {
                document.getElementById('heroSlider').style.backgroundImage = `url(${forYouList[0].cover})`;
            }

            // Initialize sliders
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

            Common.closeLoading();
        } catch (error) {
            console.error('Load error:', error);
            Common.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    },

    renderDramaGrid(containerId, dramas) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!dramas || dramas.length === 0) {
            container.innerHTML = '<p style="color:#808080; padding:20px;">ไม่มีข้อมูล</p>';
            return;
        }

        container.innerHTML = dramas.map(d => Common.renderDramaCard(d)).join('');
        Common.bindDramaCardEvents(container);
    },

    initSlider(sliderName, gridId, totalItems) {
        const sliderContainer = document.querySelector(`[data-slider="${sliderName}"]`);
        const grid = document.getElementById(gridId);
        const pagination = document.querySelector(`[data-for="${sliderName}"]`);

        if (!sliderContainer || !grid) return;

        const prevBtn = sliderContainer.querySelector('.slider-nav.prev');
        const nextBtn = sliderContainer.querySelector('.slider-nav.next');

        if (!prevBtn || !nextBtn) return;

        this.state.sliderStates[sliderName] = {
            currentIndex: 0,
            itemsPerView: 6,
            autoScrollInterval: null
        };

        const state = this.state.sliderStates[sliderName];

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

        const scrollTo = (index) => {
            const cards = grid.querySelectorAll('.drama-card');
            if (cards.length === 0) return;

            const cardWidth = cards[0].offsetWidth + 10;
            const scrollPosition = index * state.itemsPerView * cardWidth;
            grid.scrollTo({ left: scrollPosition, behavior: 'smooth' });

            state.currentIndex = index;

            if (pagination) {
                pagination.querySelectorAll('.slider-dot').forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
            }

            prevBtn.disabled = index === 0;
            nextBtn.disabled = index >= totalPages - 1;
        };

        prevBtn.addEventListener('click', () => {
            if (state.currentIndex > 0) scrollTo(state.currentIndex - 1);
        });

        nextBtn.addEventListener('click', () => {
            if (state.currentIndex < totalPages - 1) scrollTo(state.currentIndex + 1);
        });

        if (sliderName === 'forYou') {
            const startAutoScroll = () => {
                state.autoScrollInterval = setInterval(() => {
                    let nextIndex = state.currentIndex + 1;
                    if (nextIndex >= totalPages) nextIndex = 0;
                    scrollTo(nextIndex);
                }, 5000);
            };

            const stopAutoScroll = () => {
                if (state.autoScrollInterval) clearInterval(state.autoScrollInterval);
            };

            sliderContainer.addEventListener('mouseenter', stopAutoScroll);
            sliderContainer.addEventListener('mouseleave', startAutoScroll);
            startAutoScroll();
        }

        prevBtn.disabled = true;
        nextBtn.disabled = totalPages <= 1;
    },

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

        window.addEventListener('resize', () => {
            Object.keys(this.state.sliderStates).forEach(name => {
                const state = this.state.sliderStates[name];
                const width = window.innerWidth;
                if (width <= 480) state.itemsPerView = 3;
                else if (width <= 768) state.itemsPerView = 4;
                else if (width <= 1024) state.itemsPerView = 5;
                else state.itemsPerView = 6;
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => HomePage.init());
