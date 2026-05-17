(function () {
    function initThemePersist() {
        try {
            var saved = localStorage.getItem('hof-theme');
            if (saved === 'day') document.documentElement.classList.add('theme-contrasted');
        } catch (_) {}

        var obs = new MutationObserver(function () {
            var day = document.documentElement.classList.contains('theme-contrasted');
            try { localStorage.setItem('hof-theme', day ? 'day' : 'night'); } catch (_) {}
        });
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    function initThemeToggle() {
        var btn = document.querySelector('.js-contrast');
        if (!btn) return;

        document.addEventListener('click', function (e) {
            var target = e.target.closest('.js-contrast');
            if (!target) return;
            var isNight = !document.documentElement.classList.contains('theme-contrasted');
            document.documentElement.style.setProperty('--wipe-anim', isNight ? 'theme-wipe-rtl' : 'theme-wipe-ltr');
        }, true);

        btn.addEventListener('click', function () {
            var toggle = function () {
                document.documentElement.classList.toggle('theme-contrasted');
            };

            if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.startViewTransition(toggle);
            } else {
                toggle();
            }
        });
    }

    function initThemeHover() {
        var STAR_CHARS = ['·', '✢', '✦'];
        var STAR_BASE_CHARS = ['·', '✢', '✦', '·', '✢'];
        var starTimer = null;

        function isDayTheme() {
            return document.documentElement.classList.contains('theme-contrasted');
        }

        function clearStarTimer() {
            if (!starTimer) return;
            clearInterval(starTimer);
            starTimer = null;
        }

        function buildStage(btn) {
            var stage = document.createElement('span');
            var sunOrbit = document.createElement('span');
            var moonOrbit = document.createElement('span');

            stage.className = 'theme-hover-stage';
            sunOrbit.className = 'theme-hover-orbit theme-hover-orbit--sun';
            moonOrbit.className = 'theme-hover-orbit theme-hover-orbit--moon';

            for (var i = 0; i < 8; i++) {
                var ray = document.createElement('span');
                ray.className = 'sun-ray';
                ray.style.setProperty('--ray-angle', (i * 45) + 'deg');
                ray.style.setProperty('--ray-delay', (i * 50) + 'ms');
                sunOrbit.appendChild(ray);
            }

            for (var j = 0; j < 5; j++) {
                var star = document.createElement('span');
                var glyph = document.createElement('span');
                star.className = 'moon-star';
                star.style.setProperty('--star-angle', (j * 72 - 90) + 'deg');
                star.style.setProperty('--star-delay', (j * 60) + 'ms');
                glyph.className = 'moon-star__glyph';
                glyph.textContent = STAR_BASE_CHARS[j];
                glyph.setAttribute('data-base-char', STAR_BASE_CHARS[j]);
                star.appendChild(glyph);
                moonOrbit.appendChild(star);
            }

            stage.appendChild(sunOrbit);
            stage.appendChild(moonOrbit);
            btn.appendChild(stage);
        }

        function resetStars(btn) {
            btn.querySelectorAll('.moon-star__glyph').forEach(function (glyph) {
                glyph.textContent = glyph.getAttribute('data-base-char') || STAR_CHARS[0];
            });
        }

        function cycleStars(btn) {
            btn.querySelectorAll('.moon-star__glyph').forEach(function (glyph) {
                var idx = STAR_CHARS.indexOf(glyph.textContent);
                glyph.textContent = STAR_CHARS[(idx + 1 + STAR_CHARS.length) % STAR_CHARS.length];
            });
        }

        function syncHoverState(btn) {
            clearStarTimer();
            if (!btn.classList.contains('is-hovering') || isDayTheme()) return;
            resetStars(btn);
            starTimer = setInterval(function () { cycleStars(btn); }, 200);
        }

        function init() {
            var sun = document.querySelector('.theme-icon--sun');
            var moon = document.querySelector('.theme-icon--moon');
            var btn = document.querySelector('.sb-contrast');
            if (!sun || !moon || !btn) return;
            if (btn.getAttribute('data-theme-hover-ready') === 'true') return;

            btn.setAttribute('data-theme-hover-ready', 'true');
            buildStage(btn);

            btn.addEventListener('mouseenter', function () {
                btn.classList.add('is-hovering');
                syncHoverState(btn);
            });

            btn.addEventListener('mouseleave', function () {
                btn.classList.remove('is-hovering');
                clearStarTimer();
            });

            new MutationObserver(function () {
                if (btn.classList.contains('is-hovering')) syncHoverState(btn);
            }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        }

        init();
    }

    function initLangButtons() {
        var switcher = document.querySelector('.js-language-switch');
        var current = document.querySelector('.js-lang-current');
        var currentLabel = document.querySelector('.js-lang-current-label');
        var options = document.querySelectorAll('.js-lang-option');
        if (!switcher || !current || !currentLabel || !options.length) return;

        var labels = {
            zh: { short: '中', full: '中文' },
            en: { short: 'EN', full: 'English' },
            ja: { short: '日', full: '日本語' }
        };

        var lang = window.LANG || 'zh';
        currentLabel.textContent = (labels[lang] || labels.zh).short;

        options.forEach(function (btn) {
            var btnLang = btn.getAttribute('data-lang');
            btn.hidden = false;
            btn.textContent = (labels[btnLang] || {}).full || btnLang;

            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (btnLang && typeof window.switchLang === 'function') {
                    window.switchLang(btnLang);
                }
            });
        });

        current.addEventListener('click', function (e) {
            e.preventDefault();
            switcher.classList.toggle('is-open');
            current.setAttribute('aria-expanded', String(switcher.classList.contains('is-open')));
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.js-language-switch')) {
                switcher.classList.remove('is-open');
                current.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function initMenuToggle() {
        var toggle = document.querySelector('.js-nav-toggle');
        var nav = document.querySelector('.js-site-nav');
        if (!toggle || !nav) return;

        function closeMenu() {
            toggle.classList.remove('is-open');
            nav.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            var next = !toggle.classList.contains('is-open');
            toggle.classList.toggle('is-open', next);
            nav.classList.toggle('is-open', next);
            toggle.setAttribute('aria-expanded', String(next));
        });

        document.addEventListener('click', function (e) {
            if (e.target.closest('.js-nav-toggle') || e.target.closest('.js-site-nav')) return;
            closeMenu();
        });

        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMenu();
            });
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 1120) closeMenu();
        });
    }

    function initCurrentNav() {
        var links = document.querySelectorAll('.js-site-nav .js-menu-link');
        if (!links.length) return;

        var page = location.pathname.split('/').pop() || 'index.html';
        var activeHref = page === 'meme.html' ? 'memes.html' : page;

        links.forEach(function (link) {
            var href = link.getAttribute('href') || '';
            var normalized = href.split('?')[0].split('#')[0];
            var active = normalized === activeHref;
            link.classList.toggle('is-active', active);
            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    function initConsoleLabel() {
        var consoleEl = document.querySelector('.js-console');
        if (!consoleEl) return;
        var page = location.pathname.split('/').pop() || 'index.html';
        var label = {
            'index.html': 'home shell\nvisual flagship',
            'memes.html': 'memes index\nfilter ready',
            'meme.html': 'detail view\nsingle meme',
            'contributors.html': 'contributors\npodium wall'
        }[page] || 'wan e zhi yuan\nsite shell';
        consoleEl.textContent = label;
    }

    function initNav() {
        initThemePersist();
        initThemeToggle();
        initThemeHover();
        initMenuToggle();
        initCurrentNav();
        initLangButtons();
        initConsoleLabel();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
})();
