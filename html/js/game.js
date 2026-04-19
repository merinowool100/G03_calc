(function () {
  const LEVEL_DEFS = window.LEVEL_DEFS;
  const problems = [];
  let currentProblemIndex = 0;
  let isStarted = false;
  let isEnd = false;
  let timerInterval = null;
  let ticks = 0;

  const params = new URLSearchParams(window.location.search);
  let levelId = parseInt(params.get("level") || "1", 10);
  if (!LEVEL_DEFS[levelId]) levelId = 1;
  const def = LEVEL_DEFS[levelId];

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
    const keys = [def.storageKey, ...(def.legacyStorageKeys || [])];
    let best = 0;
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n) || n <= 0) continue;
      if (best === 0 || n < best) best = n;
    }
    return best;
  }

  function writeBestIfBetter(current) {
    const prev = readBest();
    if (current < prev || prev === 0) {
      localStorage.setItem(def.storageKey, String(current));
      return current;
    }
    if (prev > 0 && localStorage.getItem(def.storageKey) !== String(prev)) {
      localStorage.setItem(def.storageKey, String(prev));
    }
    return prev;
  }

  function displayBestRecord(value) {
    const br = el("best-record");
    if (br) br.textContent = `Best: ${formatTimerDisplay(Number(value) || 0)}`;
  }

  function parseQuestion(question) {
    const tokens = String(question).trim().split(/\s+/);
    const numbers = tokens.filter((token) => /^\d+$/.test(token)).map(Number);
    const operators = tokens.filter((token) => !/^\d+$/.test(token));
    return { tokens, numbers, operators };
  }

  function getVisualMode() {
    if (levelId <= 9) return "count";
    if (levelId <= 11) return "placevalue";
    if (levelId <= 15) return "column";
    if (levelId <= 21) return "multiply";
    return "divide";
  }

  function syncCanvasSize() {
    const container = document.getElementById("canvas-container");
    if (!container) return;
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
    if (
      isStarted &&
      problems.length > 0 &&
      currentProblemIndex < problems.length
    ) {
      const p = problems[currentProblemIndex];
      if (p) renderProblem(p);
      else renderGuide();
    } else {
      renderGuide();
    }
  }

  function drawCells(clearFirst = false, gridCount = null) {
    const sz = canvas.width;
    const count = gridCount || (def.grid === "5" ? 5 : 10);
    const gridSize = sz / count;
    if (clearFirst) context.clearRect(0, 0, sz, sz);

    for (let i = 0; i <= count; i++) {
      context.strokeStyle = "gray";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, i * gridSize);
      context.lineTo(sz, i * gridSize);
      context.moveTo(i * gridSize, 0);
      context.lineTo(i * gridSize, sz);
      context.stroke();
    }

    context.strokeStyle = "black";
    context.lineWidth = 3;
    context.beginPath();
    if (count === 5) {
      context.moveTo(2 * gridSize, 0);
      context.lineTo(2 * gridSize, sz);
      context.moveTo(4 * gridSize, 0);
      context.lineTo(4 * gridSize, sz);
    } else {
      context.moveTo(0, sz / 2);
      context.lineTo(sz, sz / 2);
      context.moveTo(sz / 2, 0);
      context.lineTo(sz / 2, sz);
    }
    context.stroke();
  }

  function fillCountRange(start, end, divisor, color) {
    const count = def.grid === "5" ? 5 : 10;
    const limit = count * divisor;
    const from = Math.max(0, Math.min(start, limit));
    const to = Math.max(from, Math.min(end, limit));
    const gridSize = canvas.width / count;
    context.fillStyle = color;
    for (let idx = from; idx < to; idx++) {
      const col = Math.floor(idx / divisor);
      const row = idx % divisor;
      context.fillRect(
        col * gridSize + 1,
        row * gridSize + 1,
        gridSize - 2,
        gridSize - 2,
      );
    }
  }

  function renderCountModel(problem = null) {
    drawCells(true);
    if (!problem) return;
    const divisor = def.motherMode === "10" ? 10 : 5;
    const count = def.grid === "5" ? 5 : 10;
    const value = Math.max(
      0,
      Math.min(
        typeof problem.visualMother === "number"
          ? problem.visualMother
          : problem.mother,
        count * divisor,
      ),
    );
    fillCountRange(0, value, divisor, "rgba(255,150,0,0.5)");
    if (levelId === 10 && value < 100) {
      fillCountRange(value, 100, divisor, "rgba(80,180,120,0.22)");
    }
    drawCells(false);
  }

  function unitBlockGap(size) {
    return Math.max(2, Math.floor(size * 0.18));
  }

  function placeValueRowFootprint(size) {
    const g = unitBlockGap(size);
    return { rowW: 5 * size + 4 * g, rowH: 2 * size + g };
  }

  function maxPlaceValueUnitSize(unitAreaW, sectionH, capSize) {
    let best = 6;
    const maxTry = Math.min(240, Math.floor(capSize), Math.floor(sectionH));
    for (let s = 6; s <= maxTry; s++) {
      const { rowW, rowH } = placeValueRowFootprint(s);
      if (rowW <= unitAreaW && rowH <= sectionH) best = s;
      else break;
    }
    return best;
  }

  function drawFiveByTwoUnits(count, x, y, size, color) {
    const gap = unitBlockGap(size);
    for (let i = 0; i < count; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const cx = x + col * (size + gap);
      const cy = y + row * (size + gap);
      context.fillStyle = color;
      context.fillRect(cx, cy, size, size);
      context.strokeStyle = "#555";
      context.lineWidth = 1.5;
      context.strokeRect(cx, cy, size, size);
    }
  }

  function drawPlaceValueBlocks(value, x, y, width, height) {
    const hundreds = Math.floor(value / 100);
    const tens = Math.floor((value % 100) / 10);
    const ones = value % 10;
    const rows = [
      {
        label: "100",
        count: hundreds,
        scale: 0.8,
        color: "rgba(255,150,0,0.5)",
      },
      { label: "10", count: tens, scale: 0.55, color: "rgba(80,170,255,0.45)" },
      { label: "1", count: ones, scale: 0.28, color: "rgba(120,200,120,0.45)" },
    ];
    const sectionGap = 10;
    const sectionH = (height - sectionGap * 2) / 3;
    context.font = "16px Arial";

    rows.forEach((row, index) => {
      const rowY = y + index * (sectionH + sectionGap);
      const labelStr = `${row.label} x ${row.count}`;
      const labelW = Math.max(
        52,
        Math.ceil(context.measureText(labelStr).width) + 10,
      );
      const unitAreaW = Math.max(40, width - labelW - 6);
      const baseSize = sectionH * row.scale;
      const unitSize = maxPlaceValueUnitSize(unitAreaW, sectionH, baseSize);
      const unitGap = unitBlockGap(unitSize);
      const totalH = unitSize * 2 + unitGap;
      context.fillStyle = "#333";
      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillText(labelStr, x, rowY + sectionH / 2);
      drawFiveByTwoUnits(
        row.count,
        x + labelW,
        rowY + (sectionH - totalH) / 2,
        unitSize,
        row.color,
      );
    });
  }

  function renderPlaceValueModel(problem = null) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!problem) return;
    const pad = 16;
    const cardW = canvas.width - pad * 2;
    const cardH = canvas.height - pad * 2;
    const { numbers } = parseQuestion(problem.question);
    const value = numbers[0] || problem.mother || 0;

    context.strokeStyle = "#555";
    context.lineWidth = 2;
    context.strokeRect(pad, pad, cardW, cardH);
    context.fillStyle = "#333";
    context.font = "18px Arial";
    context.textAlign = "left";
    context.fillText("Start", pad + 8, pad + 22);
    drawPlaceValueBlocks(value, pad + 8, pad + 32, cardW - 16, cardH - 40);
  }

  function renderColumnModel(problem = null) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!problem) return;

    const { numbers, operators } = parseQuestion(problem.question);
    const left = numbers[0] || 0;
    const right = numbers[1] || 0;
    const op = operators[0] || "+";
    const digits = Math.max(String(left).length, String(right).length);
    const cols = Math.max(3, digits + 1);
    const rows = 4;
    const padX = Math.max(16, Math.floor(canvas.width * 0.09));
    const padY = Math.max(16, Math.floor(canvas.height * 0.14));
    const areaW = canvas.width - padX * 2;
    const areaH = canvas.height - padY * 2;
    const cellW = areaW / cols;
    const cellH = areaH / rows;
    const topY = padY;

    context.strokeStyle = "#bbbbbb";
    context.lineWidth = 1;
    for (let i = 0; i <= cols; i++) {
      const x = padX + i * cellW;
      context.beginPath();
      context.moveTo(x, topY);
      context.lineTo(x, topY + rows * cellH);
      context.stroke();
    }
    for (let i = 0; i <= rows; i++) {
      const y = topY + i * cellH;
      context.beginPath();
      context.moveTo(padX, y);
      context.lineTo(padX + cols * cellW, y);
      context.stroke();
    }

    const lineY = topY + cellH * 2;
    context.strokeStyle = "#333";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(padX, lineY);
    context.lineTo(padX + cols * cellW, lineY);
    context.stroke();

    context.fillStyle = "#222";
    context.font = `${Math.max(28, Math.floor(cellH * 0.52))}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    function drawRightAligned(value, rowIndex, offsetCols = 0) {
      const chars = String(value).split("");
      const startCol = cols - offsetCols - chars.length;
      chars.forEach((char, index) => {
        const x = padX + (startCol + index + 0.5) * cellW;
        const y = topY + (rowIndex + 0.5) * cellH;
        context.fillText(char, x, y);
      });
    }

    drawRightAligned(left, 0);
    const opX = padX + cellW * 0.5;
    const opY = topY + cellH * 1.5;
    context.fillText(op, opX, opY);
    drawRightAligned(right, 1);
  }

  function drawSingleDigitMultiplyGrid(a, b) {
    const count = 10;
    const gridSize = canvas.width / count;
    drawCells(true, count);
    context.fillStyle = "rgba(255,150,0,0.45)";
    for (let row = 0; row < a; row++) {
      for (let col = 0; col < b; col++) {
        context.fillRect(
          col * gridSize + 1,
          row * gridSize + 1,
          gridSize - 2,
          gridSize - 2,
        );
      }
    }
    context.strokeStyle = "#0b8f4d";
    context.lineWidth = 3;
    context.strokeRect(1.5, 1.5, b * gridSize - 3, a * gridSize - 3);
    drawCells(false, count);
  }

  function drawTeenBySingleModel(a, b) {
    const gridCount = 20;
    drawCells(true, gridCount);
    const cell = canvas.width / gridCount;
    for (let row = 0; row < a; row++) {
      for (let col = 0; col < b; col++) {
        const x = col * cell;
        const y = canvas.width - (row + 1) * cell;
        context.fillStyle =
          row < 10 ? "rgba(255,150,0,0.42)" : "rgba(80,170,255,0.35)";
        context.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
    drawCells(false, gridCount);

    const tenLineY = canvas.width - 10 * cell;
    context.strokeStyle = "#0b8f4d";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(0, tenLineY);
    context.lineTo(canvas.width, tenLineY);
    context.stroke();

    context.strokeStyle = "#666";
    context.lineWidth = 2;
    for (let i = 5; i < gridCount; i += 5) {
      const pos = i * cell;
      context.beginPath();
      context.moveTo(pos, 0);
      context.lineTo(pos, canvas.width);
      context.moveTo(0, pos);
      context.lineTo(canvas.width, pos);
      context.stroke();
    }
  }

  function drawTeenSquareModel(a) {
    const pad = 24;
    const labelSpace = 36;
    const bottomLabelSpace = 24;
    const boxX = pad + labelSpace;
    const boxY = pad + 18;
    const boxW = canvas.width - pad * 2 - labelSpace;
    const boxH = canvas.height - pad * 2 - 24 - bottomLabelSpace;
    const splitX = boxX + (boxW * 10) / a;
    const splitY = boxY + (boxH * 10) / a;
    const ones = a - 10;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#444";
    context.lineWidth = 2;
    context.strokeRect(boxX, boxY, boxW, boxH);
    context.beginPath();
    context.moveTo(splitX, boxY);
    context.lineTo(splitX, boxY + boxH);
    context.moveTo(boxX, splitY);
    context.lineTo(boxX + boxW, splitY);
    context.stroke();

    const rects = [
      [boxX, boxY, splitX - boxX, splitY - boxY, "rgba(255,150,0,0.40)"],
      [
        splitX,
        boxY,
        boxX + boxW - splitX,
        splitY - boxY,
        "rgba(80,170,255,0.35)",
      ],
      [
        boxX,
        splitY,
        splitX - boxX,
        boxY + boxH - splitY,
        "rgba(120,200,120,0.35)",
      ],
      [
        splitX,
        splitY,
        boxX + boxW - splitX,
        boxY + boxH - splitY,
        "rgba(220,120,180,0.30)",
      ],
    ];
    rects.forEach(([x, y, w, h, color]) => {
      context.fillStyle = color;
      context.fillRect(x + 1, y + 1, w - 2, h - 2);
    });

    context.fillStyle = "#333";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("10", pad + labelSpace / 2, boxY + (splitY - boxY) / 2);
    context.fillText(
      String(ones),
      pad + labelSpace / 2,
      splitY + (boxY + boxH - splitY) / 2,
    );
    context.textBaseline = "top";
    context.fillText("10", boxX + (splitX - boxX) / 2, boxY + boxH + 8);
    context.fillText(
      String(ones),
      splitX + (boxX + boxW - splitX) / 2,
      boxY + boxH + 8,
    );
  }

  function drawGeneralMultiplyModel(a, b) {
    const pad = 24;
    const labelSpace = 42;
    const boxX = pad + labelSpace;
    const boxY = pad + 18;
    const boxW = canvas.width - pad * 2 - labelSpace;
    const boxH = canvas.height - pad * 2 - 48;
    const roundedB = b >= 10 ? Math.round(b / 10) * 10 : b;
    const remainder = b >= 10 ? b - roundedB : 0;
    const firstPart = roundedB === 0 ? b : roundedB;
    const secondPart = roundedB === 0 ? 0 : Math.abs(remainder);
    const totalUnits = Math.max(1, Math.abs(firstPart) + secondPart);
    const firstW = (boxW * Math.abs(firstPart)) / totalUnits;
    const secondW = boxW - firstW;
    const bottomY = boxY + boxH + 8;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#444";
    context.lineWidth = 2;
    context.strokeRect(boxX, boxY, boxW, boxH);
    context.fillStyle = "rgba(255,150,0,0.42)";
    context.fillRect(boxX + 1, boxY + 1, Math.max(0, firstW - 2), boxH - 2);
    if (secondPart > 0) {
      context.fillStyle =
        remainder > 0 ? "rgba(80,170,255,0.35)" : "rgba(235,110,110,0.28)";
      context.fillRect(
        boxX + firstW + 1,
        boxY + 1,
        Math.max(0, secondW - 2),
        boxH - 2,
      );
      context.beginPath();
      context.moveTo(boxX + firstW, boxY);
      context.lineTo(boxX + firstW, boxY + boxH);
      context.stroke();
    }

    context.fillStyle = "#333";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(a), pad + labelSpace / 2, boxY + boxH / 2);
    context.textBaseline = "top";
    context.fillText(
      remainder < 0 ? String(b) : String(firstPart),
      boxX + firstW / 2,
      bottomY,
    );
    if (secondPart > 0) {
      context.fillText(
        String(secondPart),
        boxX + firstW + secondW / 2,
        bottomY,
      );
    }
    if (remainder < 0 && secondPart > 0) {
      const bracketTop = bottomY + 18;
      const bracketBottom = bracketTop + 10;
      context.strokeStyle = "#555";
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(boxX + 4, bracketTop);
      context.lineTo(boxX + 4, bracketBottom);
      context.lineTo(boxX + boxW - 4, bracketBottom);
      context.lineTo(boxX + boxW - 4, bracketTop);
      context.stroke();
      context.fillStyle = "#333";
      context.fillText(String(roundedB), boxX + boxW / 2, bracketBottom + 4);
    }
  }

  function drawAreaModel(problem = null) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!problem) return;
    const { numbers } = parseQuestion(problem.question);
    const a = numbers[0] || 0;
    const b = numbers[1] || 0;

    if (a <= 10 && b <= 10) {
      drawSingleDigitMultiplyGrid(a, b);
      return;
    }
    if (levelId === 20) {
      drawTeenBySingleModel(a, b);
      return;
    }
    if (levelId === 21) {
      drawTeenBySingleModel(a, b);
      return;
    }
    drawGeneralMultiplyModel(a, b);
  }

  function getDivisionSplit(dividend, divisor) {
    if (dividend % divisor !== 0) return null;
    const chunks = [100, 90, 80, 60, 50, 40, 30, 20, 10];
    for (const chunk of chunks) {
      if (
        chunk < dividend &&
        chunk % divisor === 0 &&
        (dividend - chunk) % divisor === 0
      ) {
        return [chunk, dividend - chunk];
      }
    }
    return null;
  }

  function chooseDivisionGrid(divisor, quotient) {
    const dividend = divisor * quotient;
    if (divisor <= 10 && quotient <= 10) {
      return { width: quotient, height: divisor };
    }

    let best = null;

    for (let factor = 1; factor <= 10; factor++) {
      if (dividend % factor !== 0) continue;
      const other = dividend / factor;
      if (other > 10) continue;
      if (factor % divisor !== 0 && other % divisor !== 0) continue;

      const multipleFactor = factor % divisor === 0 ? factor : other;
      const score = multipleFactor;
      if (!best || score > best.score) {
        best = { width: factor, height: other, score };
      }
    }

    return best ? { width: best.width, height: best.height } : null;
  }

  function fillBottomLeftGridRange(start, end, color, gridCount = 10) {
    const cell = canvas.width / gridCount;
    const from = Math.max(0, Math.min(start, gridCount * gridCount));
    const to = Math.max(from, Math.min(end, gridCount * gridCount));
    context.fillStyle = color;
    for (let idx = from; idx < to; idx++) {
      const row = Math.floor(idx / gridCount);
      const col = idx % gridCount;
      const x = col * cell;
      const y = canvas.width - (row + 1) * cell;
      context.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  function drawDivisionModel(problem = null) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!problem) return;
    const { numbers } = parseQuestion(problem.question);
    const dividend = numbers[0] || 0;
    const divisor = numbers[1] || 1;

    if (levelId >= 22 && levelId <= 25 && dividend <= 100) {
      const gridCount = 10;
      const cell = canvas.width / gridCount;
      const grid = chooseDivisionGrid(divisor, problem.answer);

      drawCells(true, gridCount);
      if (grid) {
        context.fillStyle = "rgba(255,150,0,0.45)";
        for (let row = 0; row < grid.height; row++) {
          for (let col = 0; col < grid.width; col++) {
            const x = col * cell;
            const y = canvas.width - (row + 1) * cell;
            context.fillRect(x + 1, y + 1, cell - 2, cell - 2);
          }
        }
      } else {
        const tens = Math.floor(dividend / 10) * 10;
        const ones = dividend % 10;
        fillBottomLeftGridRange(0, tens, "rgba(255,150,0,0.45)", gridCount);
        if (ones > 0) {
          fillBottomLeftGridRange(
            tens,
            tens + ones,
            "rgba(80,170,255,0.35)",
            gridCount,
          );
        }
      }
      drawCells(false, gridCount);
      return;
    }

    const cols = Math.min(divisor, 5);
    const rows = Math.ceil(divisor / cols);
    const pad = 18;
    const topArea = 50;
    const gap = 10;
    const boxW = (canvas.width - pad * 2 - gap * (cols - 1)) / cols;
    const boxH = (canvas.height - pad * 2 - topArea - gap * (rows - 1)) / rows;
    const split = getDivisionSplit(dividend, divisor);

    context.fillStyle = "#333";
    context.font = "18px Arial";
    context.textAlign = "left";
    context.textBaseline = "middle";
    context.fillText(
      split
        ? `${split[0]} + ${split[1]} を ${divisor} グループ`
        : `${dividend} を ${divisor} グループ`,
      pad,
      pad + 10,
    );

    for (let i = 0; i < divisor; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = pad + col * (boxW + gap);
      const y = pad + topArea + row * (boxH + gap);
      context.strokeStyle = "#444";
      context.lineWidth = 2;
      context.strokeRect(x, y, boxW, boxH);
      context.fillStyle = "rgba(255,150,0,0.45)";
      context.fillRect(x + 4, y + 32, boxW - 8, boxH - 36);
      context.fillStyle = "#333";
      context.font = "16px Arial";
      context.textAlign = "center";
      context.fillText(`Group ${i + 1}`, x + boxW / 2, y + 18);
    }
  }

  function renderGuide() {
    const mode = getVisualMode();
    if (mode === "count") {
      drawCells(true);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function renderProblem(problem) {
    const mode = getVisualMode();
    if (mode === "count") {
      renderCountModel(problem);
    } else if (mode === "placevalue") {
      renderPlaceValueModel(problem);
    } else if (mode === "column") {
      renderColumnModel(problem);
    } else if (mode === "multiply") {
      drawAreaModel(problem);
    } else {
      drawDivisionModel(problem);
    }
  }

  function showProblem() {
    if (problems.length === 0 || currentProblemIndex >= problems.length) return;
    const currentProblem = problems[currentProblemIndex];
    el("problemDisplay").textContent = `${currentProblem.question} =`;
    el("remainingDisplay").textContent = String(
      problems.length - currentProblemIndex,
    );
    renderProblem(currentProblem);
  }

  function appendNumber(numStr) {
    if (!isStarted) return;
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
      el("answerInput").value = "";
    });

    el("submitAnswerButton").addEventListener("click", () => {
      if (isStarted) checkAnswer();
    });

    document.getElementById("numberButtons").addEventListener("click", (e) => {
      const btn = e.target.closest(".numbtn");
      if (!btn || !isStarted) return;
      const digit = btn.id.startsWith("btn") ? btn.id.slice(3) : "";
      if (/^\d$/.test(digit)) appendNumber(digit);
    });

    document.addEventListener(
      "keydown",
      (event) => {
        if (!isStarted) return;
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
      el("answerInput").focus({ preventScroll: true });
    });

    el("back").addEventListener("click", () => {
      window.location.href = "../index.html";
    });
  }

  function init() {
    document.documentElement.dataset.playLevel = String(levelId);
    document.title = def.label;
    const topSpan = document.querySelector("#top span");
    if (topSpan) topSpan.textContent = def.label;
    if (el("nokori") && def.remnantLabel)
      el("nokori").textContent = def.remnantLabel;

    syncCanvasSize();
    requestAnimationFrame(syncCanvasSize);
    const canvasHost = document.getElementById("canvas-container");
    if (canvasHost && typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => syncCanvasSize());
      ro.observe(canvasHost);
    }
    window.addEventListener("resize", () => syncCanvasSize());

    displayBestRecord(readBest());
    updateToggleButton();
    wireUi();
  }

  window.addEventListener("load", init);
})();
