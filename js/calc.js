// 問題を格納するリスト
const problems = [];

// 二桁の足し算と引き算の問題をランダムに10問作成
for (let i = 0; i < 10; i++) {
    let num1, num2, isAddition;
    do {
        num1 = Math.floor(Math.random() * 90) + 10; // 10から99の範囲
        num2 = Math.floor(Math.random() * 90) + 10;
        isAddition = Math.random() > 0.5; // 足し算と引き算を半々で選ぶ
    } while ((isAddition && num1 + num2 > 100) || (!isAddition && num1 < num2));

    if (isAddition) {
        problems.push({ question: `${num1} + ${num2}`, answer: num1 + num2 });
    } else {
        problems.push({ question: `${num1} - ${num2}`, answer: num1 - num2 });
    }
}

let currentProblemIndex = 0; // 現在の問題のインデックス

// 残りの問題数を更新する関数
function updateRemainingDisplay() {
    const remainingProblems = problems.length - currentProblemIndex;
    document.getElementById("remainingDisplay").innerText = `残りの問題数: ${remainingProblems}`;
}

// 現在の問題を表示する関数
function showProblem() {
    const currentProblem = problems[currentProblemIndex];
    document.getElementById("problemDisplay").innerText = `Q: ${currentProblem.question} =`;
    updateRemainingDisplay(); // 残りの問題数を更新
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
        feedback.innerText = "〇"; // 正解のフィードバック
        feedback.style.color = "green";
    } else {
        feedback.innerText = "×"; // 不正解のフィードバック
        feedback.style.color = "red";
        // 正しい答えもフィードバックに表示
        feedback.innerText += `${currentProblem.answer}`;
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
                document.getElementById("problemDisplay").innerText = "すべての問題が終了しました！";
                document.getElementById("submitAnswerButton").disabled = true;
            }
        }, 1000); // フェードアウト後に完全非表示
    }, 1000); // 1秒間「〇」または「×」を表示してからフェードアウト開始
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

// 最初の問題を表示
showProblem();