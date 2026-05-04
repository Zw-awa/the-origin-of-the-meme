/* ═══════════════════════════════════════════════════════════════
   万恶之源 | The Origin of the Meme
   Data Loading & Shared Utilities
   ═══════════════════════════════════════════════════════════════ */

const MEME_TIER_NAMES = [
    '杂役弟子', '练气期', '筑基期', '金丹期', '元婴期',
    '化神期', '练虚期', '合体期', '大乘期', '渡劫飞升'
];

const CONTRIBUTOR_TIER_NAMES = [
    '杂役弟子', '外门弟子', '内门弟子', '真传弟子', '长老', '太上长老'
];

function getTierIndex(tierName) {
    const idx = MEME_TIER_NAMES.indexOf(tierName);
    return idx >= 0 ? idx : 0;
}

function getTierColor(tierName) {
    const idx = getTierIndex(tierName);
    return `var(--tier-${idx})`;
}

function getTierClass(tierName) {
    const idx = getTierIndex(tierName);
    return `tier-${idx}`;
}

function getContributorTierIndex(title) {
    const idx = CONTRIBUTOR_TIER_NAMES.indexOf(title);
    return idx >= 0 ? idx : 0;
}

function getContributorTierClass(title) {
    const idx = getContributorTierIndex(title);
    return `tier-${idx}`;
}

function isLegendaryTier(tierName) {
    return tierName === '渡劫飞升';
}

async function loadData() {
    try {
        const res = await fetch('../_data/computed.json');
        if (!res.ok) throw new Error('computed.json not found');
        return await res.json();
    } catch {
        try {
            const res = await fetch('./_data/computed.json');
            if (!res.ok) throw new Error('computed.json not found');
            return await res.json();
        } catch {
            return {
                generated_at: null,
                memes: [],
                contributors: [],
                stats: { total_memes: 0, total_videos: 0, total_contributors: 0, hall_of_fame_count: 0 }
            };
        }
    }
}

async function loadFullData() {
    try {
        const res = await fetch('../_data/memes-full.json');
        if (!res.ok) throw new Error('memes-full.json not found');
        return await res.json();
    } catch {
        try {
            const res = await fetch('./_data/memes-full.json');
            if (!res.ok) throw new Error('memes-full.json not found');
            return await res.json();
        } catch {
            return { generated_at: null, memes: [] };
        }
    }
}

function getMemeById(data, id) {
    return data.memes.find(function (m) { return m.id === id; });
}

function getHallOfFameMemes(data) {
    return data.memes.filter(function (m) { return m.hall_of_fame; });
}

function getMemesGroupedByTier(data) {
    var groups = {};
    MEME_TIER_NAMES.forEach(function (name) { groups[name] = []; });
    data.memes.forEach(function (meme) {
        var tier = meme.tier || '杂役弟子';
        if (groups[tier]) {
            groups[tier].push(meme);
        } else {
            groups[tier] = [meme];
        }
    });
    return groups;
}

function formatNumber(n) {
    return (n ?? 0).toLocaleString('zh-CN');
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function buildTierBadge(tierName, large) {
    var cls = 'tier-badge ' + getTierClass(tierName);
    if (isLegendaryTier(tierName)) cls += ' legendary';
    if (large) cls += ' tier-badge-lg';
    return '<span class="' + cls + '">' + escapeHtml(tierName) + '</span>';
}

Object.assign(window, {
    MEME_TIER_NAMES: MEME_TIER_NAMES,
    CONTRIBUTOR_TIER_NAMES: CONTRIBUTOR_TIER_NAMES,
    getTierIndex: getTierIndex,
    getTierColor: getTierColor,
    getTierClass: getTierClass,
    getContributorTierIndex: getContributorTierIndex,
    getContributorTierClass: getContributorTierClass,
    isLegendaryTier: isLegendaryTier,
    loadData: loadData,
    loadFullData: loadFullData,
    getMemeById: getMemeById,
    getHallOfFameMemes: getHallOfFameMemes,
    getMemesGroupedByTier: getMemesGroupedByTier,
    formatNumber: formatNumber,
    escapeHtml: escapeHtml,
    buildTierBadge: buildTierBadge
});
