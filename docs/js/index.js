import * as THREE from '../hall-assets/vendor/three.module.min.js';

const DANMAKU_BACK = [
    '前方高能', '这个真是太经典了', '2333333', '奶龙！', 'dbq8', '梦回初一',
    '你这瓜保熟吗', '草（一种植物）', '冲！', '笑死我了', '泪目', '爷青回',
    '谢谢你啊王师傅', '哈人', '这是要出梗了', '双厨狂喜', '好家伙', '典中典',
    '我就是说', '这剧情我熟'
];

const DANMAKU_FRONT = [
    '万恶之源！', '警察叔叔就是这个人', '梗从何来', '有内味了', '啊对对对',
    'Σ(っ °Д °;)っ', '我悟了', '摇头', '瑟瑟发抖', '冲冲冲', '速速流下时代的眼泪',
    '前一万看到了什么', '6', '这B站是懂经典的', 'op也有梗', '正在疯狂码字',
    '这不就是那谁', '这也能成梗', '确实', '笑不活了'
];

const TIER_DATA = [
    { n: '00', name: '杂役弟子', range: '0-2 视频' },
    { n: '01', name: '练气期', range: '3-5 视频' },
    { n: '02', name: '筑基期', range: '6-10 视频' },
    { n: '03', name: '金丹期', range: '11-20 视频' },
    { n: '04', name: '元婴期', range: '21-35 视频' },
    { n: '05', name: '化神期', range: '36-50 视频' },
    { n: '06', name: '练虚期', range: '51-75 视频' },
    { n: '07', name: '合体期', range: '76-100 视频' },
    { n: '08', name: '大乘期', range: '101-149 视频' },
    { n: '09', name: '渡劫飞升', range: '150+ 视频' }
];

function translatedTierRange(name, fallback) {
    const lang = window.LANG || 'zh';
    const ranges = {
        en: {
            '杂役弟子': '0-2 videos',
            '练气期': '3-5 videos',
            '筑基期': '6-10 videos',
            '金丹期': '11-20 videos',
            '元婴期': '21-35 videos',
            '化神期': '36-50 videos',
            '练虚期': '51-75 videos',
            '合体期': '76-100 videos',
            '大乘期': '101-149 videos',
            '渡劫飞升': '150+ videos'
        },
        ja: {
            '杂役弟子': '0-2 動画',
            '练气期': '3-5 動画',
            '筑基期': '6-10 動画',
            '金丹期': '11-20 動画',
            '元婴期': '21-35 動画',
            '化神期': '36-50 動画',
            '练虚期': '51-75 動画',
            '合体期': '76-100 動画',
            '大乘期': '101-149 動画',
            '渡劫飞升': '150+ 動画'
        }
    };
    return (ranges[lang] && ranges[lang][name]) || fallback;
}

function tt(key, fallback) {
    if (typeof window.t === 'function') {
        var val = window.t(key);
        if (val && val !== key) return val;
    }
    return fallback;
}

function initDanmakuLayer(id, items, baseDuration, minTop, maxTop) {
    const layer = document.getElementById(id);
    if (!layer) return;

    layer.innerHTML = '';
    items.forEach((text, index) => {
        const item = document.createElement('span');
        const top = minTop + ((maxTop - minTop) / items.length) * index;
        item.textContent = text;
        item.style.top = `${top.toFixed(2)}%`;
        item.style.setProperty('--duration', `${baseDuration + (index % 5) * 2}s`);
        item.style.setProperty('--delay', `${-index * 1.4}s`);
        layer.appendChild(item);
    });
}

function initHeroFade() {
    const hero = document.getElementById('home-hero');
    if (!hero) return;

    function onScroll() {
        const rect = hero.getBoundingClientRect();
        const heroHeight = Math.max(hero.offsetHeight, 1);
        const progress = Math.min(Math.max(-rect.top / (heroHeight * 0.8), 0), 1);
        hero.style.opacity = String(1 - progress * 0.85);
        hero.style.transform = `translateY(${progress * 24}px)`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

function animateStat(el, value) {
    if (!el) return;
    const target = Number(value) || 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
        el.textContent = window.formatNumber(target);
        return;
    }

    const duration = 1200;
    const start = performance.now();

    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = window.formatNumber(Math.round(target * eased));
        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = window.formatNumber(target);
        }
    }

    requestAnimationFrame(tick);
}

function initStats(stats) {
    animateStat(document.getElementById('stat-total-memes'), stats.total_memes || 0);
    animateStat(document.getElementById('stat-total-contributors'), stats.total_contributors || 0);
    animateStat(document.getElementById('stat-total-videos'), stats.total_videos || 0);
}

