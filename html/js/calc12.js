// 問題を格納するリスト
let problems = [];
let currentProblemIndex = 0;

// StartとEndのフラグ
let isStarted = false;
let isEnd = false;

// タイマーの初期値
let timerInterval;
let milliseconds = 0;

// 100ベース補正トレーニング問題をランダムに作成
function createQ() {
    problems.length = 0;

    for (let i = 0; i < 10; i++) {
        const mode = Math.random() > 0.5 ? "add" : "sub";

        // 100, 200, ... 900 を基準にする
        const base = (Math.floor(Math.random() * 9) + 1) * 100;
        const offset = Math.floor(Math.random() * 9) + 1; // 1〜9
        const num2 = Math.floor(Math.random() * 70) + 20; // 20〜89

        let num1, answer, question, hint;

        if (mode === "add") {
            // 例: 198 + 37 → 200 + 35
            num1 = Math.random() > 0.5 ? base - offset : base + offset;
            answer = num1 + num2;
            question = `${num1} + ${num2}`;
            hint = `${num1}を${base}に寄せて考える`;
        } else {
            // 例: 302 - 48 → 300 - 50 + 2
            num1 = base + offset;

            // 負の数を避ける
            if (num1 <= num2) {
                i--;
                continue;
            }

            answer = num1 - num2;
            question = `${num1} - ${num2}`;
            hint = `${num1}を${base}に寄せて考える`;
        }

        problems.push({
            question,
            answer,
            mother: num1,
            base: base,
            hint: hint
        });
    }
}

// 残りの問題数を更新する関数
function updateRemainingDisplay() {
    const remainingProblems = problems.length - currentProblemIndex;
    document.getElementById("remainingDisplay").innerText = `${remainingProblems}`;
}

// Canvasの設定
const canvas = document.querySelector(".canvas");
canvas.width = 300;
canvas.height = 300;
const context = canvas.getContext("2d");

// マス目を描画する関数
function cells() {
    const gridCount = 10;
    const gridSize = canvas.width / gridCount;

    for (let i = 0; i <= gridCount; i++) {
        context.strokeStyle = "gray";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, i * gridSize);
        context.lineTo(300, i * gridSize);
        context.moveTo(i * gridSize, 0);
        context.lineTo(i * gridSize, 300);
        context.closePath();
        context.stroke();
    }

    context.strokeStyle = "black";
    context.beginPath();
    context.lineWidth = 3;
    context.moveTo(0, 150);
    context.lineTo(300, 150);
    context.moveTo(150, 0);
    context.lineTo(150, 300);
    context.closePath();
    context.stroke();
}

// Startしたらマス目を描画
if (!isStarted) {
    cells();
}

// 問題を表示する関数
function showProblem() {
    if (problems.length === 0 || currentProblemIndex >= problems.length) return;

    const currentProblem = problems[currentProblemIndex];
    document.getElementById("problemDisplay").innerText = `${currentProblem.question} =`;
    updateRemainingDisplay();

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    const number = currentProblem.mother;
    const base = currentProblem.base;
    const hundreds = Math.floor(base / 100);
    const remainder = number - base; // -9〜+9

    // ベースの100のまとまりを帯で表示
    context.fillStyle = "rgba(255,150,0,0.35)";
    for (let i = 0; i < hundreds; i++) {
        context.fillRect(0, i * 30, 300, 30);
    }

    // 補正分を右端に表示
    if (remainder !== 0) {
        const correctionHeight = Math.abs(remainder) * 10;

        if (remainder > 0) {
            // baseより大きい分を赤系で表示
            context.fillStyle = "rgba(255,80,80,0.6)";
            context.fillRect(240, 300 - correctionHeight, 60, correctionHeight);
        } else {
            // baseより小さい分を青系で表示
            context.fillStyle = "rgba(80,120,255,0.6)";
            context.fillRect(0, 300 - correctionHeight, 60, correctionHeight);
        }
    }

    cells();
}

function appendNumber(number) {
    if (!isStarted) return;
    const answerInput = document.getElementById("answerInput");
    answerInput.value += number;
}

document.getElementById("clearButton").addEventListener("click", () => {
    document.getElementById("answerInput").value = "";
});

function checkAnswer() {
    const currentProblem = problems[currentProblemIndex];
    const userAnswer = parseInt(document.getElementById("answerInput").value, 10);

    if (isNaN(userAnswer)) {
        showFeedback(false);
        return;
    }

    if (userAnswer === currentProblem.answer) {
        showFeedback(true);
        currentProblemIndex++;
    } else {
        showFeedback(false);
        const incorrectProblem = problems.splice(currentProblemIndex, 1)[0];
        problems.push(incorrectProblem);
    }

    document.getElementById("answerInput").value = "";
}

document.getElementById("submitAnswerButton").addEventListener("click", () => {
    if (isStarted) {
        checkAnswer();
    }
});

document.addEventListener("keydown", (event) => {
    if (!isStarted) return;

    if (event.key >= "0" && event.key <= "9") {
        appendNumber(event.key);
    } else if (event.key === "Backspace") {
        const answerInput = document.getElementById("answerInput");
        answerInput.value = answerInput.value.slice(0, -1);
    } else if (event.key === "Enter") {
        checkAnswer();
    } else if (event.key === "Delete") {
        document.getElementById("answerInput").value = "";
    }
});

