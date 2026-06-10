(function () {
    var chapters = {
        building: [1, 2, 3, 4, 5, 6],
        painting: [7, 8, 9, 10, 11, 12],
        craft: [13, 14, 15, 16, 17, 18]
    };

    function countCleared(progress, ids) {
        return ids.filter(function (id) {
            return progress.clearedLevels.includes(id);
        }).length;
    }

    function countStars(progress, ids) {
        return ids.reduce(function (total, id) {
            return total + Number(progress.bestStars[String(id)] || 0);
        }, 0);
    }

    function setChapterState(chapter, cleared, stars) {
        var clearEl = document.querySelector('[data-chapter-clear="' + chapter + '"]');
        var barEl = document.querySelector('[data-chapter-bar="' + chapter + '"]');
        var node = document.querySelector(".journey-node--" + chapter);
        var ratio = Math.min(cleared / 6, 1);

        if (clearEl) clearEl.textContent = String(cleared);
        if (barEl) barEl.style.width = Math.round(ratio * 100) + "%";
        if (node) {
            node.classList.toggle("journey-node--started", cleared > 0);
            node.classList.toggle("journey-node--complete", cleared === 6);
            node.setAttribute("aria-label", node.textContent.trim() + "，已修复" + cleared + "件，累计" + stars + "星");
        }
    }

    function initHomeProgress() {
        if (!window.FeiyiProgress) return;

        var progress = window.FeiyiProgress.loadProgress();
        var totalCleared = 0;
        var totalStars = 0;

        Object.keys(chapters).forEach(function (chapter) {
            var ids = chapters[chapter];
            var cleared = countCleared(progress, ids);
            var stars = countStars(progress, ids);
            totalCleared += cleared;
            totalStars += stars;
            setChapterState(chapter, cleared, stars);
        });

        var totalClearEl = document.getElementById("home-progress-clear");
        var totalStarsEl = document.getElementById("home-progress-stars");
        if (totalClearEl) totalClearEl.textContent = String(totalCleared);
        if (totalStarsEl) totalStarsEl.textContent = totalStars + " ★";
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomeProgress, { once: true });
    } else {
        initHomeProgress();
    }
})();
