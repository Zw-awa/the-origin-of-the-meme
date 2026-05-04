/* ═══════════════════════════════════════════════════════════════
   万恶之源 | Page-Specific Interactivity
   ═══════════════════════════════════════════════════════════════ */

(function () {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    initNavScroll();
    initHamburger();
    highlightCurrentNav();

    function initNavScroll() {
        var nav = document.querySelector('.nav');
        if (!nav) return;
        var lastScrollY = 0;

        window.addEventListener('scroll', function () {
            var scrollY = window.scrollY;
            if (scrollY > 100) {
                if (scrollY > lastScrollY) {
                    nav.classList.add('hidden');
                } else {
                    nav.classList.remove('hidden');
                }
            } else {
                nav.classList.remove('hidden');
            }
            lastScrollY = scrollY;
        }, { passive: true });
    }

    function initHamburger() {
        var hamburger = document.querySelector('.nav-hamburger');
        var navLinks = document.querySelector('.nav-links');
        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        var links = navLinks.querySelectorAll('a');
        links.forEach(function (link) {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }

    function initStatCounters() {
        var statNumbers = document.querySelectorAll('.stat-number[data-target]');
        if (!statNumbers.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el = entry.target;
                var target = parseInt(el.getAttribute('data-target'), 10);
                animateCount(el, target);
                observer.unobserve(el);
            });
        }, { threshold: 0.3 });

        statNumbers.forEach(function (el) { observer.observe(el); });
    }

    function animateCount(el, target) {
        if (prefersReduced) {
            el.textContent = formatNumber(target);
            return;
        }

        var duration = 1500;
        var startTime = performance.now();

        function tick(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(eased * target);
            el.textContent = formatNumber(current);
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = formatNumber(target);
            }
        }

        requestAnimationFrame(tick);
    }

    function initTierSystem() {
        var entries = document.querySelectorAll('.tier-entry');
        if (!entries.length) return;

        var observer = new IntersectionObserver(function (observedEntries) {
            observedEntries.forEach(function (obs, index) {
                if (!obs.isIntersecting) return;
                var entry = obs.target;
                var allEntries = document.querySelectorAll('.tier-entry');
                var stagger = Array.from(allEntries).indexOf(entry) * 150;

                setTimeout(function () {
                    var indicator = entry.querySelector('.tier-indicator');
                    var bar = entry.querySelector('.tier-energy-bar');
                    var targetWidth = bar.getAttribute('data-width');

                    if (indicator) indicator.classList.add('lit');
                    if (bar && targetWidth) {
                bar.style.width = targetWidth + '%';
                    }

                    entry.querySelectorAll('.tier-name, .tier-range, .tier-label').forEach(function (el) {
                        el.style.opacity = '1';
                        el.style.transform = 'translateX(0)';
                    });
                }, stagger);

                observer.unobserve(entry);
            });
        }, { threshold: 0.3 });

        entries.forEach(function (entry) {
            var name = entry.querySelector('.tier-name');
            var range = entry.querySelector('.tier-range');
            var label = entry.querySelector('.tier-label');
            if (name) { name.style.opacity = '0'; name.style.transform = 'translateX(-20px)'; name.style.transition = 'opacity 0.4s, transform 0.4s'; }
            if (range) { range.style.opacity = '0'; range.style.transform = 'translateX(-20px)'; range.style.transition = 'opacity 0.4s 0.05s, transform 0.4s 0.05s'; }
            if (label) { label.style.opacity = '0'; label.style.transform = 'translateX(-20px)'; label.style.transition = 'opacity 0.4s 0.1s, transform 0.4s 0.1s'; }

            observer.observe(entry);
        });
    }

    function initContributorMagnetics() {
        var cards = document.querySelectorAll('.contributor-card');
        if (!cards.length || prefersReduced || isTouchDevice()) return;

        cards.forEach(function (card) {
            var avatar = card.querySelector('.contributor-avatar');
            if (!avatar) return;

            card.addEventListener('mousemove', function (e) {
                var rect = avatar.getBoundingClientRect();
                var cx = rect.left + rect.width / 2;
                var cy = rect.top + rect.height / 2;
                var dx = (e.clientX - cx) * 0.15;
                var dy = (e.clientY - cy) * 0.15;
                avatar.classList.remove('spring-back');
                avatar.classList.add('magnetic');
                avatar.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            });

            card.addEventListener('mouseleave', function () {
                avatar.classList.remove('magnetic');
                avatar.classList.add('spring-back');
                avatar.style.transform = 'translate(0, 0)';
            });
        });
    }

    function initRankingHover() {
        var cards = document.querySelectorAll('.ranking-card');
        if (!cards.length) return;

        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                var memeId = card.getAttribute('data-meme-id');
                if (memeId) {
                    window.location.href = 'meme.html?id=' + encodeURIComponent(memeId);
                }
            });

            card.style.cursor = 'pointer';
        });
    }

    function highlightCurrentNav() {
        var currentPath = window.location.pathname;
        var pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
        if (pageName === '') pageName = 'index.html';

        var navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (!href) return;

            if (href === pageName ||
                (pageName === 'index.html' && (href === 'index.html' || href === '#' || href === '/'))) {
                link.classList.add('active');
            }

            if (pageName !== 'index.html' && (href === pageName || href.startsWith(pageName + '#'))) {
                link.classList.add('active');
            }
        });
    }

    Object.assign(window, {
        initNavScroll: initNavScroll,
        initStatCounters: initStatCounters,
        initTierSystem: initTierSystem,
        initContributorMagnetics: initContributorMagnetics,
        initRankingHover: initRankingHover
    });
})();