function showFeedback(isCorrect) {
    const feedback = document.getElementById("feedback");
    feedback.innerText = isCorrect ? "Correct" : "Wrong";
    feedback.style.color = isCorrect ? "green" : "red";
    feedback.style.display = "block";
    feedback.classList.remove("hidden");

    setTimeout(() => {
        feedback.classList.add("hidden");
        setTimeout(() => {
            feedback.style.display = "none";

            if (currentProblemIndex < problems.length) {
                showProblem();
            } else {
                isEnd = true;
                document.getElementById("problemDisplay").innerText = "";
                document.getElementById("remainingDisplay").innerText = "0";
                screen_lock();
                updateBestRecord();
            }
        }, 100);
    }, 200);
}

function updateTimer() {
    let minutes = Math.floor((milliseconds % 360000) / 6000);
    let seconds = Math.floor((milliseconds % 6000) / 100);
    let hundredths = milliseconds % 100;

    document.getElementById("timer-display").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (isEnd) {
            clearInterval(timerInterval);
        } else {
            milliseconds++;
            updateTimer();
        }
    }, 10);
}

function updateBestRecord() {
    const currentRecord = milliseconds;
    let bestRecord10 = localStorage.getItem("bestRecord10");

    if (bestRecord10 === null) {
        bestRecord10 = 0;
    } else {
        bestRecord10 = parseInt(bestRecord10, 10);
    }

    if (currentRecord < bestRecord10 || bestRecord10 === 0) {
        localStorage.setItem("bestRecord10", currentRecord);
        bestRecord10 = currentRecord;
    }

    displayBestRecord(bestRecord10);
}

function displayBestRecord(bestRecord10) {
    if (isNaN(bestRecord10)) {
        bestRecord10 = 0;
    }

    let minutes = Math.floor((bestRecord10 % 360000) / 6000);
    let seconds = Math.floor((bestRecord10 % 6000) / 100);
    let hundredths = bestRecord10 % 100;

    document.getElementById("best-record").textContent =
        `Best: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

window.addEventListener("load", () => {
    const bestRecord10 = localStorage.getItem("bestRecord10");
    if (bestRecord10) {
        displayBestRecord(bestRecord10);
    } else {
        displayBestRecord(0);
    }
});

document.getElementById("start").addEventListener("click", () => {
    if (isStarted) return;

    isStarted = true;
    isEnd = false;
    startTimer();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    createQ();
    showProblem();
});

document.getElementById("reset").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    isStarted = false;
    isEnd = false;
    milliseconds = 0;
    currentProblemIndex = 0;
    problems.length = 0;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    document.getElementById("answerInput").value = "";
    document.getElementById("problemDisplay").innerText = "";
    document.getElementById("remainingDisplay").innerText = "10";
    document.getElementById("timer-display").textContent = "00:00:00";
    cells();

    const completeMessageBox = document.querySelector(".complete-message-box");
    if (completeMessageBox) {
        completeMessageBox.remove();
    }

    const screenLock = document.getElementById("screenLock");
    if (screenLock) {
        screenLock.remove();
    }

    const bestRecord10 = localStorage.getItem("bestRecord10");
    if (bestRecord10) {
        displayBestRecord(bestRecord10);
    } else {
        displayBestRecord(0);
    }
});

// スクリーンロックの生成
function createLockScreen(messageText, bgColor) {
    let lock_screen = document.createElement("div");
    lock_screen.id = "screenLock";
    lock_screen.style.height = "100%";
    lock_screen.style.left = "0px";
    lock_screen.style.position = "fixed";
    lock_screen.style.top = "0px";
    lock_screen.style.width = "100%";
    lock_screen.style.zIndex = "9999";
    lock_screen.style.opacity = "0.8";
    lock_screen.style.backgroundColor = "rgba(0,0,0,0.5)";

    let message = document.createElement("div");
    message.textContent = messageText;
    message.style.color = "white";
    message.style.fontSize = "36px";
    message.style.position = "absolute";
    message.style.top = "50%";
    message.style.left = "50%";
    message.style.transform = "translate(-50%, -50%)";
    message.style.whiteSpace = "nowrap";
    message.style.backgroundColor = bgColor;
    message.style.padding = "10px 20px";
    message.style.borderRadius = "8px";

    lock_screen.appendChild(message);

    let retryButton = document.createElement("button");
    retryButton.textContent = "Retry";
    retryButton.style.position = "absolute";
    retryButton.style.top = "60%";
    retryButton.style.left = "50%";
    retryButton.style.transform = "translateX(-50%)";
    retryButton.style.fontSize = "20px";
    retryButton.addEventListener("click", () => {
        window.location.reload();
    });

    lock_screen.appendChild(retryButton);
    return lock_screen;
}

// 終了時のスクリーンロック関数
function screen_lock() {
    let message = "Well done!!";
    let bgColor = "rgba(255,0,0,0.5)";
    const bestRecord10 = localStorage.getItem("bestRecord10");

    if (bestRecord10 === null || milliseconds < parseInt(bestRecord10, 10)) {
        message = "New record!!";
        bgColor = "rgba(0,255,0,0.5)";
    }

    let lock_screen = createLockScreen(message, bgColor);
    document.body.appendChild(lock_screen);
}

document.getElementById("back").addEventListener("click", () => {
    window.location.href = "../index.html";
});