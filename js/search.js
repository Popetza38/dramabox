/**
 * DramaPop Search Page JavaScript
 */

const SearchPage = {
    state: {
        currentPage: 1,
        query: '',
        hasMore: true
    },

    async init() {
        Common.init();
        this.state.query = Common.getUrlParam('q') || '';

        if (this.state.query) {
            document.getElementById('searchQuery').textContent = this.state.query;
            await this.performSearch();
        }

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('searchBackBtn')?.addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('searchLoadMore')?.addEventListener('click', () => {
            this.loadMore();
        });
    },

    async performSearch() {
        Common.showLoading('กำลังค้นหา...');

        try {
            const [results1, results2] = await Promise.all([
                API.search(this.state.query, 1),
                API.search(this.state.query, 2)
            ]);

            const allResults = [...(results1?.list || []), ...(results2?.list || [])];
            this.renderResults(allResults);

            Common.closeLoading();
        } catch (error) {
            console.error('Search error:', error);
            Common.showError('ไม่สามารถค้นหาได้');
        }
    },

    renderResults(dramas) {
        const container = document.getElementById('searchResults');
        const loadMoreBtn = document.getElementById('searchLoadMore');

        if (!dramas || dramas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>ไม่พบผลลัพธ์</h3>
                    <p>ลองค้นหาด้วยคำอื่น</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        container.innerHTML = dramas.map(d => Common.renderDramaCard(d)).join('');
        Common.bindDramaCardEvents(container);

        if (loadMoreBtn) {
            loadMoreBtn.style.display = dramas.length >= 20 ? 'flex' : 'none';
        }
    },

    async loadMore() {
        this.state.currentPage += 2;
        Common.showLoading('กำลังโหลดเพิ่มเติม...');

        try {
            const results = await API.search(this.state.query, this.state.currentPage);
            const dramas = results?.list || [];

            if (dramas.length > 0) {
                const container = document.getElementById('searchResults');
                const html = dramas.map(d => Common.renderDramaCard(d)).join('');
                container.insertAdjacentHTML('beforeend', html);
                Common.bindDramaCardEvents(container);
            }

            if (dramas.length < 10) {
                document.getElementById('searchLoadMore').style.display = 'none';
            }

            Common.closeLoading();
        } catch (error) {
            Common.showError('ไม่สามารถโหลดเพิ่มเติมได้');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => SearchPage.init());
