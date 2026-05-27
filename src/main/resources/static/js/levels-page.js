(function () {
    var listElement = document.getElementById("level-list");
    var progressClear = document.getElementById("progress-clear");
    var progressTotal = document.getElementById("progress-total");
    var progressStars = document.getElementById("progress-stars");
    var progressBest = document.getElementById("progress-best");

    var difficultyLabels = {
        easy: "简单",
        medium: "中等",
        hard: "困难"
    };

    var chapterNames = {
        building: "建筑",
        painting: "画作",
        craft: "手工"
    };

    var chapterLabels = {
        building: "建筑卷",
        painting: "画作卷",
        craft: "手工卷"
    };

    var chapterOfLevel = {};
    var allLevels = [];

    var activeChapter = "building";

    function getChapterFromLevelId(id) {
        if (id >= 1 && id <= 6) return "building";
        if (id >= 7 && id <= 12) return "painting";
        if (id >= 13 && id <= 18) return "craft";
        return "building";
    }

    function filterLevelsByChapter(chapter) {
        return allLevels.filter(function (level) {
            return getChapterFromLevelId(level.id) === chapter;
        });
    }

    function updateTabButtons() {
        document.querySelectorAll("[data-chapter]").forEach(function (btn) {
            var isActive = btn.dataset.chapter === activeChapter;
            btn.classList.toggle("catalog-tab--active", isActive);
        });
    }

    function updateChapterHeader() {
        var header = document.querySelector(".catalog-header__title");
        var lead = document.querySelector(".catalog-header__lead");
        if (header) header.textContent = chapterLabels[activeChapter] || "图录";
        var counts = {
            building: { total: 6, names: "戏楼、牌楼、鼓楼、木塔、土楼、古桥" },
            painting: { total: 6, names: "山水、花鸟、仕女、鞍马、罗汉、界画" },
            craft: { total: 6, names: "剪纸、刺绣、陶瓷、漆器、竹编、泥塑" }
        };
        var c = counts[activeChapter];
        if (lead && c) {
            lead.textContent = c.names + "——" + c.total + "件作品已入卷。选择一件，在修复台上拼回原貌。";
        }
    }

    // 中文序号
    var cnNumbers = ["", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖", "拾"];

    function getLocalCn(id, chapter) {
        var chapterLevels = filterLevelsByChapter(chapter);
        var idx = chapterLevels.findIndex(function (l) { return l.id === id; });
        return cnNumbers[idx + 1] || String(idx + 1);
    }

    async function fetchLevels() {
        var response = await fetch("/api/levels");
        if (!response.ok) throw new Error("Failed to fetch levels");
        return response.json();
    }

    function renderProgress(levels, progress) {
        var clearedCount = levels.filter(function (l) {
            return progress.clearedLevels.includes(l.id);
        }).length;
        progressClear.textContent = String(clearedCount);
        progressTotal.textContent = String(levels.length);

        var totalStars = levels.reduce(function (sum, l) {
            return sum + Number(progress.bestStars[String(l.id)] || 0);
        }, 0);
        progressStars.textContent = String(totalStars);

        var bestTimes = levels.map(function (l) {
            return progress.bestTimes[String(l.id)];
        }).filter(Boolean).map(Number);
        progressBest.textContent = bestTimes.length
            ? window.FeiyiProgress.formatSeconds(Math.min.apply(null, bestTimes))
            : "--";
    }

    function renderLevels(levels) {
        var progress = window.FeiyiProgress.loadProgress();
        renderProgress(levels, progress);

        listElement.innerHTML = levels.map(function (level, index) {
            var cleared = progress.clearedLevels.includes(level.id);
            var bestTime = progress.bestTimes[String(level.id)];
            var bestStars = progress.bestStars[String(level.id)] || 0;
            var cn = getLocalCn(level.id, activeChapter);
            var delay = Math.min(index * 80, 400);

            return '<article class="catalog-entry" data-reveal="soft" style="--reveal-delay:' + delay + 'ms;">' +
                '<div class="catalog-entry__image">' +
                    '<img src="' + level.coverImage + '" alt="' + level.title + '">' +
                '</div>' +
                '<div class="catalog-entry__body">' +
                    '<div class="catalog-entry__head">' +
                        '<span class="catalog-entry__index">' + cn + '</span>' +
                        '<h2 class="catalog-entry__title">' + level.title + '</h2>' +
                        (cleared ? '<span class="seal-mark" title="已通关">通</span>' : '') +
                    '</div>' +
                    '<p class="catalog-entry__subtitle">' + level.subtitle + '</p>' +
                    '<div class="catalog-entry__meta">' +
                        '<span class="catalog-entry__tag">' + level.location + '</span>' +
                        '<span class="catalog-entry__tag">' + (difficultyLabels[level.difficulty] || level.difficulty) + '</span>' +
                        '<span class="catalog-entry__tag">' + level.rows + '×' + level.cols + '</span>' +
                        '<span class="catalog-entry__tag">' + window.FeiyiProgress.formatSeconds(level.timeLimitSeconds) + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="catalog-entry__action">' +
                    '<a class="button button--primary" href="/game/' + level.id + '">入卷</a>' +
                    '<div class="catalog-entry__record">' +
                        '<div>最佳 ' + (bestTime ? window.FeiyiProgress.formatSeconds(bestTime) : "--") + '</div>' +
                        '<div>评级 ' + (bestStars ? "★".repeat(bestStars) : "--") + '</div>' +
                    '</div>' +
                '</div>' +
            '</article>';
        }).join("");

        if (window.FeiyiPageEffects) {
            window.FeiyiPageEffects.refresh(listElement);
        }
    }

    function switchChapter(chapter) {
        activeChapter = chapter;
        updateTabButtons();
        updateChapterHeader();
        var filtered = filterLevelsByChapter(chapter);
        renderLevels(filtered);
    }

    function bindTabs() {
        document.querySelectorAll("[data-chapter]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var chapter = btn.dataset.chapter;
                if (chapter !== activeChapter) {
                    switchChapter(chapter);
                    // Update URL without page reload
                    var url = new URL(window.location);
                    url.searchParams.set("chapter", chapter);
                    window.history.replaceState(null, "", url.toString());
                }
            });
        });
    }

    function getInitialChapter() {
        var params = new URLSearchParams(window.location.search);
        var chapter = params.get("chapter");
        if (chapter && ["building", "painting", "craft"].indexOf(chapter) !== -1) {
            return chapter;
        }
        return "building";
    }

    async function init() {
        listElement.innerHTML = '<div class="catalog-entry--empty">正在展开图录...</div>';

        try {
            allLevels = await fetchLevels();
            activeChapter = getInitialChapter();
            updateTabButtons();
            updateChapterHeader();
            bindTabs();
            var filtered = filterLevelsByChapter(activeChapter);
            renderLevels(filtered);
        } catch (error) {
            listElement.innerHTML = '<div class="catalog-entry--empty">图录加载失败，请刷新页面重试。</div>';
        }
    }

    init();
})();
