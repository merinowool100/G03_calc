// 問題を格納するリスト
const problems = [];
let currentProblemIndex = 0;

// StartとEndのフラグ
let isStarted = false;
let isEnd = false;

// タイマーの初期値
let timerInterval;
let milliseconds = 0;

// 二桁の足し算と引き算の問題をランダムに作成
function createQ() {
    for (let i = 0; i < 10; i++) {
        let num1, num2, isAddition;
        do {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            isAddition = Math.random() > 0.5;
        } while ((isAddition && num1 + num2 > 100) || (!isAddition && num1 < num2));

        if (isAddition) {
            problems.push({ question: `${num1} + ${num2}`, answer: num1 + num2, mother: num1 });
        } else {
            problems.push({ question: `${num1} - ${num2}`, answer: num1 - num2, mother: num1 });
        }
    }
}

// 残りの問題数を更新する関数
function updateRemainingDisplay() {
    const remainingProblems = problems.length - currentProblemIndex;
    document.getElementById("remainingDisplay").innerText = `${remainingProblems}`;
}

// Canvasの設定
const canvas = document.querySelector(".canvas");
canvas.width = 320;
canvas.height = 320;
const context = canvas.getContext("2d");

// マス目を描画する関数
function cells() {
    const gridSize = 32;
    const gridCount = 10;
    for (let i = 0; i <= gridCount; i++) {
        context.strokeStyle = "gray";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, i * gridSize);
        context.lineTo(320, i * gridSize);
        context.moveTo(i * gridSize, 0);
        context.lineTo(i * gridSize, 320);
        context.closePath();
        context.stroke();
    }
    context.strokeStyle = "black";
    context.beginPath();
    context.lineWidth = 3;
    context.moveTo(0, 160);
    context.lineTo(320, 160);
    context.moveTo(160, 0);
    context.lineTo(160, 320);
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
    if (isStarted) {
        document.getElementById("problemDisplay").innerText = `Q: ${currentProblem.question} =`;
    }
    updateRemainingDisplay();

    const rows = Math.floor(currentProblem.mother / 10);
    const residual = currentProblem.mother % 10;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    if (isStarted) {
        context.fillStyle = "rgba(255,150,0,0.5)";
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 320);
        context.lineTo(rows * 32, 320);
        context.lineTo(rows * 32, 0);
        context.closePath();
        context.fill();

        context.fillStyle = "rgba(255,150,0,0.5)";
        context.beginPath();
        context.moveTo(rows * 32, 0);
        context.lineTo(rows * 32, 32 * residual);
        context.lineTo((rows + 1) * 32, 32 * residual);
        context.lineTo((rows + 1) * 32, 0);
        context.closePath();
        context.fill();
    }
    cells();
}

function appendNumber(number) {
    const answerInput = document.getElementById("answerInput");
    answerInput.value += number;
}

document.getElementById("clearButton").addEventListener("click", () => {
    document.getElementById("answerInput").value = "";
});

function checkAnswer() {
    // if (document.getElementById("answerInput").disabled) return;
    const currentProblem = problems[currentProblemIndex];
    const userAnswer = parseInt(document.getElementById("answerInput").value);
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
    // document.getElementById("answerInput").disabled = true;
}

document.getElementById("submitAnswerButton").addEventListener("click", checkAnswer);

document.addEventListener("keydown", (event) => {
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
                // document.getElementById("answerInput").disabled = false;
            } else {
                isEnd = true;
                document.getElementById("remainingDisplay").innerText = "0";
                
                // Mission completeメッセージを作成して追加
                const completeMessageBox = document.createElement("div");
                completeMessageBox.classList.add("complete-message-box");
                completeMessageBox.innerHTML = `
                    <div class="complete-message">
                        <p>Mission complete!!</p>
                    </div>
                `;
                document.getElementById("problemDisplayContainer").appendChild(completeMessageBox); // 親要素に追加

                // Submitボタンを無効にする
                // document.getElementById("submitAnswerButton").disabled = true;
                
                updateBestRecord();  // ベストレコードを更新
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
    // localStorageからbestRecordを取得。nullの場合は0をデフォルトにする
    let bestRecord = localStorage.getItem('bestRecord');
    
    if (bestRecord === null) {
        bestRecord = 0;  // bestRecordがnullの場合は0に設定
    } else {
        bestRecord = parseInt(bestRecord, 10);  // 整数として扱う
    }

    // 現在の記録が最良記録よりも短ければ更新する
    if (currentRecord < bestRecord || bestRecord === 0) {
        localStorage.setItem('bestRecord', currentRecord);  // 新しいbestRecordを保存
        bestRecord = currentRecord;  // 変数に最良記録を格納
    }

    displayBestRecord(bestRecord);  // ベストレコードを表示
}

function displayBestRecord(bestRecord) {
    if (isNaN(bestRecord)) {
        bestRecord = 0;  // 万が一bestRecordがNaNであれば0に設定
    }

    // 時間としてフォーマットする
    let minutes = Math.floor((bestRecord % 360000) / 6000);
    let seconds = Math.floor((bestRecord % 6000) / 100);
    let hundredths = bestRecord % 100;

    document.getElementById("best-record").textContent =
        `Best: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

window.addEventListener("load", () => {
    const bestRecord = localStorage.getItem('bestRecord');
    if (bestRecord) {
        displayBestRecord(bestRecord); // ページロード時にベストレコード表示
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
    isEnd = false;  // ゲーム終了フラグをリセット
    milliseconds = 0;
    currentProblemIndex = 0;
    problems.length = 0;
    // document.getElementById("submitAnswerButton").disabled = false;  // ボタンを再度有効化
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    document.getElementById("answerInput").value = "";
    document.getElementById("problemDisplay").innerText = "";
    document.getElementById("remainingDisplay").innerText = "10";
    document.getElementById("timer-display").textContent = "00:00:00";
    cells();

    // Mission completeメッセージとボックスを削除
    const completeMessageBox = document.querySelector(".complete-message-box");
    if (completeMessageBox) {
        completeMessageBox.remove();  // ここで削除
    }

    // Best recordの再表示
    const bestRecord = localStorage.getItem('bestRecord');
    if (bestRecord) {
        displayBestRecord(bestRecord);
    } else {
        displayBestRecord(0);
    }
});
