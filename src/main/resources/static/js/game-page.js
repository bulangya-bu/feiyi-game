(function () {
    const page = document.body;
    const levelId = Number(page.dataset.levelId);

    const titleElement = document.getElementById("level-title");
    const subtitleElement = document.getElementById("level-subtitle");
    const difficultyElement = document.getElementById("level-difficulty");
    const gridElement = document.getElementById("level-grid");
    const timerElement = document.getElementById("timer-display");
    const locationElement = document.getElementById("level-location");
    const descriptionElement = document.getElementById("level-description");
    const featuresElement = document.getElementById("level-features");
    const cultureElement = document.getElementById("level-culture");
    const factElement = document.getElementById("level-fact");
    const boardElement = document.getElementById("puzzle-board");
    const progressElement = document.getElementById("progress-count");
    const moveCountElement = document.getElementById("move-count");
    const selectionHintElement = document.getElementById("selection-hint");
    const inspectorImage = document.getElementById("inspector-image");
    const referenceOverlay = document.getElementById("reference-overlay");
    const referenceImage = document.getElementById("reference-image");

    const modalElement = document.getElementById("result-modal");
    const failModalElement = document.getElementById("fail-modal");

    const difficultyLabels = {
        easy: "简单",
        medium: "中等",
        hard: "困难"
    };

    let level = null;
    let tiles = [];
    let remainingSeconds = 0;
    let timerId = null;
    let selectedSlot = null;
    let dragSourceSlot = null;
    let moveCount = 0;
    let gameLocked = true;

    async function fetchLevel() {
        const response = await fetch(`/api/levels/${levelId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch level");
        }
        return response.json();
    }

    function buildInitialTiles(total) {
        const values = Array.from({length: total}, (_, index) => index);

        do {
            for (let currentIndex = values.length - 1; currentIndex > 0; currentIndex -= 1) {
                const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
                [values[currentIndex], values[randomIndex]] = [values[randomIndex], values[currentIndex]];
            }
        } while (values.every((value, index) => value === index));

        return values;
    }

    function formatDifficulty(difficulty) {
        return difficultyLabels[difficulty] || difficulty;
    }

    function updateMetadata() {
        titleElement.textContent = level.title;
        subtitleElement.textContent = level.subtitle;
        difficultyElement.textContent = formatDifficulty(level.difficulty);
        gridElement.textContent = `${level.rows} x ${level.cols}`;
        locationElement.textContent = level.location;
        descriptionElement.textContent = level.description;
        featuresElement.textContent = level.features;
        cultureElement.textContent = level.culture;
        factElement.textContent = level.fact;
        inspectorImage.src = level.coverImage;
        referenceImage.src = level.sourceImage;
    }

    function updateTimer() {
        timerElement.textContent = window.FeiyiProgress.formatSeconds(remainingSeconds);
    }

    function updateBoardProgress() {
        const correctCount = tiles.filter((value, index) => value === index).length;
        progressElement.textContent = `${correctCount} / ${tiles.length}`;
        moveCountElement.textContent = String(moveCount);
    }

    function clearSelection() {
        selectedSlot = null;
        selectionHintElement.textContent = "选择任意两块交换，或直接拖拽。";
        document.querySelectorAll(".puzzle-tile.is-selected").forEach((tile) => {
            tile.classList.remove("is-selected");
        });
    }

    function renderBoard() {
        boardElement.innerHTML = "";
        boardElement.style.gridTemplateColumns = `repeat(${level.cols}, minmax(0, 1fr))`;

        tiles.forEach((tileIndex, slotIndex) => {
            const correctRow = Math.floor(tileIndex / level.cols);
            const correctCol = tileIndex % level.cols;
            const tile = document.createElement("button");
            tile.type = "button";
            tile.className = "puzzle-tile";
            tile.dataset.order = String(slotIndex + 1);
            tile.style.backgroundImage = `url('${level.sourceImage}')`;
            tile.style.backgroundSize = `${level.cols * 100}% ${level.rows * 100}%`;
            tile.style.backgroundPosition = `${(correctCol / Math.max(level.cols - 1, 1)) * 100}% ${(correctRow / Math.max(level.rows - 1, 1)) * 100}%`;
            tile.draggable = true;

            if (tileIndex === slotIndex) {
                tile.classList.add("is-correct");
            }

            tile.addEventListener("click", () => handleTileClick(slotIndex));
            tile.addEventListener("dragstart", (event) => handleDragStart(event, slotIndex));
            tile.addEventListener("dragend", handleDragEnd);
            tile.addEventListener("dragover", handleDragOver);
            tile.addEventListener("dragenter", () => tile.classList.add("is-drop-target"));
            tile.addEventListener("dragleave", () => tile.classList.remove("is-drop-target"));
            tile.addEventListener("drop", (event) => handleDrop(event, slotIndex));

            boardElement.appendChild(tile);
        });

        updateBoardProgress();
    }

    function swapTiles(leftIndex, rightIndex) {
        [tiles[leftIndex], tiles[rightIndex]] = [tiles[rightIndex], tiles[leftIndex]];
        moveCount += 1;
        clearSelection();
        renderBoard();
        checkCompletion();
    }

    function handleTileClick(slotIndex) {
        if (gameLocked) {
            return;
        }

        const tileElements = document.querySelectorAll(".puzzle-tile");

        if (selectedSlot === null) {
            selectedSlot = slotIndex;
            tileElements[slotIndex].classList.add("is-selected");
            selectionHintElement.textContent = "已选中一块，再点另一块即可交换。";
            return;
        }

        if (selectedSlot === slotIndex) {
            clearSelection();
            return;
        }

        swapTiles(selectedSlot, slotIndex);
    }

    function handleDragStart(event, slotIndex) {
        if (gameLocked) {
            event.preventDefault();
            return;
        }

        dragSourceSlot = slotIndex;
        event.dataTransfer.effectAllowed = "move";
        event.currentTarget.classList.add("is-dragging");
        clearSelection();
    }

    function handleDragEnd(event) {
        dragSourceSlot = null;
        event.currentTarget.classList.remove("is-dragging");
        document.querySelectorAll(".puzzle-tile.is-drop-target").forEach((tile) => {
            tile.classList.remove("is-drop-target");
        });
    }

    function handleDragOver(event) {
        if (gameLocked) {
            return;
        }
        event.preventDefault();
    }

    function handleDrop(event, slotIndex) {
        if (gameLocked) {
            return;
        }

        event.preventDefault();
        event.currentTarget.classList.remove("is-drop-target");

        if (dragSourceSlot === null || dragSourceSlot === slotIndex) {
            return;
        }

        swapTiles(dragSourceSlot, slotIndex);
    }

    function hideModal(modal) {
        modal.hidden = true;
    }

    function showModal(modal) {
        modal.hidden = false;
    }

    function stopTimer() {
        if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
        }
    }

    function handleTimeUp() {
        gameLocked = true;
        stopTimer();
        showModal(failModalElement);
    }

    function startTimer() {
        stopTimer();
        updateTimer();

        timerId = window.setInterval(() => {
            remainingSeconds -= 1;
            updateTimer();

            if (remainingSeconds <= 0) {
                remainingSeconds = 0;
                updateTimer();
                handleTimeUp();
            }
        }, 1000);
    }

    function fillResultModal(stars, elapsedSeconds) {
        document.getElementById("modal-title").textContent = level.title;
        document.getElementById("modal-summary").textContent = level.description;
        document.getElementById("modal-stars").textContent = "★".repeat(stars);
        document.getElementById("modal-time-left").textContent = window.FeiyiProgress.formatSeconds(remainingSeconds);
        document.getElementById("modal-elapsed").textContent = `${elapsedSeconds} 秒`;
        document.getElementById("modal-features").textContent = level.features;
        document.getElementById("modal-culture").textContent = level.culture;
        document.getElementById("modal-fact").textContent = level.fact;
    }

    function checkCompletion() {
        const solved = tiles.every((value, index) => value === index);
        if (!solved) {
            return;
        }

        gameLocked = true;
        stopTimer();

        const elapsedSeconds = level.timeLimitSeconds - remainingSeconds;
        const result = window.FeiyiProgress.markLevelCleared(level, remainingSeconds, elapsedSeconds);
        fillResultModal(result.stars, elapsedSeconds);
        showModal(modalElement);
    }

    function restartLevel() {
        hideModal(modalElement);
        hideModal(failModalElement);
        hideReference();

        const totalTiles = level.rows * level.cols;
        tiles = buildInitialTiles(totalTiles);
        remainingSeconds = level.timeLimitSeconds;
        selectedSlot = null;
        moveCount = 0;
        gameLocked = false;

        renderBoard();
        updateTimer();
        clearSelection();
        startTimer();
    }

    function showReference() {
        referenceOverlay.hidden = false;
    }

    function hideReference() {
        referenceOverlay.hidden = true;
    }

    function registerEvents(levelsCount) {
        document.getElementById("restart-button").addEventListener("click", restartLevel);
        document.getElementById("retry-button").addEventListener("click", restartLevel);
        document.getElementById("retry-fail-button").addEventListener("click", restartLevel);
        document.getElementById("preview-button").addEventListener("click", showReference);
        document.getElementById("close-preview").addEventListener("click", hideReference);
        referenceOverlay.addEventListener("click", (event) => {
            if (event.target === referenceOverlay) {
                hideReference();
            }
        });

        document.getElementById("next-button").addEventListener("click", () => {
            const nextId = level.id < levelsCount ? level.id + 1 : 1;
            window.location.href = `/game/${nextId}`;
        });
    }

    async function init() {
        try {
            const [currentLevel, allLevels] = await Promise.all([
                fetchLevel(),
                fetch("/api/levels").then((response) => response.json())
            ]);

            level = currentLevel;
            updateMetadata();
            registerEvents(allLevels.length);
            restartLevel();
        } catch (error) {
            gameLocked = true;
            titleElement.textContent = "关卡加载失败";
            subtitleElement.textContent = "请返回选关页后重新进入。";
            selectionHintElement.textContent = "当前无法开始拼图。";
        }
    }

    init();
})();
