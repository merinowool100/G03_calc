(function () {
  const GAME_MODES = window.GAME_MODES;
  const GRID_COUNT = 10;

  const params = new URLSearchParams(window.location.search);
  const modeId = params.get("mode") || "imagetore";
  const def = GAME_MODES[modeId] || GAME_MODES.imagetore;
  const isImagetore = def.type === "imagetore";

  const problems = [];
  let currentProblemIndex = 0;
  let isStarted = false;
  let isEnd = false;
  let timerInterval = null;
  let ticks = 0;
  let paintedCells = new Set();
  let dragPreviewCells = new Set();
  let isPainting = false;
  let dragStartCell = null;

  const canvas = document.querySelector(".canvas");
  const context = canvas.getContext("2d");
  const el = (id) => document.getElementById(id);
  const problemCount = def.problemCount || 10;

  function updateToggleButton() {
    const button = el("toggleStartButton");
    if (!button) return;
    if (isStarted) {
      button.textContent = "Reset";
      button.classList.add("is-reset");
    } else {
      button.textContent = "Start";
      button.classList.remove("is-reset");
    }
  }

  function formatTimerDisplay(t) {
    const minutes = Math.floor((t % 360000) / 6000);
    const seconds = Math.floor((t % 6000) / 100);
    const hundredths = t % 100;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
  }

  function readBest() {
    const raw = localStorage.getItem(def.storageKey);
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function writeBestIfBetter(current) {
    const prev = readBest();
    if (current < prev || prev === 0) {
      localStorage.setItem(def.storageKey, String(current));
      return current;
    }
    return prev;
  }

  function displayBestRecord(value) {
    const br = el("best-record");
    if (br) br.textContent = `Best: ${formatTimerDisplay(Number(value) || 0)}`;
  }

  function setRemainingDisplay(value) {
    const text = String(value);
    const remaining = el("remainingDisplay");
    const calcRemaining = el("calc-remaining");
    if (remaining) remaining.textContent = text;
    if (calcRemaining) calcRemaining.textContent = text;
  }

  function setTimerDisplay(value) {
    const text = formatTimerDisplay(value);
    const timer = el("timer-display");
    const calcTimer = el("calc-timer-display");
    if (timer) timer.textContent = text;
    if (calcTimer) calcTimer.textContent = text;
  }

  function cellKey(row, col) {
    return `${row},${col}`;
  }

  function clearPaintedCells() {
    paintedCells.clear();
    dragPreviewCells.clear();
    dragStartCell = null;
    isPainting = false;
  }

  function syncCanvasSize() {
    const container = document.getElementById("canvas-container");
    if (!container || !isImagetore) return;
    const cs = getComputedStyle(container);
    const padX =
      (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    const padY =
      (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    const innerW = Math.max(0, container.clientWidth - padX);
    const innerH = Math.max(0, container.clientHeight - padY);
    const fromBox =
      innerW > 0 && innerH > 0
        ? Math.min(innerW, innerH)
        : Math.max(innerW, innerH);
    const fallback = Math.min(
      window.innerWidth - 16,
      window.innerHeight * 0.55,
    );
    const size = Math.max(
      200,
      Math.floor(fromBox > 0 ? fromBox : container.clientWidth || fallback),
    );
    canvas.width = size;
    canvas.height = size;
    renderImagetoreGrid();
  }

  function drawGridLines() {
    const sz = canvas.width;
    const cell = sz / GRID_COUNT;
    context.strokeStyle = "#bbbbbb";
    context.lineWidth = 1;
    for (let i = 0; i <= GRID_COUNT; i++) {
      context.beginPath();
      context.moveTo(0, i * cell);
      context.lineTo(sz, i * cell);
      context.moveTo(i * cell, 0);
      context.lineTo(i * cell, sz);
      context.stroke();
    }
    context.strokeStyle = "#333";
    context.lineWidth = 3;
    context.strokeRect(0.5, 0.5, sz - 1, sz - 1);
  }

  function fillCellsOnCanvas(cells, color) {
    const sz = canvas.width;
    const cell = sz / GRID_COUNT;
    context.fillStyle = color;
    cells.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      context.fillRect(col * cell, row * cell, cell, cell);
    });
  }

  function rectCellKeys(row1, col1, row2, col2) {
    const minR = Math.min(row1, row2);
    const maxR = Math.max(row1, row2);
    const minC = Math.min(col1, col2);
    const maxC = Math.max(col1, col2);
    const keys = new Set();
    for (let row = minR; row <= maxR; row++) {
      for (let col = minC; col <= maxC; col++) {
        keys.add(cellKey(row, col));
      }
    }
    return keys;
  }

  function renderImagetoreGrid() {
    if (!isImagetore) return;
    const sz = canvas.width;
    context.clearRect(0, 0, sz, sz);
    drawGridLines();
    fillCellsOnCanvas(paintedCells, "rgba(255, 150, 0, 0.62)");
    if (isPainting && dragPreviewCells.size > 0) {
      fillCellsOnCanvas(dragPreviewCells, "rgba(255, 150, 0, 0.38)");
    }
  }

  function renderGuide() {
    if (!isImagetore) return;
    paintedCells.clear();
    renderImagetoreGrid();
  }

  function getCellFromPointer(clientX, clientY, clampToEdge = false) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    let x = clientX - rect.left;
    let y = clientY - rect.top;
    const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
    if (!inside && !clampToEdge) return null;

    x = Math.max(0, Math.min(x, rect.width - 0.001));
    y = Math.max(0, Math.min(y, rect.height - 0.001));

    const col = Math.min(
      GRID_COUNT - 1,
      Math.floor((x / rect.width) * GRID_COUNT),
    );
    const row = Math.min(
      GRID_COUNT - 1,
      Math.floor((y / rect.height) * GRID_COUNT),
    );
    return { row, col };
  }

  function updateDragPreview(endCell) {
    if (!dragStartCell || !endCell) return;
    dragPreviewCells = rectCellKeys(
      dragStartCell.row,
      dragStartCell.col,
      endCell.row,
      endCell.col,
    );
    renderImagetoreGrid();
  }

  function finishDrag() {
    if (!isImagetore || !isPainting) return;
    isPainting = false;
    if (dragPreviewCells.size > 0) {
      paintedCells = new Set(dragPreviewCells);
    }
    dragPreviewCells = new Set();
    dragStartCell = null;
    renderImagetoreGrid();
  }

  function handlePointerDown(event) {
    if (!isImagetore || !isStarted || isEnd) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const cell = getCellFromPointer(event.clientX, event.clientY);
    if (!cell) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    isPainting = true;
    dragStartCell = cell;
    paintedCells.clear();
    updateDragPreview(cell);
  }

  function handlePointerMove(event) {
    if (!isPainting || !dragStartCell || !isImagetore || !isStarted || isEnd) {
      return;
    }
    const cell = getCellFromPointer(event.clientX, event.clientY, true);
    if (!cell) return;
    event.preventDefault();
    updateDragPreview(cell);
  }

  function handlePointerUp(event) {
    if (!isImagetore) return;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    if (isPainting) {
      const cell = getCellFromPointer(event.clientX, event.clientY, true);
      if (cell) updateDragPreview(cell);
      finishDrag();
    }
  }

  function isValidRectangle(a, b) {
    const count = paintedCells.size;
    if (count !== a * b) return false;

    const cells = [...paintedCells].map((key) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col };
    });
    const minR = Math.min(...cells.map((c) => c.row));
    const maxR = Math.max(...cells.map((c) => c.row));
    const minC = Math.min(...cells.map((c) => c.col));
    const maxC = Math.max(...cells.map((c) => c.col));
    const height = maxR - minR + 1;
    const width = maxC - minC + 1;

    if (height * width !== count) return false;

    for (let row = minR; row <= maxR; row++) {
      for (let col = minC; col <= maxC; col++) {
        if (!paintedCells.has(cellKey(row, col))) return false;
      }
    }

    return (height === a && width === b) || (height === b && width === a);
  }

  function showProblem() {
    if (problems.length === 0 || currentProblemIndex >= problems.length) return;
    const currentProblem = problems[currentProblemIndex];
    const suffix = isImagetore ? "" : " =";
    el("problemDisplay").textContent = `${currentProblem.question}${suffix}`;
    setRemainingDisplay(problems.length - currentProblemIndex);
    if (isImagetore) {
      clearPaintedCells();
      renderImagetoreGrid();
    }
  }

  function appendNumber(numStr) {
    if (!isStarted || isImagetore) return;
    el("answerInput").value += numStr;
  }

  function getFeedbackEl() {
    return isImagetore ? el("feedback") : el("feedback-calc");
  }

  function showFeedback(isCorrect) {
    const feedback = getFeedbackEl();
    if (!feedback) return;
    feedback.classList.remove(
      "feedback-mark--correct",
      "feedback-mark--wrong",
      "feedback-text",
    );
    if (isImagetore) {
      feedback.textContent = isCorrect ? "Correct" : "Wrong";
      feedback.classList.add("feedback-text");
      feedback.style.color = isCorrect ? "green" : "red";
    } else {
      feedback.textContent = isCorrect ? "○" : "×";
      feedback.classList.add(
        isCorrect ? "feedback-mark--correct" : "feedback-mark--wrong",
      );
      feedback.style.color = "";
    }
    feedback.style.display = "block";
    feedback.classList.remove("hidden");

    setTimeout(() => {
      feedback.classList.add("hidden");
      feedback.style.display = "none";
      if (!isStarted || problems.length === 0) return;
      const allAnswered = isCorrect && currentProblemIndex >= problems.length;
      if (allAnswered) {
        isEnd = true;
        el("problemDisplay").textContent = "";
        setRemainingDisplay(0);
        screenLock();
        const best = writeBestIfBetter(ticks);
        displayBestRecord(best);
      } else {
        showProblem();
      }
    }, 300);
  }

  function checkAnswer() {
    if (!isStarted || problems.length === 0) return;
    const currentProblem = problems[currentProblemIndex];

    if (isImagetore) {
      const a = currentProblem.factorA;
      const b = currentProblem.factorB;
      if (isValidRectangle(a, b)) {
        currentProblemIndex++;
        showFeedback(true);
      } else {
        const incorrectProblem = problems.splice(currentProblemIndex, 1)[0];
        problems.push(incorrectProblem);
        showFeedback(false);
      }
      return;
    }

    const userAnswer = parseInt(el("answerInput").value, 10);
    if (Number.isNaN(userAnswer)) {
      showFeedback(false);
      return;
    }
    if (userAnswer === currentProblem.answer) {
      currentProblemIndex++;
      showFeedback(true);
    } else {
      const incorrectProblem = problems.splice(currentProblemIndex, 1)[0];
      problems.push(incorrectProblem);
      showFeedback(false);
    }
    el("answerInput").value = "";
  }

  function updateTimer() {
    setTimerDisplay(ticks);
  }

  function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (isEnd) {
        clearInterval(timerInterval);
      } else {
        ticks++;
        updateTimer();
      }
    }, 10);
  }

  function createLockScreen(messageText, bgColor) {
    const lockScreen = document.createElement("div");
    lockScreen.id = "screenLock";
    Object.assign(lockScreen.style, {
      height: "100%",
      left: "0px",
      position: "fixed",
      top: "0px",
      width: "100%",
      zIndex: "9999",
      opacity: "0.8",
      backgroundColor: "rgba(0,0,0,0.5)",
    });

    const message = document.createElement("div");
    message.textContent = messageText;
    Object.assign(message.style, {
      color: "white",
      fontSize: "36px",
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      whiteSpace: "nowrap",
      backgroundColor: bgColor,
      padding: "10px 20px",
      borderRadius: "8px",
    });
    lockScreen.appendChild(message);

    const retryButton = document.createElement("button");
    retryButton.textContent = "Retry";
    Object.assign(retryButton.style, {
      position: "absolute",
      top: "60%",
      left: "50%",
      transform: "translateX(-50%)",
      fontSize: "20px",
    });
    retryButton.addEventListener("click", () => window.location.reload());
    lockScreen.appendChild(retryButton);
    return lockScreen;
  }

  function screenLock() {
    const prev = readBest();
    const isNewRecord = prev === 0 || ticks < prev;
    document.body.appendChild(
      createLockScreen(
        isNewRecord ? "New record!!" : "Well done!!",
        isNewRecord ? "rgba(0,255,0,0.5)" : "rgba(255,0,0,0.5)",
      ),
    );
    updateToggleButton();
  }

  function resetGame() {
    clearInterval(timerInterval);
    timerInterval = null;
    isStarted = false;
    isEnd = false;
    ticks = 0;
    currentProblemIndex = 0;
    problems.length = 0;
    el("answerInput").value = "";
    el("problemDisplay").textContent = "";
    setRemainingDisplay(problemCount);
    setTimerDisplay(0);
    renderGuide();
    const lock = document.getElementById("screenLock");
    if (lock) lock.remove();
    displayBestRecord(readBest());
    updateToggleButton();
  }

  function wireUi() {
    el("clearButton").addEventListener("click", () => {
      if (isImagetore) {
        clearPaintedCells();
        renderImagetoreGrid();
      } else {
        el("answerInput").value = "";
      }
    });

    el("submitAnswerButton").addEventListener("click", () => {
      if (isStarted) checkAnswer();
    });

    document.getElementById("numberButtons").addEventListener("click", (e) => {
      const btn = e.target.closest(".numbtn");
      if (!btn || !isStarted || isImagetore) return;
      const digit = btn.id.startsWith("btn") ? btn.id.slice(3) : "";
      if (/^\d$/.test(digit)) appendNumber(digit);
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (!isStarted || isImagetore) return;
        if (event.key >= "0" && event.key <= "9") {
          event.preventDefault();
          appendNumber(event.key);
        } else if (event.key === "Backspace") {
          event.preventDefault();
          el("answerInput").value = el("answerInput").value.slice(0, -1);
        } else if (event.key === "Enter") {
          event.preventDefault();
          checkAnswer();
        } else if (event.key === "Delete") {
          event.preventDefault();
          el("answerInput").value = "";
        }
      },
      true,
    );

    el("toggleStartButton").addEventListener("click", () => {
      if (isStarted) {
        resetGame();
        return;
      }
      isStarted = true;
      isEnd = false;
      updateToggleButton();
      startTimer();
      problems.length = 0;
      def.createProblems(problems);
      currentProblemIndex = 0;
      showProblem();
      el("toggleStartButton").blur();
      if (!isImagetore) {
        el("answerInput").focus({ preventScroll: true });
      }
    });

    el("back").addEventListener("click", () => {
      window.location.href = "../index.html";
    });

    if (isImagetore) {
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerUp);
    }
  }

  function init() {
    document.documentElement.dataset.playMode = def.type;
    document.documentElement.dataset.modeId = modeId;
    document.title = def.label;
    const topSpan = document.querySelector("#top span");
    if (topSpan) topSpan.textContent = def.label;
    if (el("nokori") && def.remnantLabel) {
      el("nokori").textContent = def.remnantLabel;
    }
    if (el("calc-nokori")) {
      el("calc-nokori").textContent = "残り";
    }
    setRemainingDisplay(problemCount);
    setTimerDisplay(0);

    if (isImagetore) {
      syncCanvasSize();
      requestAnimationFrame(syncCanvasSize);
      const canvasHost = document.getElementById("canvas-container");
      if (canvasHost && typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => syncCanvasSize());
        ro.observe(canvasHost);
      }
      window.addEventListener("resize", () => syncCanvasSize());
    } else {
      const leftContainer = document.getElementById("left-container");
      if (leftContainer) leftContainer.hidden = true;
    }

    displayBestRecord(readBest());
    updateToggleButton();
    wireUi();
  }

  window.addEventListener("load", init);
})();
