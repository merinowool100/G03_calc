(function () {
  const PROBLEM_COUNT_IMAGETORE = 10;
  const PROBLEM_COUNT_FOUR_PLACE = 8;
  const PROBLEM_COUNT_TODAY = 88;
  const FOUR_PLACE_SIZE = 4;
  const FOUR_PLACE_BOX = 2;
  const FOUR_PLACE_GIVEN_COUNT = 8;

  const SPECIAL_MULTIPLICATIONS = [
    { a: 11, b: 11 },
    { a: 12, b: 12 },
    { a: 13, b: 13 },
    { a: 25, b: 4 },
    { a: 25, b: 8 },
    { a: 50, b: 2 },
    { a: 50, b: 4 },
    { a: 75, b: 2 },
  ];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function emptyFourPlaceGrid() {
    return Array.from({ length: FOUR_PLACE_SIZE }, () =>
      Array(FOUR_PLACE_SIZE).fill(0),
    );
  }

  function isValidFourPlacePlacement(grid, row, col, value) {
    for (let i = 0; i < FOUR_PLACE_SIZE; i++) {
      if (grid[row][i] === value || grid[i][col] === value) return false;
    }
    const boxRow = Math.floor(row / FOUR_PLACE_BOX) * FOUR_PLACE_BOX;
    const boxCol = Math.floor(col / FOUR_PLACE_BOX) * FOUR_PLACE_BOX;
    for (let r = boxRow; r < boxRow + FOUR_PLACE_BOX; r++) {
      for (let c = boxCol; c < boxCol + FOUR_PLACE_BOX; c++) {
        if (grid[r][c] === value) return false;
      }
    }
    return true;
  }

  function findEmptyFourPlaceCell(grid) {
    for (let row = 0; row < FOUR_PLACE_SIZE; row++) {
      for (let col = 0; col < FOUR_PLACE_SIZE; col++) {
        if (grid[row][col] === 0) return [row, col];
      }
    }
    return null;
  }

  function fillFourPlaceGrid(grid) {
    const empty = findEmptyFourPlaceCell(grid);
    if (!empty) return true;
    const [row, col] = empty;
    const candidates = shuffle([1, 2, 3, 4]);
    for (let i = 0; i < candidates.length; i++) {
      const value = candidates[i];
      if (!isValidFourPlacePlacement(grid, row, col, value)) continue;
      grid[row][col] = value;
      if (fillFourPlaceGrid(grid)) return true;
      grid[row][col] = 0;
    }
    return false;
  }

  function createSolvedFourPlaceGrid() {
    const grid = emptyFourPlaceGrid();
    fillFourPlaceGrid(grid);
    return grid;
  }

  function countFourPlaceSolutions(grid, limit) {
    let count = 0;
    function dfs() {
      if (count >= limit) return;
      const empty = findEmptyFourPlaceCell(grid);
      if (!empty) {
        count++;
        return;
      }
      const [row, col] = empty;
      for (let value = 1; value <= FOUR_PLACE_SIZE; value++) {
        if (!isValidFourPlacePlacement(grid, row, col, value)) continue;
        grid[row][col] = value;
        dfs();
        grid[row][col] = 0;
        if (count >= limit) return;
      }
    }
    dfs();
    return count;
  }

  function digFourPlacePuzzle(solution, givenCount) {
    const puzzle = cloneGrid(solution);
    const positions = shuffle(
      Array.from({ length: FOUR_PLACE_SIZE * FOUR_PLACE_SIZE }, (_, i) => [
        Math.floor(i / FOUR_PLACE_SIZE),
        i % FOUR_PLACE_SIZE,
      ]),
    );
    let remaining = FOUR_PLACE_SIZE * FOUR_PLACE_SIZE;
    for (let i = 0; i < positions.length && remaining > givenCount; i++) {
      const [row, col] = positions[i];
      const backup = puzzle[row][col];
      puzzle[row][col] = 0;
      const probe = cloneGrid(puzzle);
      if (countFourPlaceSolutions(probe, 2) !== 1) {
        puzzle[row][col] = backup;
      } else {
        remaining--;
      }
    }
    return puzzle;
  }

  function pickTwoRedCells(puzzle, solution) {
    const empties = [];
    for (let row = 0; row < FOUR_PLACE_SIZE; row++) {
      for (let col = 0; col < FOUR_PLACE_SIZE; col++) {
        if (puzzle[row][col] === 0) empties.push([row, col]);
      }
    }
    shuffle(empties);
    if (empties.length < 2) return null;
    const reds = [empties[0], empties[1]];
    const answer =
      solution[reds[0][0]][reds[0][1]] + solution[reds[1][0]][reds[1][1]];
    return { reds, answer };
  }

  function createRandomFourPlacePuzzle() {
    for (let attempt = 0; attempt < 40; attempt++) {
      const solution = createSolvedFourPlaceGrid();
      const grid = digFourPlacePuzzle(solution, FOUR_PLACE_GIVEN_COUNT);
      const redInfo = pickTwoRedCells(grid, solution);
      if (!redInfo) continue;
      const probe = cloneGrid(grid);
      if (countFourPlaceSolutions(probe, 2) !== 1) continue;
      return {
        grid,
        reds: redInfo.reds,
        answer: redInfo.answer,
      };
    }
    // 万一失敗したら、解盤面から最低限の穴あきを作る
    const solution = createSolvedFourPlaceGrid();
    const grid = cloneGrid(solution);
    const reds = [
      [0, 0],
      [3, 3],
    ];
    grid[0][0] = 0;
    grid[3][3] = 0;
    return {
      grid,
      reds,
      answer: solution[0][0] + solution[3][3],
    };
  }

  function createFourPlaceProblems() {
    const problems = [];
    for (let i = 0; i < PROBLEM_COUNT_FOUR_PLACE; i++) {
      const puzzle = createRandomFourPlacePuzzle();
      problems.push({
        type: "fourPlace",
        question: `フォープレイス ${i + 1}`,
        blankFormat: true,
        grid: puzzle.grid,
        reds: puzzle.reds,
        answer: puzzle.answer,
      });
    }
    return problems;
  }

  function createImagetoreProblems(problems) {
    const pool = [];
    for (let a = 2; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        pool.push({
          question: `${a} × ${b}`,
          answer: a * b,
          factorA: a,
          factorB: b,
        });
      }
    }
    shuffle(pool);
    for (let i = 0; i < PROBLEM_COUNT_IMAGETORE && i < pool.length; i++) {
      problems.push(pool[i]);
    }
  }

  function createMasterProblems(table) {
    return function createProblems(problems) {
      for (let b = 1; b <= 9; b++) {
        problems.push({
          question: `${table} × ${b}`,
          answer: table * b,
        });
      }
    };
  }

  function createKukuProblems() {
    const pool = [];
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        const product = a * b;
        // 穴埋め位置をランダムに（例: 3 × □ = 12 / □ × 4 = 12）
        if (Math.random() < 0.5) {
          pool.push({
            question: `${a} × □ = ${product}`,
            answer: b,
            blankFormat: true,
          });
        } else {
          pool.push({
            question: `□ × ${b} = ${product}`,
            answer: a,
            blankFormat: true,
          });
        }
      }
    }
    return shuffle(pool);
  }

  function createSpecialMultiplicationProblems(count) {
    const pool = SPECIAL_MULTIPLICATIONS.map(({ a, b }) => ({
      question: `${a} × ${b}`,
      answer: a * b,
    }));
    shuffle(pool);
    return pool.slice(0, count);
  }

  function createTwoDigitAddition(withCarry) {
    let a;
    let b;
    do {
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      const onesCarry = (a % 10) + (b % 10) >= 10;
      if (withCarry === onesCarry) break;
    } while (true);
    return {
      question: `${a} + ${b}`,
      answer: a + b,
    };
  }

  function createTwoDigitSubtraction(withBorrow) {
    let a;
    let b;
    do {
      a = randomInt(10, 99);
      b = randomInt(10, 99);
      if (a < b) continue;
      const onesBorrow = a % 10 < b % 10;
      if (withBorrow === onesBorrow) break;
    } while (true);
    return {
      question: `${a} − ${b}`,
      answer: a - b,
    };
  }

  function createTwoDigitAddSubProblems() {
    const problems = [
      createTwoDigitAddition(true),
      createTwoDigitAddition(true),
      createTwoDigitAddition(true),
      createTwoDigitAddition(true),
      createTwoDigitAddition(false),
      createTwoDigitSubtraction(true),
      createTwoDigitSubtraction(true),
      createTwoDigitSubtraction(true),
      createTwoDigitSubtraction(true),
      createTwoDigitSubtraction(false),
    ];
    return shuffle(problems);
  }

  function createTodayChallengeProblems(problems) {
    const fourPlace = createFourPlaceProblems();
    const kuku = createKukuProblems();
    const special = createSpecialMultiplicationProblems(6);
    const addSub = createTwoDigitAddSubProblems();
    problems.push(...fourPlace, ...kuku, ...special, ...addSub);
  }

  window.GAME_MODES = {
    today: {
      label: "今日のチャレンジ",
      summary: "フォープレイス・九九穴埋め・特殊な掛け算・2桁の加減 88問",
      type: "master",
      storageKey: "bestRecordTodayChallenge",
      problemCount: PROBLEM_COUNT_TODAY,
      remnantLabel: "Rem.",
      createProblems: createTodayChallengeProblems,
    },
    imagetore: {
      label: "イメトレ",
      summary: "マス目を塗って答える",
      type: "imagetore",
      storageKey: "bestRecordImagetore",
      problemCount: PROBLEM_COUNT_IMAGETORE,
      remnantLabel: "Rem.",
      createProblems: createImagetoreProblems,
    },
    master2: {
      label: "2の段",
      summary: "2 × 1 〜 2 × 9",
      type: "master",
      table: 2,
      storageKey: "bestRecordMaster2",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(2),
    },
    master3: {
      label: "3の段",
      summary: "3 × 1 〜 3 × 9",
      type: "master",
      table: 3,
      storageKey: "bestRecordMaster3",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(3),
    },
    master4: {
      label: "4の段",
      summary: "4 × 1 〜 4 × 9",
      type: "master",
      table: 4,
      storageKey: "bestRecordMaster4",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(4),
    },
    master5: {
      label: "5の段",
      summary: "5 × 1 〜 5 × 9",
      type: "master",
      table: 5,
      storageKey: "bestRecordMaster5",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(5),
    },
    master6: {
      label: "6の段",
      summary: "6 × 1 〜 6 × 9",
      type: "master",
      table: 6,
      storageKey: "bestRecordMaster6",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(6),
    },
    master7: {
      label: "7の段",
      summary: "7 × 1 〜 7 × 9",
      type: "master",
      table: 7,
      storageKey: "bestRecordMaster7",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(7),
    },
    master8: {
      label: "8の段",
      summary: "8 × 1 〜 8 × 9",
      type: "master",
      table: 8,
      storageKey: "bestRecordMaster8",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(8),
    },
    master9: {
      label: "9の段",
      summary: "9 × 1 〜 9 × 9",
      type: "master",
      table: 9,
      storageKey: "bestRecordMaster9",
      problemCount: 9,
      remnantLabel: "Rem.",
      createProblems: createMasterProblems(9),
    },
  };
})();