function renderRankings(memes) {
    const list = document.getElementById('home-ranking-list');
    if (!list) return;

    const top = [...(memes || [])]
        .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity))
        .slice(0, 5);

    if (!top.length) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">00</div>
                <h3 class="empty-state__title">${window.t('rankings.empty')}</h3>
                <p class="empty-state__copy">${tt('home_rankings.emptyCopy', '榜单目前还是空白，但它的视觉结构和排名规则已经先立起来了。')}</p>
            </div>
        `;
        return;
    }

    let html = '';
    top.forEach((meme, index) => {
        html += `
            <a class="home-ranking-row" href="meme.html?id=${encodeURIComponent(meme.id)}">
                <div class="home-ranking-row__rank">#${index + 1}</div>
                <div>
                    <div class="home-ranking-row__name">${window.escapeHtml(meme.id)}</div>
                </div>
                <div class="home-ranking-row__meta">
                    ${window.buildTierBadge(meme.tier || '杂役弟子')}
                    <span class="home-ranking-row__count">${window.formatNumber(meme.submissions || 0)} ${window.t('common.submissions_unit')}</span>
                </div>
            </a>
        `;
    });

    const placeholders = Math.max(0, 3 - top.length);
    for (let i = 0; i < placeholders; i++) {
        html += `
            <div class="home-ranking-row home-ranking-row--placeholder">
                <div class="home-ranking-row__rank">--</div>
                <div>
                    <div class="home-ranking-row__name">等待更多梗上榜</div>
                </div>
                <div class="home-ranking-row__meta">
                    <span class="home-ranking-row__count">${tt('common.realDataOnly', 'Real data only')}</span>
                </div>
            </div>
        `;
    }

    list.innerHTML = html;
}

function avatarFallback(login) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'%3E%3Crect width='72' height='72' rx='36' fill='%2314141b'/%3E%3Ctext x='36' y='42' text-anchor='middle' font-size='28' fill='%23fb7299' font-family='sans-serif'%3E${encodeURIComponent((login || '?').charAt(0).toUpperCase())}%3C/text%3E%3C/svg%3E`;
}

function renderContributors(contributors) {
    const grid = document.getElementById('home-contributors-grid');
    if (!grid) return;

    const top = [...(contributors || [])]
        .sort((a, b) => (a.rank || Infinity) - (b.rank || Infinity))
        .slice(0, 3);

    if (!top.length) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state__icon">01</div>
                <h3 class="empty-state__title">${window.t('contributors_section.empty')}</h3>
                <p class="empty-state__copy">${tt('contributors_section.emptyCopy', '这一段必须在贡献者稀少时也成立，所以先保留墙面与召唤感。')}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = top.map((contributor) => `
        <a class="home-contributor-card" href="https://github.com/${encodeURIComponent(contributor.github)}" target="_blank" rel="noopener">
            <span class="home-contributor-card__rank">No.${window.formatNumber(contributor.rank || 1)}</span>
            <div class="home-contributor-card__body">
                <img src="https://github.com/${encodeURIComponent(contributor.github)}.png?size=160" alt="${window.escapeHtml(contributor.github)}" onerror="this.src='${avatarFallback(contributor.github)}'">
                <div>
                    <strong>${window.escapeHtml(contributor.github)}</strong>
                    <span class="tier-badge ${window.getContributorTierClass(contributor.title || '杂役弟子')}">${window.escapeHtml(contributor.title || '杂役弟子')}</span>
                    <span class="home-contributor-card__count">${window.formatNumber(contributor.count || 0)} ${window.t('common.contributions_unit')}</span>
                </div>
            </div>
        </a>
    `).join('');
}

function initStairStripes() {
    const box = document.getElementById('js-stair-stripes');
    if (!box) return;
    box.innerHTML = '';

    const count = 8;
    const period = 4;
    for (let i = 0; i < count; i++) {
        const stripe = document.createElement('div');
        stripe.className = 'stair-celestial__stripe';
        stripe.style.setProperty('--delay', `${((i / count) * period - period).toFixed(2)}s`);
        stripe.style.setProperty('--dur', `${period}s`);
        box.appendChild(stripe);
    }
}

function buildTierGroups(data) {
    const groups = {};
    TIER_DATA.forEach((tier) => { groups[tier.name] = []; });
    (data.memes || []).forEach((meme) => {
        if (groups[meme.tier]) groups[meme.tier].push(meme);
    });
    Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => (b.submissions || 0) - (a.submissions || 0));
    });
    return groups;
}

