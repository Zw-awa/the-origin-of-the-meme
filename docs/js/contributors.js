(function () {
    function avatarFallback(login) {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' rx='36' fill='%2314141b'/%3E%3Ctext x='36' y='42' text-anchor='middle' font-size='28' fill='%23fb7299' font-family='sans-serif'%3E${encodeURIComponent((login || '?').charAt(0).toUpperCase())}%3C/text%3E%3C/svg%3E`;
    }

    function buildPodiumCard(contributor, index) {
        var champion = index === 0 ? ' contributors-podium__card--champion' : '';
        return `
            <a class="contributors-podium__card${champion}" href="https://github.com/${encodeURIComponent(contributor.github)}" target="_blank" rel="noopener">
                <span class="contributors-podium__badge">No.${window.formatNumber(contributor.rank || (index + 1))}</span>
                <div class="contributors-podium__profile">
                    <img class="contributors-podium__avatar" src="https://github.com/${encodeURIComponent(contributor.github)}.png?size=256" alt="${window.escapeHtml(contributor.github)}" onerror="this.src='${avatarFallback(contributor.github)}'">
                    <div>
                        <h2 class="contributors-podium__name">${window.escapeHtml(contributor.github)}</h2>
                        <span class="tier-badge ${window.getContributorTierClass(contributor.title || '杂役弟子')}">${window.escapeHtml(typeof window.translateTierName === 'function' ? window.translateTierName(contributor.title || '杂役弟子', window.LANG || 'zh') : (contributor.title || '杂役弟子'))}</span>
                    </div>
                </div>
                <span class="contributors-podium__count">${window.formatNumber(contributor.count || 0)} ${window.t('common.contributions_unit')}</span>
            </a>
        `;
    }

    async function init() {
        var data = await window.loadData();
        var stats = data.stats || {};
        var contributors = [...(data.contributors || [])].sort(function (a, b) {
            return (a.rank || Infinity) - (b.rank || Infinity);
        });

        document.getElementById('contributors-total').textContent = window.formatNumber(stats.total_contributors || contributors.length || 0);
        document.getElementById('contributors-videos').textContent = window.formatNumber(stats.total_videos || 0);

        var podium = document.getElementById('contributors-podium-grid');
        var restSection = document.getElementById('contributors-rest-section');
        var restGrid = document.getElementById('contributors-rest-grid');
        if (!podium || !restSection || !restGrid) return;

        if (!contributors.length) {
            podium.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state__icon">01</div>
                    <h2 class="empty-state__title">${window.t('contributors_page.empty')}</h2>
                    <p class="empty-state__copy">${window.t('contributors_page.podiumCopy')}</p>
                </div>
            `;
            restSection.hidden = true;
            return;
        }

        podium.innerHTML = contributors.slice(0, 3).map(buildPodiumCard).join('');
        podium.querySelectorAll('.contributors-podium__card').forEach(function (card, index) {
            card.style.transitionDelay = (index * 45) + 'ms';
        });

        var rest = contributors.slice(3);
        if (!rest.length) {
            restSection.hidden = true;
            restGrid.innerHTML = '';
            return;
        }

        restSection.hidden = false;
        restGrid.innerHTML = rest.map(function (contributor) {
            return `
                <a class="contributors-rest__card" href="https://github.com/${encodeURIComponent(contributor.github)}" target="_blank" rel="noopener">
                    <img src="https://github.com/${encodeURIComponent(contributor.github)}.png?size=128" alt="${window.escapeHtml(contributor.github)}" onerror="this.src='${avatarFallback(contributor.github)}'">
                    <h3 class="contributors-rest__name">${window.escapeHtml(contributor.github)}</h3>
                    <span class="tier-badge ${window.getContributorTierClass(contributor.title || '杂役弟子')}">${window.escapeHtml(typeof window.translateTierName === 'function' ? window.translateTierName(contributor.title || '杂役弟子', window.LANG || 'zh') : (contributor.title || '杂役弟子'))}</span>
                    <span class="contributors-rest__count">${window.formatNumber(contributor.count || 0)} ${window.t('common.contributions_unit')}</span>
                </a>
            `;
        }).join('');
        restGrid.querySelectorAll('.contributors-rest__card').forEach(function (card, index) {
            card.style.transitionDelay = ((index % 8) * 26) + 'ms';
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
