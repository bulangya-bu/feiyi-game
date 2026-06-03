/**
 * Shared ancient-style atmosphere and interaction feedback.
 */
(function () {
    "use strict";

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    var CONFIG = {
        inkParticles: 18,
        floatingElements: 9,
        maxInkTrailPoints: 44
    };

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function ensureLayer() {
        var layer = document.querySelector(".ancient-effects-layer");
        if (layer) return layer;

        layer = document.createElement("div");
        layer.className = "ancient-effects-layer";
        document.body.insertBefore(layer, document.body.firstChild);
        return layer;
    }

    function initInkBlobs(layer) {
        for (var i = 1; i <= 3; i += 1) {
            var blob = document.createElement("div");
            blob.className = "ink-blob ink-blob--" + i;
            layer.appendChild(blob);
        }
    }

    function initInkParticles(layer) {
        for (var i = 0; i < CONFIG.inkParticles; i += 1) {
            var particle = document.createElement("span");
            var sizeClass = Math.random() < 0.32 ? " ink-particle--small" : (Math.random() > 0.78 ? " ink-particle--large" : "");
            particle.className = "ink-particle" + sizeClass;
            particle.style.left = randomBetween(4, 96).toFixed(2) + "%";
            particle.style.top = randomBetween(18, 100).toFixed(2) + "%";
            particle.style.animationDelay = (-randomBetween(0, 16)).toFixed(2) + "s";
            layer.appendChild(particle);
        }
    }

    function initFloatingElements(layer) {
        for (var i = 0; i < CONFIG.floatingElements; i += 1) {
            var item = document.createElement("span");
            item.className = "floating-element " + (Math.random() < 0.62 ? "floating-element--leaf" : "floating-element--petal");
            item.style.left = randomBetween(6, 94).toFixed(2) + "%";
            item.style.animationDelay = (-randomBetween(0, 18)).toFixed(2) + "s";
            item.style.animationDuration = randomBetween(16, 25).toFixed(2) + "s";
            layer.appendChild(item);
        }
    }

    function initMouseInkTrail(layer) {
        if (window.matchMedia("(max-width: 768px)").matches) return;

        var canvas = document.createElement("canvas");
        canvas.className = "mouse-ink-canvas";
        layer.appendChild(canvas);

        var ctx = canvas.getContext("2d");
        var points = [];
        var rafId = null;

        function resizeCanvas() {
            var ratio = window.devicePixelRatio || 1;
            canvas.width = Math.round(window.innerWidth * ratio);
            canvas.height = Math.round(window.innerHeight * ratio);
            canvas.style.width = window.innerWidth + "px";
            canvas.style.height = window.innerHeight + "px";
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        }

        function draw() {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            points = points.filter(function (point) {
                point.age += 0.024;
                return point.age < 1;
            });

            if (points.length > 1) {
                for (var i = 1; i < points.length; i += 1) {
                    var prev = points[i - 1];
                    var point = points[i];
                    var alpha = Math.max(0, 1 - point.age) * 0.14;
                    ctx.beginPath();
                    ctx.moveTo(prev.x, prev.y);
                    ctx.quadraticCurveTo(prev.x, prev.y, point.x, point.y);
                    ctx.strokeStyle = "rgba(44, 36, 25, " + alpha.toFixed(3) + ")";
                    ctx.lineWidth = Math.max(0.5, 2.4 * (1 - point.age));
                    ctx.lineCap = "round";
                    ctx.stroke();
                }
            }

            rafId = window.requestAnimationFrame(draw);
        }

        resizeCanvas();
        window.addEventListener("resize", resizeCanvas, { passive: true });
        document.addEventListener("mousemove", function (event) {
            points.push({ x: event.clientX, y: event.clientY, age: 0 });
            if (points.length > CONFIG.maxInkTrailPoints) {
                points.shift();
            }
            if (!rafId) draw();
        }, { passive: true });

        draw();
    }

    function triggerStamp(target) {
        var stamp = document.querySelector(".seal-stamp-effect");
        if (!stamp || !target) return;

        var rect = target.getBoundingClientRect();
        stamp.style.left = (rect.left + rect.width / 2 - 24) + "px";
        stamp.style.top = Math.max(12, rect.top - 52) + "px";
        stamp.classList.remove("is-stamping");
        stamp.style.opacity = "0";
        void stamp.offsetWidth;
        stamp.classList.add("is-stamping");

        window.setTimeout(function () {
            stamp.classList.remove("is-stamping");
            stamp.style.opacity = "0";
        }, 900);
    }

    function initSealStamp() {
        var stamp = document.createElement("div");
        stamp.className = "seal-stamp-effect";
        stamp.innerHTML = '<div class="seal-stamp-effect__mark"><span>印</span></div><div class="seal-stamp-effect__ripple"></div>';
        document.body.appendChild(stamp);

        document.addEventListener("click", function (event) {
            var target = event.target.closest("a, button, .chapter-entry, .catalog-entry");
            if (!target || target.closest(".site-nav")) return;
            triggerStamp(target);
        });
    }

    function initCalligraphyReveal() {
        if (!document.body.classList.contains("page-home")) return;

        document.querySelectorAll(".scroll-intro__title, .scroll-opening__title").forEach(function (title) {
            if (title.dataset.calligraphyReady) return;

            var nodes = Array.from(title.childNodes);
            title.textContent = "";
            title.classList.add("calligraphy-text-reveal");
            title.dataset.calligraphyReady = "true";

            var index = 0;
            nodes.forEach(function (node) {
                if (node.nodeName === "BR") {
                    title.appendChild(document.createElement("br"));
                    return;
                }

                node.textContent.split("").forEach(function (char) {
                    var span = document.createElement("span");
                    span.textContent = char;
                    span.style.setProperty("--char-index", index);
                    title.appendChild(span);
                    index += char.trim() ? 1 : 0;
                });
            });
        });
    }

    function initPageTransition() {
        var overlay = document.createElement("div");
        overlay.className = "page-transition-overlay";
        document.body.appendChild(overlay);

        document.addEventListener("click", function (event) {
            var link = event.target.closest("a[href]");
            if (!link) return;
            var href = link.getAttribute("href");
            if (!href || href.charAt(0) === "#" || link.target) return;
            overlay.classList.add("is-active");
        });
    }

    function initScrollBars() {
        document.querySelectorAll(".scroll-bar").forEach(function (bar) {
            bar.classList.add("scroll-bar--animated");
        });
    }

    function init() {
        var layer = ensureLayer();
        initInkBlobs(layer);
        initInkParticles(layer);
        initFloatingElements(layer);
        initMouseInkTrail(layer);
        initScrollBars();
        initSealStamp();
        initCalligraphyReveal();
        initPageTransition();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
