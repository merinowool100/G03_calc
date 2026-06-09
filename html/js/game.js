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
  let isPainting = false;
  let paintMode = true;

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

  function cellKey(row, col) {
    return `${row},${col}`;
  }

  function clearPaintedCells() {
    paintedCells.clear();
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

  function renderImagetoreGrid() {
    if (!isImagetore) return;
    const sz = canvas.width;
    const cell = sz / GRID_COUNT;
    context.clearRect(0, 0, sz, sz);
    context.fillStyle = "rgba(255, 150, 0, 0.5)";
    paintedCells.forEach((key) => {
      const [row, col] = key.split(",").map(Number);
      context.fillRect(col * cell + 1, row * cell + 1, cell - 2, cell - 2);
    });
    drawGridLines();
  }

  function renderGuide() {
    if (!isImagetore) return;
    paintedCells.clear();
    renderImagetoreGrid();
  }

  function getCellFromPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x / rect.width) * GRID_COUNT);
    const row = Math.floor((y / rect.height) * GRID_COUNT);
    if (row < 0 || row >= GRID_COUNT || col < 0 || col >= GRID_COUNT) {
      return null;
    }
    return { row, col };
  }

  function applyPaintAt(row, col) {
    const key = cellKey(row, col);
    if (paintMode) {
      paintedCells.add(key);
    } else {
      paintedCells.delete(key);
    }
    renderImagetoreGrid();
  }

  function handlePointerDown(event) {
    if (!isImagetore || !isStarted || isEnd) return;
    const point = event.touches ? event.touches[0] : event;
    const cell = getCellFromPointer(point.clientX, point.clientY);
    if (!cell) return;
    event.preventDefault();
    isPainting = true;
    paintMode = !paintedCells.has(cellKey(cell.row, cell.col));
    applyPaintAt(cell.row, cell.col);
  }

  function handlePointerMove(event) {
    if (!isPainting || !isImagetore || !isStarted || isEnd) return;
    const point = event.touches ? event.touches[0] : event;
    const cell = getCellFromPointer(point.clientX, point.clientY);
    if (!cell) return;
    event.preventDefault();
    applyPaintAt(cell.row, cell.col);
  }

  function handlePointerUp() {
    isPainting = false;
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
    const minC = Math.min(...cells.map((c) => c.c));
    const maxC = Math.max(...cells.map((c) => c.c));
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
    el("remainingDisplay").textContent = String(
      problems.length - currentProblemIndex,
    );
    if (isImagetore) {
      clearPaintedCells();
      renderImagetoreGrid();
    }
  }

  function appendNumber(numStr) {
    if (!isStarted || isImagetore) return;
    el("answerInput").value += numStr;
  }

  function showFeedback(isCorrect) {
    const feedback = el("feedback");
    feedback.textContent = isCorrect ? "Correct" : "Wrong";
    feedback.style.color = isCorrect ? "green" : "red";
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
        el("remainingDisplay").textContent = "0";
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
    const td = el("timer-display");
    if (td) td.textContent = formatTimerDisplay(ticks);
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
    el("remainingDisplay").textContent = String(problemCount);
    const td = el("timer-display");
    if (td) td.textContent = "00:00:00";
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
      canvas.addEventListener("mousedown", handlePointerDown);
      canvas.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      canvas.addEventListener("touchstart", handlePointerDown, {
        passive: false,
      });
      canvas.addEventListener("touchmove", handlePointerMove, {
        passive: false,
      });
      canvas.addEventListener("touchend", handlePointerUp);
      canvas.addEventListener("touchcancel", handlePointerUp);
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
      const canvasHost = document.getElementById("canvas-container");
      if (canvasHost) canvasHost.hidden = true;
    }

    displayBestRecord(readBest());
    updateToggleButton();
    wireUi();
  }

  window.addEventListener("load", init);
})();
