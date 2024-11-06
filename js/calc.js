// 問題を格納するリスト
const problems = [];
let currentProblemIndex = 0; // 現在の問題のインデックス
let isStarted = false;
console.log(isStarted);




// 二桁の足し算と引き算の問題をランダムに2問作成
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
    document.getElementById("remainingDisplay").innerText = `残りの問題数: ${remainingProblems}`;
}

// Canvasの設定--------------------------------------------
const canvas = document.querySelector(".canvas");
canvas.width = 320;
canvas.height = 320;
const context = canvas.getContext("2d");

// マス目を描画---------------------------------------------
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

if (!isStarted) {
    cells();
}

// 現在の問題を表示する関数
function showProblem() {
    const currentProblem = problems[currentProblemIndex];
    if (isStarted) {
        document.getElementById("problemDisplay").innerText = `Q: ${currentProblem.question} =`;
        console.log(problems);
    }
    updateRemainingDisplay(); // 残りの問題数を更新


    // 描画用に数字を設定---------------------------------------
    const rows = Math.floor(currentProblem.mother / 10);
    const residual = currentProblem.mother % 10;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // 四角を描画する---------------------------------------------
    if (isStarted) {

        context.fillStyle = "rgba(255,150,0,0.5)";
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, 320);
        context.lineTo(rows * 32, 320);
        context.lineTo(rows * 32, 0);
        context.closePath();
        context.fill();

        // あまりの四角を描画する
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

// 数字ボタンで入力を追加する関数
function appendNumber(number) {
    const answerInput = document.getElementById("answerInput");
    answerInput.value += number;
}

// 回答入力をクリアする関数
document.getElementById("clearButton").addEventListener("click", () => {
    document.getElementById("answerInput").value = "";
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
            } else {
                document.getElementById("remainingDisplay").innerText = "残りの問題数: 0";
                document.getElementById("problemDisplay").remove();
                document.getElementById("answerArea").remove();
                const completeMessage = document.createElement("div");
                completeMessage.setAttribute("class", "end")
                completeMessage.innerText = "Mission complete!!";
                document.getElementById("problemDisplayContainer").appendChild(completeMessage);
                document.getElementById("submitAnswerButton").disabled = true;
            }
        }, 100); // フェードアウト後に完全非表示
    }, 200); // 0.3秒間「〇」または「×」を表示してからフェードアウト開始
}

// 回答をチェックする関数
function checkAnswer() {
    const currentProblem = problems[currentProblemIndex];
    const userAnswer = parseInt(document.getElementById("answerInput").value);

    if (userAnswer === currentProblem.answer) {
        showFeedback(true); // 正解のフィードバック表示
        currentProblemIndex++; // 正解の場合、次の問題に進む
    } else {
        showFeedback(false); // 不正解のフィードバック表示
        const incorrectProblem = problems.splice(currentProblemIndex, 1)[0];
        problems.push(incorrectProblem); // 間違えた問題をリストの最後に追加
        console.log(incorrectProblem);
    }

    // 回答欄をクリア
    document.getElementById("answerInput").value = "";
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


// イベントリスナー：スタート
document.getElementById("start").addEventListener("click", () => {
    isStarted = true;
    console.log(isStarted);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    createQ();
    showProblem();
});


// イベントリスナー：リセット
document.getElementById("reset").addEventListener("click", () => {
    problems = [];
    currentProblemIndex = 0;
    isStarted = false;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    document.getElementById("answerInput").value = "";  // 入力欄をクリア
    document.getElementById("problemDisplay").innerText = "";  // 問題表示をクリア
    document.getElementById("remainingDisplay").innerText = "残りの問題数: 0";  // 残り問題数をリセット
    createQ();
    showProblem();
});