function initStairStage(data) {
    const container = document.getElementById('js-stair-canvas');
    const stageBody = document.getElementById('js-stair-stage-body');
    const plate = document.getElementById('js-tier-plate');
    if (!container || !stageBody || !plate) return;

    initStairStripes();

    const readCss = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1), 0.1, 1000);
    camera.position.set(0, 0.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const tower = new THREE.Group();
    scene.add(tower);

    const stepGeo = new THREE.BoxGeometry(1.4, 0.18, 0.32);
    stepGeo.translate(1.4 / 2 + 0.18, -0.18 / 2, 0);

    const stepMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(readCss('--color-secondary', '#fb7299')) });
    const edgesMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(readCss('--color-primary', '#0a0a0a')) });
    const pillarMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(readCss('--color-secondary', '#fb7299')) });
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6, 32), pillarMaterial);
    scene.add(pillar);

    const total = 75;
    const totalDeg = 1080;
    const totalHeight = 6;
    const yStart = totalHeight / 2;
    const yEnd = -totalHeight / 2;
    const yStep = (yStart - yEnd) / (total - 1);

    for (let i = 0; i < total; i++) {
        const mesh = new THREE.Mesh(stepGeo, stepMaterial);
        const angle = THREE.MathUtils.degToRad((i / (total - 1)) * totalDeg);
        mesh.position.y = yStart - i * yStep;
        mesh.rotation.y = angle;
        mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(stepGeo), edgesMaterial));
        tower.add(mesh);
    }

    const groups = buildTierGroups(data);
    const numEl = plate.querySelector('.tier-plate__num');
    const nameEl = plate.querySelector('.tier-plate__name');
    const rangeEl = plate.querySelector('.tier-plate__range');
    const bodyEl = plate.querySelector('.tier-plate__body');

    let currentIndex = -1;
    let leaveTimer = null;

    function render() {
        renderer.render(scene, camera);
    }

    function setThemeColors() {
        stepMaterial.color = new THREE.Color(readCss('--color-secondary', '#fb7299'));
        edgesMaterial.color = new THREE.Color(readCss('--color-primary', '#0a0a0a'));
        pillarMaterial.color = new THREE.Color(readCss('--color-secondary', '#fb7299'));
        render();
    }

    function renderPlate(index) {
        const tier = TIER_DATA[index];
        const list = groups[tier.name] || [];
        numEl.textContent = tier.n;
        nameEl.textContent = typeof window.translateTierName === 'function' ? window.translateTierName(tier.name, window.LANG || 'zh') : tier.name;
        rangeEl.textContent = translatedTierRange(tier.name, tier.range);

        let html = `<div class="tier-plate__count">${tt('tierSystem.currentCount', '当前 {count} 个梗').replace('{count}', window.formatNumber(list.length))}</div>`;
        if (list.length) {
            html += '<ul class="tier-plate__list">';
            list.slice(0, 3).forEach((meme) => {
                html += `<li>${window.escapeHtml(meme.id)}</li>`;
            });
            if (list.length > 3) {
                html += `<li>${tt('tierSystem.moreCount', '… 还有 {count} 个').replace('{count}', window.formatNumber(list.length - 3))}</li>`;
            }
            html += '</ul>';
        } else {
            html += `<div class="tier-plate__empty">${tt('tierSystem.emptyTier', '尚无，快来贡献')}</div>`;
        }
        bodyEl.innerHTML = html;
    }

    function switchPlate(nextIndex) {
        if (nextIndex === currentIndex) return;

        if (nextIndex < 0 || nextIndex >= TIER_DATA.length) {
            plate.classList.remove('is-active', 'is-entering');
            plate.classList.add('is-leaving');
            currentIndex = -1;
            return;
        }

        if (currentIndex === -1) {
            renderPlate(nextIndex);
            plate.classList.remove('is-leaving');
            plate.classList.add('is-entering');
            requestAnimationFrame(() => {
                plate.classList.remove('is-entering');
                plate.classList.add('is-active');
            });
        } else {
            plate.classList.remove('is-active');
            plate.classList.add('is-leaving');
            clearTimeout(leaveTimer);
            leaveTimer = setTimeout(() => {
                renderPlate(nextIndex);
                plate.classList.remove('is-leaving');
                plate.classList.add('is-entering');
                requestAnimationFrame(() => {
                    plate.classList.remove('is-entering');
                    plate.classList.add('is-active');
                });
            }, 320);
        }

        currentIndex = nextIndex;
    }

    function onScroll() {
        const rect = stageBody.getBoundingClientRect();
        const totalScrollable = rect.height - window.innerHeight;
        const progress = Math.max(0, Math.min(1, -rect.top / Math.max(totalScrollable, 1)));
        tower.rotation.y = THREE.MathUtils.degToRad(progress * 1080);
        render();

        const slot = 1 / TIER_DATA.length;
        const showStart = 0.34;
        const showEnd = 0.86;
        let shown = -1;
        for (let i = 0; i < TIER_DATA.length; i++) {
            const ratio = (progress - i * slot) / slot;
            if (ratio >= showStart && ratio <= showEnd) {
                shown = i;
                break;
            }
        }
        switchPlate(shown);
    }

    new MutationObserver(setThemeColors).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    window.addEventListener('resize', () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        render();
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    setThemeColors();
    onScroll();
}

async function initIndex() {
    initDanmakuLayer('home-danmaku-back', DANMAKU_BACK, 38, 8, 88);
    initDanmakuLayer('home-danmaku-front', DANMAKU_FRONT, 22, 14, 82);
    initHeroFade();

    const summary = await window.loadData();
    const stats = summary.stats || {
        total_memes: (summary.memes || []).length,
        total_videos: 0,
        total_contributors: (summary.contributors || []).length
    };

    initStats(stats);
    renderRankings(summary.memes || []);
    renderContributors(summary.contributors || []);
    initStairStage(summary);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIndex);
} else {
    initIndex();
}
