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
            num1 = Math.floor(Math.random() * 20) + 1;
            // num2 = Math.floor(Math.random() * 20) + 1;
        } while (num1 < 11);
            problems.push({ question: `${num1} + 5`, answer: num1 + 5, mother: num1 });
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
    const gridCount = 5;
    const gridSize = canvas.width/gridCount;
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
    context.moveTo(120, 0);
    context.lineTo(120, 300);
    context.moveTo(240, 0);
    context.lineTo(240, 300);
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

    const rows = Math.floor(currentProblem.mother / 5);
    const residual = currentProblem.mother % 5;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    const gridCount2 = 5;
    const gridSize2 = canvas.width/gridCount2;

    context.fillStyle = "rgba(255,150,0,0.5)";
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(0, 300);
    context.lineTo(rows * gridSize2, 300);
    context.lineTo(rows * gridSize2, 0);
    context.closePath();
    context.fill();

    context.fillStyle = "rgba(255,150,0,0.5)";
    context.beginPath();
    context.moveTo(rows * gridSize2, 0);
    context.lineTo(rows * gridSize2, gridSize2 * residual);
    context.lineTo((rows + 1) * gridSize2, gridSize2 * residual);
    context.lineTo((rows + 1) * gridSize2, 0);
    context.closePath();
    context.fill();
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

document.getElementById("submitAnswerButton").addEventListener("click",()=>{
    if(isStarted){
        checkAnswer();
    }
})

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
                // document.getElementById("answerInput").disabled = false;
            } else {
                isEnd = true;
                document.getElementById("problemDisplay").innerText = "";
                document.getElementById("remainingDisplay").innerText = "0";
                screen_lock(); 
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
    let bestRecord3 = localStorage.getItem('bestRecord3');

    if (bestRecord3 === null) {
        bestRecord3 = 0;  // bestRecordがnullの場合は0に設定
    } else {
        bestRecord3 = parseInt(bestRecord3, 10);  // 整数として扱う
    }

    // 現在の記録が最良記録よりも短ければ更新する
    if (currentRecord < bestRecord3 || bestRecord3 === 0) {
        localStorage.setItem('bestRecord3', currentRecord);  // 新しいbestRecordを保存
        bestRecord3 = currentRecord;  // 変数に最良記録を格納
    }

    displayBestRecord(bestRecord3);  // ベストレコードを表示
}

function displayBestRecord(bestRecord3) {
    if (isNaN(bestRecord3)) {
        bestRecord3 = 0;  // 万が一bestRecordがNaNであれば0に設定
    }

    // 時間としてフォーマットする
    let minutes = Math.floor((bestRecord3 % 360000) / 6000);
    let seconds = Math.floor((bestRecord3 % 6000) / 100);
    let hundredths = bestRecord3 % 100;

    document.getElementById("best-record").textContent =
        `Best: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}

window.addEventListener("load", () => {
    const bestRecord3 = localStorage.getItem('bestRecord3');
    if (bestRecord3) {
        displayBestRecord(bestRecord3); // ページロード時にベストレコード表示
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
    console.log(problems);
    showProblem();
});

document.getElementById("reset").addEventListener("click", () => {
    // window.location.reload();
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
    const bestRecord3 = localStorage.getItem('bestRecord3');
    if (bestRecord3) {
        displayBestRecord(bestRecord3);
    } else {
        displayBestRecord(0);
    }
});

// スクリーンロックの生成
function createLockScreen(messageText, bgColor) {
    let lock_screen = document.createElement('div');
    lock_screen.id = "screenLock";
    lock_screen.style.height = '100%';
    lock_screen.style.left = '0px';
    lock_screen.style.position = 'fixed';
    lock_screen.style.top = '0px';
    lock_screen.style.width = '100%';
    lock_screen.style.zIndex = '9999';
    lock_screen.style.opacity = '0.8';
    lock_screen.style.backgroundColor = "rgba(0,0,0,0.5)";

    let message = document.createElement('div');
    message.textContent = messageText;
    message.style.color = 'white';
    message.style.fontSize = '36px';
    message.style.position = 'absolute';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.whiteSpace = "nowrap";
    message.style.backgroundColor = bgColor;

    lock_screen.appendChild(message);

    let retryButton = document.createElement('button');
    retryButton.textContent = "Retry";
    retryButton.style.position = "absolute";
    retryButton.style.top = "60%";
    retryButton.style.left = "50%";
    retryButton.style.transform = "translateX(-50%)";
    retryButton.style.fontSize = "20px";
    retryButton.addEventListener('click', () => {
        window.location.reload();
    });

    lock_screen.appendChild(retryButton);
    return lock_screen;
}



// 終了時のスクリーンロック関数
function screen_lock() {
    let message = "Well done!!";
    let bgColor = "rgba(255,0,0,0.5)";
    const bestRecord3 = localStorage.getItem("bestRecord3");
    if (bestRecord3 === null || milliseconds < bestRecord3) {
        message = "New record!!";
        bgColor = "rgba(0,255,0,0.5)";
    }

    let lock_screen = createLockScreen(message, bgColor);
    document.body.appendChild(lock_screen);
}

document.getElementById("back").addEventListener("click",()=>{
    window.location.href = "../index.html";
});