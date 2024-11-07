// 問題を格納するリスト
const problems = [];
let currentProblemIndex = 0; // 現在の問題のインデックス

// StartとEndのフラグ
let isStarted = false;
let isEnd = false;

// 時間計測用の初期値
let timeInterval;
let milliseconds = 0;

// 二桁の足し算と引き算の問題をランダムに作成
function createQ() {
    for (let i = 0; i < 10; i++) {
        let num1, num2, isAddition;
        do {
            num1 = Math.floor(Math.random() * 90) + 10; // 10から99の範囲
            num2 = Math.floor(Math.random() * 90) + 10;
            isAddition = Math.random() > 0.5; // 足し算と引き算を半々で選ぶ
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
        context.moveTo(0, i * gridSize); // 横線
        context.lineTo(320, i * gridSize);
        context.moveTo(i * gridSize, 0); // 縦線
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
};

// Startしたらマス目を描画
if (!isStarted) {
    cells();
}

// 問題を表示する関数
function showProblem() {
    if (problems.length === 0 || currentProblemIndex >= problems.length) {
        return;
    }
    const currentProblem = problems[currentProblemIndex];
    if (isStarted) {
        document.getElementById("problemDisplay").innerText = `Q: ${currentProblem.question} =`;
    }
    updateRemainingDisplay(); // 残りの問題数を更新


    // 描画用に数字を設定
    const rows = Math.floor(currentProblem.mother / 10);
    const residual = currentProblem.mother % 10;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height); //描く前に一回描画を消す

    // 問題の四角を描画する
    if (isStarted) {
        // 10のかたまりの数を塗りつぶす
        context.fillStyle = "rgba(255,150,0,0.5)";
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 320);
        context.lineTo(rows * 32, 320);
        context.lineTo(rows * 32, 0);
        context.closePath();
        context.fill();

        // 1の位の数の四角を描画する
        context.fillStyle = "rgba(255,150,0,0.5)";
        context.beginPath();
        context.moveTo(rows * 32, 0);
        context.lineTo(rows * 32, 32 * residual);
        context.lineTo((rows + 1) * 32, 32 * residual);
        context.lineTo((rows + 1) * 32, 0);
        context.closePath();
        context.fill();
    }
    // 上記の四角の上からマス目を再度描画する
    cells();
}

// 数字ボタンで入力を追加する関数
function appendNumber(number) {
    const answerInput = document.getElementById("answerInput");
    answerInput.value += number;
}

// クリアボタンを押したら回答入力をクリア
document.getElementById("clearButton").addEventListener("click", () => {
    document.getElementById("answerInput").value = "";
});


// 回答をチェックする関数
function checkAnswer() {
    if (document.getElementById("answerInput").disabled) return;
    const currentProblem = problems[currentProblemIndex];
    const userAnswer = parseInt(document.getElementById("answerInput").value);
    if (isNaN(userAnswer)) {
        showFeedback(false);
        return;
    }

    if (!isNaN(userAnswer) && userAnswer === currentProblem.answer) {
        showFeedback(true); // 正解のフィードバック表示
        currentProblemIndex++; // 正解の場合、次の問題に進む
    } else {
        showFeedback(false); // 不正解のフィードバック表示
        const incorrectProblem = problems.splice(currentProblemIndex, 1)[0];
        problems.push(incorrectProblem); // 間違えた問題をリストの最後に追加
    }

    // 回答欄をクリア
    document.getElementById("answerInput").value = "";
    document.getElementById("answerInput").disabled = true;
}

// イベントリスナーの設定
document.getElementById("submitAnswerButton").addEventListener("click", checkAnswer);

// テンキーで入力を処理する
document.addEventListener("keydown", (event) => {
    if (event.key >= "0" && event.key <= "9") { // 数字キーの場合
        appendNumber(event.key); // その数字を入力欄に追加
    } else if (event.key === "Backspace") { // バックスペースの場合
        const answerInput = document.getElementById("answerInput");
        answerInput.value = answerInput.value.slice(0, -1); // 最後の文字を削除
    } else if (event.key === "Enter") { // エンターキーの場合
        checkAnswer(); // 回答をチェック
    } else if (event.key === "Delete") { // デリートキーの場合
        document.getElementById("answerInput").value = ""; // 回答を消去
    }
});

