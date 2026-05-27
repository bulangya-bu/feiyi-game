(function () {
    const STORAGE_KEY = "feiyi-game-progress-v1";

    function createDefaultProgress() {
        return {
            clearedLevels: [],
            bestTimes: {},
            bestStars: {}
        };
    }

    function normalizeProgress(raw) {
        const progress = createDefaultProgress();

        if (!raw || typeof raw !== "object") {
            return progress;
        }

        progress.clearedLevels = Array.isArray(raw.clearedLevels)
            ? raw.clearedLevels.filter(Number.isInteger)
            : [];

        progress.bestTimes = raw.bestTimes && typeof raw.bestTimes === "object"
            ? raw.bestTimes
            : {};

        progress.bestStars = raw.bestStars && typeof raw.bestStars === "object"
            ? raw.bestStars
            : {};

        return progress;
    }

    function loadProgress() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            return normalizeProgress(raw ? JSON.parse(raw) : null);
        } catch (error) {
            return createDefaultProgress();
        }
    }

    function saveProgress(progress) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }

    function formatSeconds(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function computeStars(level, secondsLeft) {
        const ratio = level.timeLimitSeconds <= 0 ? 0 : secondsLeft / level.timeLimitSeconds;
        if (ratio >= 0.45) {
            return 3;
        }
        if (ratio >= 0.2) {
            return 2;
        }
        return 1;
    }

    function markLevelCleared(level, secondsLeft, elapsedSeconds) {
        const progress = loadProgress();
        const levelId = String(level.id);
        const stars = computeStars(level, secondsLeft);

        if (!progress.clearedLevels.includes(level.id)) {
            progress.clearedLevels.push(level.id);
            progress.clearedLevels.sort((left, right) => left - right);
        }

        if (!(levelId in progress.bestTimes) || elapsedSeconds < progress.bestTimes[levelId]) {
            progress.bestTimes[levelId] = elapsedSeconds;
        }

        if (!(levelId in progress.bestStars) || stars > progress.bestStars[levelId]) {
            progress.bestStars[levelId] = stars;
        }

        saveProgress(progress);

        return {
            progress,
            stars,
            bestTime: progress.bestTimes[levelId],
            bestStars: progress.bestStars[levelId]
        };
    }

    window.FeiyiProgress = {
        loadProgress,
        saveProgress,
        formatSeconds,
        computeStars,
        markLevelCleared
    };
})();
