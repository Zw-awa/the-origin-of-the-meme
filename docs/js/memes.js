(function () {
    var PAGE_SIZE = 24;
    var state = {
        allMemes: [],
        filteredMemes: [],
        query: '',
        tier: 'all',
        tag: new URLSearchParams(window.location.search).get('tag') || '',
        sort: 'rank',
        page: 1
    };

    function syncFilterTelemetry() {
        var root = document.querySelector('.memes-toolbar');
        var hero = document.querySelector('.memes-hero');
        if (!root && !hero) return;

        var ratio = state.allMemes.length
            ? (state.filteredMemes.length / state.allMemes.length)
            : 0;

        if (root) {
            root.style.setProperty('--filter-ratio', ratio.toFixed(4));
            root.dataset.filterState = state.query || state.tag || state.tier !== 'all' || state.sort !== 'rank'
                ? 'active'
                : 'idle';
        }

        if (hero) {
            hero.style.setProperty('--filter-ratio', ratio.toFixed(4));
        }
    }

    function debounce(fn, wait) {
        var timer = null;
        return function () {
            var args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () { fn.apply(null, args); }, wait);
        };
    }

    function mergeData(summary, full) {
        var summaryMap = new Map((summary.memes || []).map(function (m) { return [m.id, m]; }));
        var fullMap = new Map((full.memes || []).map(function (m) { return [m.id, m]; }));
        var ids = new Set([].concat(summary.memes || [], full.memes || []).map(function (m) { return m.id; }));

        return Array.from(ids).map(function (id) {
            var base = fullMap.get(id) || {};
            var rank = summaryMap.get(id) || {};
            return Object.assign({}, base, rank, {
                id: id,
                aliases: base.aliases || [],
                description: base.description || '',
                tags: base.tags || [],
                videos: base.videos || [],
                submissions: rank.submissions != null ? rank.submissions : (base.submissions || (base.videos || []).length || 0),
                tier: rank.tier || base.tier || '杂役弟子',
                rank: rank.rank != null ? rank.rank : base.rank
            });
        });
    }

    function renderTierChips() {
        var container = document.getElementById('memes-tier-chips');
        if (!container) return;

        var tiers = ['all'].concat(window.MEME_TIER_NAMES || []);
        container.innerHTML = tiers.map(function (tier) {
            var label = tier === 'all' ? window.t('common.all') : tier;
            var active = state.tier === tier ? ' is-active' : '';
            return '<button class="pill' + active + '" data-tier="' + window.escapeHtml(tier) + '" type="button">' + window.escapeHtml(label) + '</button>';
        }).join('');

        container.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.tier = btn.getAttribute('data-tier') || 'all';
                state.page = 1;
                render();
            });
        });
    }

    function renderSortControls() {
        var container = document.getElementById('memes-sort-controls');
        if (!container) return;

        var sorts = [
            { key: 'rank', label: window.t('common.sortRank') },
            { key: 'submissions', label: window.t('common.sortSubmissions') },
            { key: 'alpha', label: window.t('common.sortAlpha') }
        ];

        container.innerHTML = sorts.map(function (sort) {
            var active = state.sort === sort.key ? ' is-active' : '';
            return '<button class="pill' + active + '" data-sort="' + sort.key + '" type="button">' + sort.label + '</button>';
        }).join('');

        container.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                state.sort = btn.getAttribute('data-sort') || 'rank';
                state.page = 1;
                render();
            });
        });
    }

    function renderTagControls() {
        var container = document.getElementById('memes-tag-controls');
        if (!container) return;

        var counts = new Map();
        state.allMemes.forEach(function (meme) {
            (meme.tags || []).forEach(function (tag) {
                counts.set(tag, (counts.get(tag) || 0) + 1);
            });
        });

        var tags = Array.from(counts.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 12);

        container.innerHTML = tags.map(function (entry) {
            var active = state.tag === entry[0] ? ' is-active' : '';
            return '<button class="pill' + active + '" data-tag="' + window.escapeHtml(entry[0]) + '" type="button"># ' + window.escapeHtml(entry[0]) + '</button>';
        }).join('');

        container.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var nextTag = btn.getAttribute('data-tag') || '';
                state.tag = state.tag === nextTag ? '' : nextTag;
                state.page = 1;
                render();
            });
        });
    }

    function applyFilters() {
        var query = state.query.trim().toLowerCase();
        var result = state.allMemes.filter(function (meme) {
            if (state.tier !== 'all' && meme.tier !== state.tier) return false;
            if (state.tag && !(meme.tags || []).includes(state.tag)) return false;
            if (!query) return true;

            var haystack = [
                meme.id || '',
                (meme.aliases || []).join(' '),
                meme.description || '',
                (meme.tags || []).join(' ')
            ].join(' ').toLowerCase();

            return haystack.indexOf(query) !== -1;
        });

        result.sort(function (a, b) {
            if (state.sort === 'submissions') {
                return (b.submissions || 0) - (a.submissions || 0);
            }
            if (state.sort === 'alpha') {
                return String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN');
            }
            return (a.rank || Infinity) - (b.rank || Infinity);
        });

        state.filteredMemes = result;
    }

    function renderGrid() {
        var grid = document.getElementById('memes-grid');
        var empty = document.getElementById('memes-empty-state');
        if (!grid || !empty) return;

        applyFilters();
        syncFilterTelemetry();

        document.getElementById('memes-total-count').textContent = window.formatNumber(state.allMemes.length);
        document.getElementById('memes-results-count').textContent = window.formatNumber(state.filteredMemes.length);

        if (!state.filteredMemes.length) {
            grid.innerHTML = '';
            empty.hidden = false;
            return;
        }

        empty.hidden = true;
        var start = (state.page - 1) * PAGE_SIZE;
        var items = state.filteredMemes.slice(start, start + PAGE_SIZE);

        grid.innerHTML = items.map(function (meme) {
            var aliasText = (meme.aliases || []).slice(0, 3).join(' · ');
            var tags = (meme.tags || []).slice(0, 4).map(function (tag) {
                return '<span class="meme-card__tag">' + window.escapeHtml(tag) + '</span>';
            }).join('');
            var rankLabel = meme.rank != null ? '#'+ window.formatNumber(meme.rank) : '';
            return (
                '<a class="meme-card" href="meme.html?id=' + encodeURIComponent(meme.id) + '">' +
                    '<div class="meme-card__header">' +
                        window.buildTierBadge(meme.tier || '杂役弟子') +
                        '<span class="meme-card__rank">' + rankLabel + '</span>' +
                    '</div>' +
                    '<div class="meme-card__body">' +
                        '<h2 class="meme-card__name">' + window.escapeHtml(meme.id) + '</h2>' +
                        (aliasText ? '<p class="meme-card__aliases">' + window.t('common.aliasesPrefix') + window.escapeHtml(aliasText) + '</p>' : '') +
                        (meme.description ? '<p class="meme-card__description">' + window.escapeHtml(meme.description) + '</p>' : '') +
                    '</div>' +
                    '<div class="meme-card__footer">' +
                        '<div class="meme-card__tags">' + tags + '</div>' +
                        '<span class="meme-card__count">' + window.formatNumber(meme.submissions || 0) + ' ' + window.t('common.submissions_unit') + '</span>' +
                    '</div>' +
                '</a>'
            );
        }).join('');

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-ready');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15 });

        grid.querySelectorAll('.meme-card').forEach(function (card, index) {
            card.style.transitionDelay = (index % 8) * 28 + 'ms';
            observer.observe(card);
        });
    }

    function renderPagination() {
        var container = document.getElementById('memes-pagination');
        if (!container) return;

        var totalPages = Math.max(1, Math.ceil(state.filteredMemes.length / PAGE_SIZE));
        if (totalPages <= 1) {
            container.hidden = true;
            container.innerHTML = '';
            state.page = 1;
            return;
        }

        state.page = Math.min(state.page, totalPages);
        container.hidden = false;

        var html = '<button class="memes-pagination__btn" data-page="' + (state.page - 1) + '" ' + (state.page === 1 ? 'disabled' : '') + '>' + window.t('common.prev') + '</button>';
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="memes-pagination__btn' + (i === state.page ? ' is-active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        html += '<button class="memes-pagination__btn" data-page="' + (state.page + 1) + '" ' + (state.page === totalPages ? 'disabled' : '') + '>' + window.t('common.next') + '</button>';
        container.innerHTML = html;

        container.querySelectorAll('button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var next = Number(btn.getAttribute('data-page'));
                if (!next || next < 1 || next > totalPages) return;
                state.page = next;
                renderGrid();
                renderPagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    function render() {
        renderTierChips();
        renderSortControls();
        renderTagControls();
        renderGrid();
        renderPagination();
    }

    async function init() {
        var clearBtn = document.getElementById('memes-clear-filters');
        var input = document.getElementById('memes-search-input');
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                state.query = '';
                state.tier = 'all';
                state.tag = '';
                state.sort = 'rank';
                state.page = 1;
                if (input) input.value = '';
                render();
            });
        }

        if (input) {
            input.addEventListener('input', debounce(function (event) {
                state.query = event.target.value || '';
                state.page = 1;
                render();
            }, 200));
        }

        var data = await window.loadData();
        var full = await window.loadFullData();
        state.allMemes = mergeData(data, full);
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
