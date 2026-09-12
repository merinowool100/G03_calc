(function () {
  const PROBLEM_COUNT_IMAGETORE = 10;
  const PROBLEM_COUNT_FOUR_PLACE = 8;
  const PROBLEM_COUNT_TODAY = 88;

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

  // 添付画像のフォープレイス8問（0=空、redsは赤マス座標 [row,col]）
  const FOUR_PLACE_PUZZLES = [
    {
      grid: [
        [0, 1, 4, 0],
        [2, 0, 0, 1],
        [0, 3, 0, 4],
        [0, 2, 1, 0],
      ],
      reds: [
        [0, 0],
        [2, 2],
      ],
      answer: 5,
    },
    {
      grid: [
        [1, 0, 2, 0],
        [0, 3, 0, 1],
        [0, 1, 0, 2],
        [3, 0, 1, 0],
      ],
      reds: [
        [0, 3],
        [2, 0],
      ],
      answer: 7,
    },
    {
      grid: [
        [4, 0, 1, 0],
        [0, 3, 0, 2],
        [2, 0, 0, 1],
        [3, 1, 0, 0],
      ],
      reds: [
        [1, 0],
        [3, 3],
      ],
      answer: 5,
    },
    {
      grid: [
        [2, 0, 0, 4],
        [0, 4, 3, 0],
        [3, 0, 4, 0],
        [4, 0, 0, 3],
      ],
      reds: [
        [1, 3],
        [2, 1],
      ],
      answer: 4,
    },
    {
      grid: [
        [0, 1, 3, 0],
        [3, 0, 0, 4],
        [1, 0, 0, 3],
        [0, 3, 4, 0],
      ],
      reds: [
        [0, 0],
        [3, 3],
      ],
      answer: 5,
    },
    {
      grid: [
        [2, 3, 0, 0],
        [0, 0, 3, 2],
        [0, 2, 4, 0],
        [1, 0, 0, 3],
      ],
      reds: [
        [0, 2],
        [2, 0],
      ],
      answer: 4,
    },
    {
      grid: [
        [0, 3, 1, 0],
        [2, 0, 0, 4],
        [1, 0, 0, 3],
        [0, 2, 4, 0],
      ],
      reds: [
        [0, 0],
        [3, 3],
      ],
      answer: 5,
    },
    {
      grid: [
        [4, 0, 2, 3],
        [0, 2, 0, 0],
        [0, 0, 4, 0],
        [1, 4, 0, 2],
      ],
      reds: [
        [1, 3],
        [2, 0],
      ],
      answer: 6,
    },
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

  function createFourPlaceProblems() {
    return FOUR_PLACE_PUZZLES.map((puzzle, index) => ({
      type: "fourPlace",
      question: `フォープレイス ${index + 1}`,
      blankFormat: true,
      grid: puzzle.grid.map((row) => row.slice()),
      reds: puzzle.reds.map((cell) => cell.slice()),
      answer: puzzle.answer,
    }));
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
