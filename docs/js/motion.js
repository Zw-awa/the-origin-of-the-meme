(function () {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var revealIndex = 0;
    var sectionRatios = new Map();
    var currentSectionFrame = 0;

    var REACTIVE_SELECTORS = [
        '.panel:not(.stair-stage)',
        '.home-hero__frame',
        '.home-ranking-row',
        '.home-contributor-card',
        '.home-hall-card',
        '.stat-card',
        '.meme-card',
        '.meme-video-card',
        '.meme-related-card',
        '.meme-hero__main',
        '.meme-hero__tier-card',
        '.contributors-podium__card',
        '.contributors-rest__card',
        '.contributors-how__step',
        '.memes-search'
    ];

    var REVEAL_SELECTORS = [
        '.section-head',
        '.panel:not(.stair-stage)',
        '.home-ranking-row',
        '.home-contributor-card',
        '.home-hall-card',
        '.stat-card',
        '.meme-video-card',
        '.meme-related-card',
        '.meme-hero__main',
        '.meme-hero__tier-card',
        '.contributors-podium__card',
        '.contributors-rest__card',
        '.contributors-how__step',
        '.empty-state'
    ];

    var SECTION_SELECTORS = [
        '.page-section',
        '.meme-detail-section'
    ];

    var CLICK_FEEDBACK_SELECTOR = [
        '.motion-reactive',
        '.btn',
        '.pill',
        '.memes-pagination__btn',
        '.meme-back',
        '.meme-origin-link'
    ].join(', ');

    var revealObserver = reducedMotion.matches ? null : new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        });
    }, {
        threshold: 0.18,
        rootMargin: '0px 0px -6% 0px'
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            sectionRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        scheduleSectionRefresh();
    }, {
        threshold: [0.1, 0.2, 0.35, 0.5, 0.65]
    });

    function setRootVar(name, value) {
        document.documentElement.style.setProperty(name, value);
    }

    function initAmbientMotion() {
        var pointerX = window.innerWidth * 0.72;
        var pointerY = window.innerHeight * 0.18;
        var frame = 0;

        function commitPointer() {
            frame = 0;
            setRootVar('--motion-pointer-x', ((pointerX / Math.max(window.innerWidth, 1)) * 100).toFixed(2) + '%');
            setRootVar('--motion-pointer-y', ((pointerY / Math.max(window.innerHeight, 1)) * 100).toFixed(2) + '%');
        }

        function onPointerMove(event) {
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (frame) return;
            frame = requestAnimationFrame(commitPointer);
        }

        function onScroll() {
            var maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            var progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
            setRootVar('--motion-scroll-progress', progress.toFixed(4));
            setRootVar('--motion-scroll-shift', (progress * 28).toFixed(2) + 'px');
        }

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        commitPointer();
        onScroll();
    }

    function ensureGlowLayer(node) {
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].classList.contains('motion-glow-layer')) {
                return;
            }
        }
        var glow = document.createElement('span');
        glow.className = 'motion-glow-layer';
        glow.setAttribute('aria-hidden', 'true');
        node.appendChild(glow);
    }

    function bindReactive(node) {
        if (!node || node.dataset.motionReactiveBound === 'true') return;
        node.dataset.motionReactiveBound = 'true';
        node.classList.add('motion-reactive');
        ensureGlowLayer(node);

        if (reducedMotion.matches) return;

        function updateFocus(event) {
            var rect = node.getBoundingClientRect();
            var x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
            var y = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
            var driftX = ((x / 100) - 0.5) * 20;
            var driftY = ((y / 100) - 0.5) * 18;
            node.style.setProperty('--motion-focus-x', x.toFixed(2) + '%');
            node.style.setProperty('--motion-focus-y', y.toFixed(2) + '%');
            node.style.setProperty('--motion-drift-x', driftX.toFixed(2) + 'px');
            node.style.setProperty('--motion-drift-y', driftY.toFixed(2) + 'px');
        }

        node.addEventListener('pointerenter', function () {
            node.classList.add('is-hovering');
        });

        node.addEventListener('pointermove', updateFocus, { passive: true });

        node.addEventListener('pointerleave', function () {
            node.classList.remove('is-hovering');
            node.style.removeProperty('--motion-drift-x');
            node.style.removeProperty('--motion-drift-y');
        });
    }

    function bindReveal(node) {
        if (!node || node.dataset.motionRevealBound === 'true') return;
        node.dataset.motionRevealBound = 'true';
        node.classList.add('motion-reveal');
        node.style.setProperty('--motion-delay', ((revealIndex % 6) * 50) + 'ms');
        revealIndex += 1;

        var bounds = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
        var isOversized = bounds && bounds.height > window.innerHeight * 1.35;

        if (reducedMotion.matches || !revealObserver || isOversized) {
            node.classList.add('is-visible');
            return;
        }

        revealObserver.observe(node);
    }

    function bindSection(node) {
        if (!node || node.dataset.motionSectionBound === 'true') return;
        node.dataset.motionSectionBound = 'true';
        node.classList.add('motion-section');
        node.style.setProperty('--section-progress', '0');
        sectionObserver.observe(node);
    }

    function bindLiveNumber(node) {
        if (!node || node.dataset.motionLiveBound === 'true') return;
        node.dataset.motionLiveBound = 'true';

        var lastValue = node.textContent;
        var lastBumpAt = 0;
        var observer = new MutationObserver(function () {
            var nextValue = node.textContent;
            if (nextValue === lastValue) return;
            lastValue = nextValue;
            var now = Date.now();
            if (now - lastBumpAt < 140) return;
            lastBumpAt = now;
            node.classList.remove('is-live-bumping');
            void node.offsetWidth;
            node.classList.add('is-live-bumping');
            clearTimeout(node._motionBumpTimer);
            node._motionBumpTimer = window.setTimeout(function () {
                node.classList.remove('is-live-bumping');
            }, 360);
        });

        observer.observe(node, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    function scheduleSectionRefresh() {
        if (currentSectionFrame) return;
        currentSectionFrame = requestAnimationFrame(refreshCurrentSection);
    }

    function refreshCurrentSection() {
        currentSectionFrame = 0;

        var bestNode = null;
        var bestRatio = 0;

        sectionRatios.forEach(function (ratio, node) {
            node.style.setProperty('--section-progress', ratio.toFixed(4));
            if (ratio > bestRatio) {
                bestRatio = ratio;
                bestNode = node;
            }
        });

        document.querySelectorAll('.motion-section.is-current').forEach(function (node) {
            if (node !== bestNode) {
                node.classList.remove('is-current');
            }
        });

        if (bestNode && bestRatio > 0.14) {
            bestNode.classList.add('is-current');
        }
    }

    function spawnClickRing(event, node) {
        if (reducedMotion.matches) return;

        var ring = document.createElement('span');
        ring.className = 'motion-click-ring';
        ring.style.left = event.clientX + 'px';
        ring.style.top = event.clientY + 'px';
        document.body.appendChild(ring);
        ring.addEventListener('animationend', function () {
            ring.remove();
        });

        if (!node) return;
        node.classList.add('is-pressed');
        clearTimeout(node._motionPressTimer);
        node._motionPressTimer = window.setTimeout(function () {
            node.classList.remove('is-pressed');
        }, 170);
    }

    function initClickFeedback() {
        document.addEventListener('pointerdown', function (event) {
            if (event.button !== 0) return;
            var target = event.target.closest(CLICK_FEEDBACK_SELECTOR);
            if (!target) return;
            spawnClickRing(event, target);
        });
    }

    function collectMatches(root, selectors) {
        var set = new Set();
        selectors.forEach(function (selector) {
            if (root.matches && root.matches(selector)) {
                set.add(root);
            }
            if (!root.querySelectorAll) return;
            root.querySelectorAll(selector).forEach(function (node) {
                set.add(node);
            });
        });
        return Array.from(set);
    }

    function scan(root) {
        collectMatches(root, REACTIVE_SELECTORS).forEach(bindReactive);
        collectMatches(root, REVEAL_SELECTORS).forEach(bindReveal);
        collectMatches(root, SECTION_SELECTORS).forEach(bindSection);

        if (root.matches && root.matches('[data-live-number]')) {
            bindLiveNumber(root);
        }
        if (root.querySelectorAll) {
            root.querySelectorAll('[data-live-number]').forEach(bindLiveNumber);
        }
    }

    function initMutationTracking() {
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType !== 1) return;
                    scan(node);
                });
            });
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        initAmbientMotion();
        initClickFeedback();
        scan(document.body);
        initMutationTracking();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
