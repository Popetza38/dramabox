/**
 * DramaPop Category Page JavaScript
 */

const CategoryPage = {
    state: {
        type: null,
        dramas: [],
        displayCount: 20
    },

    async init() {
        Common.init();
        this.state.type = Common.getUrlParam('type') || 'new';

        this.bindEvents();
        await this.loadCategory();
    },

    bindEvents() {
        document.getElementById('categoryBackBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('categoryLoadMore')?.addEventListener('click', () => {
            this.loadMore();
        });
    },

    async loadCategory() {
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

        document.getElementById('categoryTitle').textContent = titles[this.state.type] || 'หมวดหมู่';
        Common.showLoading('กำลังโหลด...');

        try {
            let dramas = [];

            if (this.state.type === 'new') {
                const [p1, p2, p3] = await Promise.all([API.getNew(1), API.getNew(2), API.getNew(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else if (this.state.type === 'ranking') {
                const [p1, p2, p3] = await Promise.all([API.getRanking(1), API.getRanking(2), API.getRanking(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else if (this.state.type === 'foryou') {
                const [p1, p2, p3] = await Promise.all([API.getForYou(1), API.getForYou(2), API.getForYou(3)]);
                dramas = [...(p1?.list || []), ...(p2?.list || []), ...(p3?.list || [])];
            } else {
                // Load all dramas for category filtering
                const [f1, f2, n1, n2, r1, r2] = await Promise.all([
                    API.getForYou(1), API.getForYou(2),
                    API.getNew(1), API.getNew(2),
                    API.getRanking(1), API.getRanking(2)
                ]);

                const allDramas = [
                    ...(f1?.list || []), ...(f2?.list || []),
                    ...(n1?.list || []), ...(n2?.list || []),
                    ...(r1?.list || []), ...(r2?.list || [])
                ];

                // Remove duplicates
                const seen = new Set();
                const unique = allDramas.filter(d => {
                    if (!d || seen.has(d.bookId)) return false;
                    seen.add(d.bookId);
                    return true;
                });

                // Filter by category
                const tagFilters = {
                    'romance': ['โรแมนติก', 'รัก', 'หวาน', 'แต่งงาน', 'คู่รัก'],
                    'ceo': ['ประธาน', 'CEO', 'เจ้าพ่อ', 'มหาเศรษฐี'],
                    'fantasy': ['แฟนตาซี', 'เหนือธรรมชาติ', 'วิญญาณ', 'เกิดใหม่'],
                    'period': ['พีเรียด', 'ย้อนยุค', 'ข้ามเวลา', 'ราชวงศ์'],
                    'revenge': ['แก้แค้น', 'ล้างแค้น', 'ตบหน้า', 'หักหลัง']
                };

                const keywords = tagFilters[this.state.type] || [];
                dramas = unique.filter(d => {
                    const tags = d.tags || [];
                    const name = (d.bookName || '').toLowerCase();
                    return keywords.some(kw => {
                        const k = kw.toLowerCase();
                        return tags.some(t => t && t.toLowerCase().includes(k)) || name.includes(k);
                    });
                });
            }

            this.state.dramas = dramas;
            this.renderResults();
            Common.closeLoading();

        } catch (error) {
            console.error('Category error:', error);
            Common.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    },

    renderResults() {
        const container = document.getElementById('categoryResults');
        const loadMoreBtn = document.getElementById('categoryLoadMore');
        const toShow = this.state.dramas.slice(0, this.state.displayCount);

        if (!toShow || toShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>ไม่มีข้อมูล</h3>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        container.innerHTML = toShow.map(d => Common.renderDramaCard(d)).join('');
        Common.bindDramaCardEvents(container);

        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.state.displayCount < this.state.dramas.length ? 'block' : 'none';
        }
    },

    loadMore() {
        this.state.displayCount += 20;
        this.renderResults();
    }
};

document.addEventListener('DOMContentLoaded', () => CategoryPage.init());