// 正解・不正解のフィードバックを表示する関数
function showFeedback(isCorrect) {
    const feedback = document.getElementById("feedback");
    const currentProblem = problems[currentProblemIndex];

    if (isCorrect) {
        feedback.innerText = "Correct"; // 正解のフィードバック
        feedback.style.color = "green";
    } else {
        feedback.innerText = "Wrong"; // 不正解のフィードバック
        feedback.style.color = "red";
    }

    feedback.style.display = "block";
    feedback.classList.remove("hidden");

    // フェードアウト開始
    setTimeout(() => {
        feedback.classList.add("hidden");
        setTimeout(() => {
            feedback.style.display = "none"; // 完全に非表示
            if (currentProblemIndex < problems.length) {
                showProblem(); // 次の問題を表示
                document.getElementById("answerInput").disabled = false;
            } else {
                isEnd = true;
                document.getElementById("remainingDisplay").innerText = "0";
                document.getElementById("problemDisplay").remove();
                document.getElementById("answerArea").remove();
                const completeMessage = document.createElement("div");
                completeMessage.setAttribute("class", "end")
                completeMessage.innerText = "Mission complete!!";
                document.getElementById("problemDisplayContainer").appendChild(completeMessage);
                document.getElementById("submitAnswerButton").disabled = true;
                // タイマーが終了した際にベスト記録を更新
                updateBestRecord(); // ここでベスト記録を更新
            }
        }, 100); // フェードアウト後に完全非表示
    }, 200); // 0.3秒間Feedback messageを表示してからフェードアウト
}
console.log(feedback);

// タイマーの表示を更新する関数
function updateTimer() {
    let minutes = Math.floor((milliseconds % 360000) / 6000);
    let seconds = Math.floor((milliseconds % 6000) / 100);
    let hundredths = milliseconds % 100;
    // タイマーを表示
    document.getElementById("timer-display").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")} `
}

// タイマーの更新をする関数
function startTimer() {
    if (timeInterval) clearInterval(timeInterval);
    timerInterval = setInterval(() => {
        if (isEnd) {
            clearInterval(timerInterval);
        } else {
            milliseconds++;
            updateTimer();
        }
    }, 10);
}

// スタートボタン
document.getElementById("start").addEventListener("click", () => {
    if (isStarted) return;
    isStarted = true;
    isEnd = false;
    startTimer();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    createQ();
    showProblem();
});

// リセットボタン
document.getElementById("reset").addEventListener("click", () => {
    if (timeInterval) {
        clearInterval(timeInterval);
        timeInterval = null;
    }
    problems.length = 0;
    currentProblemIndex = 0;
    milliseconds = 0;
    isStarted = false;
    isEnd = true;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    document.getElementById("answerInput").value = "";  // 入力欄をクリア
    document.getElementById("problemDisplay").innerText = "";  // 問題表示をクリア
    document.getElementById("remainingDisplay").innerText = "10";  // 残り問題数をリセット
    document.getElementById("timer-display").textContent = "00:00:00";
    // createQ();
    cells();
    // showProblem();
});

// ベスト記録を更新する関数
function updateBestRecord() {
    const currentRecord = milliseconds; // 現在の記録

    // localStorageからベスト記録を取得
    let bestRecord = localStorage.getItem('bestRecord');

    if (!bestRecord || currentRecord < bestRecord) {
        // 新しいベスト記録が出た場合
        localStorage.setItem('bestRecord', currentRecord); // 更新
        bestRecord = currentRecord;
    }

    // ベスト記録を画面に表示
    displayBestRecord(bestRecord);
}

// ベスト記録を表示する関数
function displayBestRecord(bestRecord) {
    let minutes = Math.floor((bestRecord % 360000) / 6000);
    let seconds = Math.floor((bestRecord % 6000) / 100);
    let hundredths = bestRecord % 100;

    document.getElementById("best-record").textContent =
        `Best: ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(hundredths).padStart(2, "0")}`;
}


// ページが読み込まれたときにベスト記録を表示
window.addEventListener("load", () => {
    const bestRecord = localStorage.getItem('bestRecord');
    if (bestRecord) {
        displayBestRecord(bestRecord);
    } else {
        displayBestRecord(0); // 初めての場合は0秒からスタート
    }
});