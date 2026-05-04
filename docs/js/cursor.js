/* ═══════════════════════════════════════════════════════════════
   万恶之源 | Custom Cursor, Mouse Trail Particles, Click Burst
   ═══════════════════════════════════════════════════════════════ */

(function () {
    var isMobile = window.matchMedia('(max-width: 640px)').matches ||
                   ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isMobile || prefersReduced) return;

    var cursorActive = true;

    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    document.body.appendChild(dot);

    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    var mouseX = -100;
    var mouseY = -100;
    var ringX = -100;
    var ringY = -100;
    var isHovering = false;
    var hoverableSelector = 'a, button, .stat-card, .ranking-card, .meme-card, .contributor-card, .hof-card, .tier-entry, .btn-neon, .btn-muted, .tag-filter, .video-card, .search-input, .nav-hamburger';
    var lastTrailTime = 0;
    var trailThrottle = 30;

    var BURST_COLORS = ['#00f0ff', '#8b5cf6', '#ff3366', '#ffd700', '#00ff88', '#ff00aa'];

    var POOL_SIZE = 20;
    var trailPool = [];
    var trailIndex = 0;
    for (var p = 0; p < POOL_SIZE; p++) {
        var el = document.createElement('div');
        el.className = 'trail-particle';
        el.style.width = '4px';
        el.style.height = '4px';
        el.style.display = 'none';
        document.body.appendChild(el);
        trailPool.push(el);
    }

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
        createTrailParticle(e.clientX, e.clientY);
    });

    document.addEventListener('mouseover', function (e) {
        var target = e.target;
        if (target.closest(hoverableSelector)) {
            isHovering = true;
            ring.classList.add('hover');
        }
    });

    document.addEventListener('mouseout', function (e) {
        var target = e.target;
        if (target.closest(hoverableSelector)) {
            var related = e.relatedTarget;
            if (!related || !related.closest(hoverableSelector)) {
                isHovering = false;
                ring.classList.remove('hover');
            }
        }
    });

    document.addEventListener('click', function (e) {
        createClickBurst(e.clientX, e.clientY);
    });

    function createTrailParticle(x, y) {
        var now = Date.now();
        if (now - lastTrailTime < trailThrottle) return;
        lastTrailTime = now;

        var particle = trailPool[trailIndex];
        trailIndex = (trailIndex + 1) % POOL_SIZE;
        var hue = (now / 10) % 360;
        var color = 'hsl(' + hue + ', 100%, 70%)';
        particle.style.background = color;
        particle.style.boxShadow = '0 0 6px ' + color;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.display = '';
        particle.style.animation = 'none';
        particle.offsetHeight;
        particle.style.animation = '';
    }

    function createClickBurst(x, y) {
        var container = document.createElement('div');
        container.className = 'click-burst-container';
        container.style.left = x + 'px';
        container.style.top = y + 'px';

        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var distance = 25 + Math.random() * 30;
            var tx = Math.cos(angle) * distance;
            var ty = Math.sin(angle) * distance;

            var particle = document.createElement('div');
            particle.className = 'click-burst-particle';
            particle.style.setProperty('--tx', tx + 'px');
            particle.style.setProperty('--ty', ty + 'px');
            particle.style.background = BURST_COLORS[i % BURST_COLORS.length];
            container.appendChild(particle);
        }

        document.body.appendChild(container);

        setTimeout(function () {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }, 700);
    }

    function animateRing() {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }

    animateRing();

    window.addEventListener('resize', function () {
        if (window.matchMedia('(max-width: 640px)').matches ||
            ('ontouchstart' in window || navigator.maxTouchPoints > 0)) {
            if (dot.parentNode) dot.parentNode.removeChild(dot);
            if (ring.parentNode) ring.parentNode.removeChild(ring);
            document.body.style.cursor = '';
            cursorActive = false;
        } else if (!cursorActive) {
            cursorActive = true;
            document.body.appendChild(dot);
            document.body.appendChild(ring);
            ringX = mouseX;
            ringY = mouseY;
            animateRing();
        }
    });

    Object.assign(window, {
        _cursorDot: dot,
        _cursorRing: ring,
        _hoverableSelector: hoverableSelector
    });

    document.documentElement.classList.add('js-loaded');
})();
