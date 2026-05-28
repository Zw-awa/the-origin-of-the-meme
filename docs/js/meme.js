(function () {
    var TIER_RANGES = {
        '杂役弟子': '0-2 视频',
        '练气期': '3-5 视频',
        '筑基期': '6-10 视频',
        '金丹期': '11-20 视频',
        '元婴期': '21-35 视频',
        '化神期': '36-50 视频',
        '练虚期': '51-75 视频',
        '合体期': '76-100 视频',
        '大乘期': '101-149 视频',
        '渡劫飞升': '150+ 视频'
    };

    function getIdFromUrl() {
        var raw = new URLSearchParams(window.location.search).get('id');
        return raw ? raw.trim() : '';
    }

    function buildBiliUrl(origin) {
        if (!origin) return '';
        if (/^https?:\/\//i.test(origin)) return origin;
        if (/^BV/i.test(origin)) return 'https://www.bilibili.com/video/' + origin;
        return '';
    }

    function renderNotFound(message) {
        var root = document.getElementById('meme-root');
        if (!root) return;

        root.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">404</div>
                <h1 class="empty-state__title">${window.escapeHtml(message)}</h1>
                <p class="empty-state__copy">${window.t('meme_page.notFoundCopy')}</p>
                <a href="memes.html" class="btn">${window.t('meme_page.browseAll')}</a>
            </div>
        `;
    }

    function relatedMemes(current, all) {
        return all
            .filter(function (meme) { return meme.id !== current.id; })
            .map(function (meme) {
                var score = (meme.tags || []).filter(function (tag) {
                    return (current.tags || []).includes(tag);
                }).length;
                return Object.assign({ score: score }, meme);
            })
            .filter(function (meme) { return meme.score > 0; })
            .sort(function (a, b) { return b.score - a.score || (a.rank || Infinity) - (b.rank || Infinity); })
            .slice(0, 5);
    }

    function renderMeme(meme, allMemes) {
        var root = document.getElementById('meme-root');
        if (!root) return;

        var aliases = (meme.aliases || []).length ? `
            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner">
                        <span class="section-head__eyebrow">${window.t('meme_page.aliases')}</span>
                        <div class="meme-aliases">
                            ${(meme.aliases || []).map(function (alias) { return '<span class="pill">' + window.escapeHtml(alias) + '</span>'; }).join('')}
                        </div>
                    </div>
                </div>
            </section>
        ` : '';

        var paragraphs = (meme.description || '').split(/\n{2,}/).filter(Boolean);
        var descriptionHtml = paragraphs.length
            ? paragraphs.map(function (para) { return '<p>' + window.escapeHtml(para) + '</p>'; }).join('')
            : '<p>' + window.t('meme_page.noDesc') + '</p>';

        var originUrl = buildBiliUrl(meme.origin_video || '');
        var originBlock = originUrl ? `
            <a class="meme-origin-link link-arrow" href="${originUrl}" target="_blank" rel="noopener">
                ${window.t('meme_page.originVideo')}
            </a>
        ` : '';

        var videos = (meme.videos || []).length ? `
            <div class="meme-videos">
                ${(meme.videos || []).map(function (video) {
                    var bvid = video.bvid || '';
                    var url = bvid ? 'https://www.bilibili.com/video/' + bvid : '#';
                    return `
                        <a class="meme-video-card" href="${url}" target="_blank" rel="noopener">
                            <strong class="meme-video-card__title">${window.escapeHtml(video.title || window.t('common.noTitle'))}</strong>
                            <div class="meme-video-card__meta">
                                <span class="meme-video-card__bvid">${window.escapeHtml(bvid || 'BV?')}</span>
                                <span>${window.t('meme_page.upMaster')}：${window.escapeHtml(video.author || window.t('common.unknown'))}</span>
                                <span>${window.t('meme_page.contributorLabel')}：@${window.escapeHtml(video.contributor || window.t('common.unknown'))}</span>
                            </div>
                        </a>
                    `;
                }).join('')}
            </div>
        ` : `
            <div class="empty-state">
                <div class="empty-state__icon">BV</div>
                <h3 class="empty-state__title">${window.t('meme_page.noVideos')}</h3>
                <p class="empty-state__copy">${window.t('meme_page.noVideosCopy')}</p>
            </div>
        `;

        var tags = (meme.tags || []).length ? `
            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner">
                        <span class="section-head__eyebrow">${window.t('meme_page.tags')}</span>
                        <div class="meme-tags">
                            ${(meme.tags || []).map(function (tag) { return '<a class="pill" href="memes.html?tag=' + encodeURIComponent(tag) + '"># ' + window.escapeHtml(tag) + '</a>'; }).join('')}
                        </div>
                    </div>
                </div>
            </section>
        ` : '';

        var related = relatedMemes(meme, allMemes);
        var relatedBlock = related.length ? `
            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner">
                        <span class="section-head__eyebrow">${window.t('meme_page.relatedEyebrow')}</span>
                        <h2 class="section-head__title">${window.t('meme_page.relatedTitle')}</h2>
                        <div class="meme-related__grid">
                            ${related.map(function (item) {
                                return `
                                    <a class="meme-related-card" href="meme.html?id=${encodeURIComponent(item.id)}">
                                        <h3 class="meme-related-card__name">${window.escapeHtml(item.id)}</h3>
                                        <div class="meme-related-card__meta">
                                            ${window.buildTierBadge(item.tier || '杂役弟子')}
                                            <span class="meme-video-card__bvid">${window.formatNumber(item.submissions || 0)} ${window.t('common.submissions_unit')}</span>
                                        </div>
                                    </a>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </section>
        ` : '';

        root.innerHTML = `
            <a href="memes.html" class="meme-back">${window.t('meme_page.back')}</a>

            <section class="meme-hero">
                <div class="meme-hero__main">
                    <h1 class="meme-hero__name">${window.escapeHtml(meme.id)}</h1>
                    <div class="meme-hero__meta">
                        ${window.buildTierBadge(meme.tier || '杂役弟子', true)}
                        <span class="meme-hero__meta-chip">${window.formatNumber(meme.submissions || 0)} ${window.t('common.submissions_unit')}</span>
                        <span class="meme-hero__meta-chip">#${window.formatNumber(meme.rank || 1)}</span>
                    </div>
                    ${meme.origin_date ? '<p class="meme-hero__origin">' + window.t('meme_page.firstSeen') + ' · ' + window.escapeHtml(meme.origin_date) + '</p>' : ''}
                </div>
                <aside class="meme-hero__tier-card">
                    <div class="meme-tier-card__inner">
                        <span class="meme-tier-card__eyebrow">${window.t('meme_page.tierCard')}</span>
                        <strong class="meme-tier-card__name">${window.escapeHtml(typeof window.translateTierName === 'function' ? window.translateTierName(meme.tier || '杂役弟子', window.LANG || 'zh') : (meme.tier || '杂役弟子'))}</strong>
                        <span class="meme-tier-card__range">${window.escapeHtml(TIER_RANGES[meme.tier] || window.t('meme_page.originMissing'))}</span>
                        <p class="meme-tier-card__copy">${window.t('meme_page.tierCardCopy')}</p>
                    </div>
                </aside>
            </section>

            ${aliases}

            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner">
                        <span class="section-head__eyebrow">${window.t('meme_page.description')}</span>
                        <div class="meme-description">${descriptionHtml}</div>
                        ${originBlock}
                    </div>
                </div>
            </section>

            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner">
                        <span class="section-head__eyebrow">${window.t('meme_page.videos')}</span>
                        ${videos}
                    </div>
                </div>
            </section>

            ${tags}
            ${relatedBlock}

            <section class="meme-detail-section">
                <div class="panel">
                    <div class="panel__inner meme-cta">
                        <span class="section-head__eyebrow">${window.t('nav.contribute')}</span>
                        <a class="btn btn--solid" href="https://github.com/Zw-awa/the-origin-of-the-meme/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">${window.t('meme_page.contribute')}</a>
                        <p class="meme-cta__copy">${window.t('meme_page.ctaCopy')}</p>
                    </div>
                </div>
            </section>
        `;

        document.title = meme.id + ' | ' + window.t('pageTitle.meme');

        root.querySelectorAll('.meme-video-card, .meme-related-card, .meme-detail-section .panel').forEach(function (node, index) {
            node.style.transitionDelay = ((index % 6) * 36) + 'ms';
        });
    }

    async function init() {
        var id = getIdFromUrl();
        if (!id) {
            renderNotFound(window.t('meme_page.noId'));
            return;
        }

        var data = await window.loadFullData();
        var allMemes = data.memes || [];
        var meme = allMemes.find(function (item) { return item.id === id; });

        if (!meme) {
            renderNotFound(window.t('meme_page.notFound'));
            return;
        }

        renderMeme(meme, allMemes);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
