/**
 * 页面效果引擎
 * - scroll reveal (clip-path 展开)
 * - header 滚动状态
 */
(function () {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let revealObserver = null;

    function setHeaderState() {
        document.body.classList.toggle("has-scrolled", window.scrollY > 18);
    }

    function createRevealObserver() {
        if (revealObserver || reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
            return;
        }

        revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                revealObserver.unobserve(entry.target);
            });
        }, {
            threshold: 0.12,
            rootMargin: "0px 0px -8% 0px"
        });
    }

    function bindReveals(root) {
        root = root || document;
        var nodes = Array.from(root.querySelectorAll("[data-reveal]")).filter(function (n) {
            return !n.dataset.revealBound;
        });
        if (!nodes.length) return;

        if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
            nodes.forEach(function (n) {
                n.classList.add("is-visible");
                n.dataset.revealBound = "true";
            });
            return;
        }

        createRevealObserver();
        nodes.forEach(function (n) {
            n.dataset.revealBound = "true";
            revealObserver.observe(n);
        });
    }

    function refresh(root) {
        bindReveals(root || document);
    }

    function init() {
        setHeaderState();
        refresh(document);

        window.addEventListener("scroll", function () {
            setHeaderState();
        }, {passive: true});

        if (typeof reducedMotionQuery.addEventListener === "function") {
            reducedMotionQuery.addEventListener("change", function () {
                refresh(document);
            });
        }
    }

    window.FeiyiPageEffects = {
        refresh: refresh
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, {once: true});
    } else {
        init();
    }
})();
