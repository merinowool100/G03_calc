(function () {
  const PROBLEM_COUNT_IMAGETORE = 10;

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

  window.GAME_MODES = {
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
