/* ============================================================
   万恶之源 | i18n Translation Engine
   ============================================================ */

/* -- Language Detection ------------------------------------ */
function getLang() {
    var param = new URLSearchParams(window.location.search).get('lang');
    if (param && ['zh', 'en', 'ja'].indexOf(param) !== -1) {
        localStorage.setItem('lang', param);
        return param;
    }
    var stored = localStorage.getItem('lang');
    if (stored) return stored;
    var nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('en')) return 'en';
    return 'zh';
}
var LANG = getLang();

/* -- Translation Dictionary -------------------------------- */
var I18N = {
    zh: {
        nav: { memes: '排行', tiers: '等级体系', hall: '荣誉殿堂', contributors: '贡献者' },
        hero: { subtitle: 'B站梗文化索引, 社区共建, 修仙等级体系', btnPrimary: '参与贡献', btnSecondary: '查看排行', scrollHint: '向下探索' },
        stats: { title: '数据总览', subtitle: '每一个数字背后, 都是一段B站传说', memes: '收录梗数', videos: '收录视频', contributors: '贡献者', hall: '荣誉殿堂' },
        rankings: { title: '梗排行榜', subtitle: '社区贡献, 修仙等级自动评定', empty: '暂无数据, 快来贡献第一个梗吧!', contribute: '参与贡献' },
        tierSystem: { title: '修仙等级体系', subtitle: '收录视频越多, 等级越高, 从杂役弟子到渡劫飞升' },
        contributors_section: { title: '贡献者殿堂', subtitle: '每一位贡献者都在为B站梗文化添砖加瓦', empty: '还没有贡献者, 来成为第一个吧!', contribute: '参与贡献' },
        footer: { links: '项目链接', resources: '相关资源', about: '关于', memes: '梗列表', hall: '荣誉殿堂', contributors: '贡献者排行', github: 'GitHub', guide: '贡献指南', issues: '问题反馈', bilibili: 'Bilibili', intro: '项目介绍', license: 'MIT License', disclaimer: '本索引中的所有链接及元数据均为公开信息的整理与索引。所有视频、音频及相关素材的版权归原作者及哔哩哔哩(bilibili.com)所有。本项目仅提供索引服务, 不进行任何形式的内容存储、复制或分发。' },
        memes_page: { title: '梗列表', subtitle: '按修仙等级排序, 搜索你熟悉的B站梗', search: '搜索梗名称、别名或标签...', results: '个结果', noResults: '没有匹配的梗', resultsCount: '个梗' },
        meme_page: { title: '梗详情', aliases: '别名', tags: '标签', description: '描述', originVideo: '万恶之源视频', videos: '收录视频', noVideos: '暂无视频', contributor: '贡献者', contribute: '为这个梗贡献视频', back: '← 返回列表', notFound: '未找到梗', noId: '缺少梗ID', browseAll: '浏览所有梗', upMaster: 'UP主', contributorLabel: '贡献者' },
        hall_page: { title: '荣誉殿堂', subtitle: '收录所有达到「渡劫飞升」境界的万恶之源', subheading: 'B 站 永 远 的 传 说', videos: '收录视频', rank: '排名', empty: '还没有梗达到渡劫飞升, 快来贡献吧!', cta: '参与贡献' },
        contributors_page: { title: '贡献者排行榜', subtitle: '每一位贡献者都在为B站梗文化添砖加瓦, 贡献越多称号越高', empty: '还没有贡献者, 来成为第一个吧!', contribute: '参与贡献' },
        tier_labels: { '杂役弟子': '太少了, 快来补充', '练气期': '初露锋芒', '筑基期': '小有名气', '金丹期': '圈内皆知', '元婴期': '出圈利器', '化神期': '全站刷屏', '练虚期': '现象级', '合体期': '统治级', '大乘期': '传说级', '渡劫飞升': 'B站永远的传说' },
        common: { loading: '加载中...', error: '加载失败', submissions_unit: '收录', contributions_unit: '次贡献', noTitle: '无标题', unknown: '未知', siteName: '万恶之源' },
        pageTitle: { home: '万恶之源 | The Origin of the Meme', memes: '梗列表 | 万恶之源', meme: '梗详情 | 万恶之源', hall: '荣誉殿堂 | 万恶之源', contributors: '贡献者 | 万恶之源' }
    },
    en: {
        nav: { memes: 'Rankings', tiers: 'Tier System', hall: 'Hall of Fame', contributors: 'Contributors' },
        hero: { subtitle: 'Bilibili Meme Index · Community-Driven · Xianxia Tier System', btnPrimary: 'Contribute', btnSecondary: 'View Rankings', scrollHint: 'Scroll Down' },
        stats: { title: 'Overview', subtitle: 'Every number behind the scenes is a Bilibili legend', memes: 'Memes', videos: 'Videos', contributors: 'Contributors', hall: 'Hall of Fame' },
        rankings: { title: 'Meme Rankings', subtitle: 'Community contributions, tier auto-assigned', empty: 'No memes yet. Be the first to contribute!', contribute: 'Contribute' },
        tierSystem: { title: 'Xianxia Tier System', subtitle: 'More videos, higher tier. From chore disciple to tribulation transcendence.' },
        contributors_section: { title: 'Hall of Contributors', subtitle: 'Every contributor builds the Bilibili meme culture', empty: 'No contributors yet. Be the first!', contribute: 'Contribute' },
        footer: { links: 'Links', resources: 'Resources', about: 'About', memes: 'Meme List', hall: 'Hall of Fame', contributors: 'Contributors', github: 'GitHub', guide: 'Contribution Guide', issues: 'Issues', bilibili: 'Bilibili', intro: 'Introduction', license: 'MIT License', disclaimer: 'All links and metadata in this index are compilations of publicly available information. All video, audio, and related content copyrights belong to their original creators and Bilibili (bilibili.com). This project provides indexing services only and does not store, copy, or distribute any content. This project and its contributors assume no legal liability for any copyright or legal issues arising from the use of this index to access third-party content. If you are a copyright holder and believe this index includes your content improperly, please contact us via Issues and we will address it promptly.' },
        memes_page: { title: 'Meme List', subtitle: 'Sorted by cultivation tier, search for your favorite Bilibili memes', search: 'Search memes by name, alias, or tag...', results: 'results', noResults: 'No matching memes', resultsCount: 'memes' },
        meme_page: { title: 'Meme Detail', aliases: 'Aliases', tags: 'Tags', description: 'Description', originVideo: 'Origin Video', videos: 'Videos', noVideos: 'No videos yet', contributor: 'Contributor', contribute: 'Contribute to this meme', back: '← Back to list', notFound: 'Meme not found', noId: 'Missing meme ID', browseAll: 'Browse all memes', upMaster: 'Uploader', contributorLabel: 'Contributor' },
        hall_page: { title: 'Hall of Fame', subtitle: 'Collecting all memes that have reached the Tribulation Transcendence tier', subheading: 'E T E R N A L  L E G E N D', videos: 'Videos', rank: 'Rank', empty: 'No memes have reached Tribulation Transcendence yet. Be the first to contribute!', cta: 'Contribute' },
        contributors_page: { title: 'Contributor Leaderboard', subtitle: 'Every contributor is remembered. More contributions, higher titles.', empty: 'No contributors yet. Be the first!', contribute: 'Contribute' },
        tier_labels: { '杂役弟子': 'Barely started, come add more!', '练气期': 'First signs of talent', '筑基期': 'Building a reputation', '金丹期': 'Known among the circle', '元婴期': 'Breaks out of the niche', '化神期': 'Floods the whole site', '练虚期': 'Phenomenal', '合体期': 'Dominant level', '大乘期': 'Legendary', '渡劫飞升': 'Eternal Bilibili legend' },
        common: { loading: 'Loading...', error: 'Load failed', submissions_unit: 'submissions', contributions_unit: 'contributions', noTitle: 'No Title', unknown: 'Unknown', siteName: 'The Origin of the Meme' },
        pageTitle: { home: 'The Origin of the Meme | 万恶之源', memes: 'Meme List | The Origin of the Meme', meme: 'Meme Detail | The Origin of the Meme', hall: 'Hall of Fame | The Origin of the Meme', contributors: 'Contributors | The Origin of the Meme' }
    },
    ja: {
        nav: { memes: 'ランキング', tiers: 'ランク体系', hall: '栄誉殿堂', contributors: '貢献者' },
        hero: { subtitle: 'Bilibiliミーム索引 · コミュニティ共築 · 修仙ランク体系', btnPrimary: '貢献する', btnSecondary: 'ランキングを見る', scrollHint: 'スクロール' },
        stats: { title: 'データ概要', subtitle: 'すべての数字の裏には、Bilibiliの伝説がある', memes: '収録ミーム', videos: '収録動画', contributors: '貢献者', hall: '栄誉殿堂' },
        rankings: { title: 'ミームランキング', subtitle: 'コミュニティ貢献、ランク自動判定', empty: 'まだミームがありません。最初の貢献者になりましょう！', contribute: '貢献する' },
        tierSystem: { title: '修仙ランク体系', subtitle: '動画が多いほどランクアップ。雑役弟子から渡劫飛昇へ。' },
        contributors_section: { title: '貢献者殿堂', subtitle: 'すべての貢献者がBilibiliミーム文化を築いています', empty: 'まだ貢献者がいません。最初の一人になりましょう！', contribute: '貢献する' },
        footer: { links: 'リンク', resources: '関連リソース', about: '概要', memes: 'ミーム一覧', hall: '栄誉殿堂', contributors: '貢献者ランキング', github: 'GitHub', guide: '貢献ガイド', issues: '問題報告', bilibili: 'Bilibili', intro: 'プロジェクト紹介', license: 'MITライセンス', disclaimer: '本インデックス内のすべてのリンクおよびメタデータは、公開情報の整理・索引です。すべての動画・音声および関連素材の著作権は、原著作者および哔哩哔哩（bilibili.com）に帰属します。本プロジェクトは索引サービスのみを提供し、いかなる形式のコンテンツ保存・複製・配布も行いません。本インデックスを利用して第三者のコンテンツにアクセスしたことにより生じたいかなる著作権上または法律上の問題についても、本プロジェクトおよびその貢献者は一切の法的責任を負いません。関連コンテンツの著作権者であり、本インデックスへの収録が不適切とお考えの場合は、Issuesからご連絡ください。速やかに対応いたします。' },
        memes_page: { title: 'ミーム一覧', subtitle: '修仙ランク順にソート、お気に入りのBilibiliミームを検索', search: 'ミーム名・別名・タグで検索...', results: '件', noResults: '一致するミームがありません', resultsCount: '件' },
        meme_page: { title: 'ミーム詳細', aliases: '別名', tags: 'タグ', description: '説明', originVideo: '元ネタ動画', videos: '収録動画', noVideos: 'まだ動画がありません', contributor: '貢献者', contribute: 'このミームに貢献する', back: '← 一覧に戻る', notFound: 'ミームが見つかりません', noId: 'ミームIDがありません', browseAll: 'すべてのミームを見る', upMaster: '投稿者', contributorLabel: '貢献者' },
        hall_page: { title: '栄誉殿堂', subtitle: '「渡劫飛昇」に達したすべてのミームを収録', subheading: '永 遠 の 伝 説', videos: '収録動画', rank: 'ランク', empty: 'まだ渡劫飛昇に達したミームはありません。最初の貢献者になりましょう！', cta: '貢献する' },
        contributors_page: { title: '貢献者ランキング', subtitle: 'すべての貢献者に敬意を。貢献が多いほど称号が上がります。', empty: 'まだ貢献者がいません。最初の一人になりましょう！', contribute: '貢献する' },
        tier_labels: { '杂役弟子': 'まだまだこれから', '练气期': '初めての才能', '筑基期': '名が知られ始める', '金丹期': '界隈では有名人', '元婴期': 'ニッチの外へ', '化神期': 'サイト全体を席巻', '练虚期': '現象級', '合体期': '支配級', '大乘期': '伝説級', '渡劫飞升': 'Bilibili永遠の伝説' },
        common: { loading: '読み込み中...', error: '読み込みに失敗しました', submissions_unit: '件収録', contributions_unit: '回貢献', noTitle: '無題', unknown: '不明', siteName: '万恶之源' },
        pageTitle: { home: '万恶之源 | The Origin of the Meme', memes: 'ミーム一覧 | 万恶之源', meme: 'ミーム詳細 | 万恶之源', hall: '栄誉殿堂 | 万恶之源', contributors: '貢献者 | 万恶之源' }
    }
};

/* -- Translation Function ----------------------------------- */
function t(key) {
    var keys = key.split('.');
    var val = I18N[LANG];
    for (var i = 0; i < keys.length; i++) {
        if (val == null) break;
        val = val[keys[i]];
    }
    if (val != null) return val;
    if (LANG !== 'zh') {
        var fallback = I18N['zh'];
        for (var i = 0; i < keys.length; i++) {
            if (fallback == null) return key;
            fallback = fallback[keys[i]];
        }
        if (fallback != null) return fallback;
    }
    return key;
}

/* -- Language Switcher -------------------------------------- */
function switchLang(lang) {
    localStorage.setItem('lang', lang);
    window.location.reload();
}

/* -- DOM Translation Init ----------------------------------- */
function initI18n() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    }

    var attrs = document.querySelectorAll('[data-i18n-placeholder]');
    for (var i = 0; i < attrs.length; i++) {
        var el = attrs[i];
        var key = el.getAttribute('data-i18n-placeholder');
        if (key) el.placeholder = t(key);
    }

    var attrs2 = document.querySelectorAll('[data-i18n-aria]');
    for (var i = 0; i < attrs2.length; i++) {
        var el = attrs2[i];
        var key = el.getAttribute('data-i18n-aria');
        if (key) el.setAttribute('aria-label', t(key));
    }

    // Set document title based on page
    var path = window.location.pathname;
    var pageKey = 'home';
    if (path.indexOf('memes.html') > -1) pageKey = 'memes';
    else if (path.indexOf('meme.html') > -1) pageKey = 'meme';
    else if (path.indexOf('hall-of-fame') > -1) pageKey = 'hall';
    else if (path.indexOf('contributors') > -1) pageKey = 'contributors';

    if (pageKey !== 'meme') {
        document.title = t('pageTitle.' + pageKey);
    }

    // Set html lang
    document.documentElement.lang = LANG === 'ja' ? 'ja' : LANG === 'en' ? 'en' : 'zh-CN';

    // Mark active language button
    var btns = document.querySelectorAll('.nav-lang-btn');
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].getAttribute('data-lang') === LANG) {
            btns[i].classList.add('active');
        }
    }
}

/* -- Run on DOM ready --------------------------------------- */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    initI18n();
}

/* -- Expose to window --------------------------------------- */
Object.assign(window, { t: t, LANG: LANG, switchLang: switchLang, initI18n: initI18n });
