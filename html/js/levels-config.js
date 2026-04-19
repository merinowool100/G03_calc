(function () {
  const PROBLEM_COUNT = 10;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function pushProblem(problems, question, answer, mother, visualMother) {
    problems.push({
      question,
      answer,
      mother,
      visualMother:
        typeof visualMother === "number" ? visualMother : Math.max(0, mother),
    });
  }

  function createBasicLevel({ count = PROBLEM_COUNT, generator }) {
    return function createProblems(problems, startIndex = 0) {
      const seen = new Set();
      let guard = 0;
      while (problems.length < count && guard < 5000) {
        const problem = generator(startIndex + problems.length);
        guard++;
        if (seen.has(problem.question)) continue;
        seen.add(problem.question);
        pushProblem(
          problems,
          problem.question,
          problem.answer,
          problem.mother,
          problem.visualMother,
        );
      }
    };
  }

  function createCarryBorrowProblems() {
    return createBasicLevel({
      generator(index) {
        let num1;
        let num2;
        const isAddition = index % 2 === 0;
        let valid;
        do {
          num1 = randomInt(10, 99);
          num2 = randomInt(10, 99);
          valid = false;
          if (isAddition) {
            valid = (num1 % 10) + (num2 % 10) >= 10 && num1 + num2 < 100;
          } else {
            valid = num1 >= num2 && num1 % 10 < num2 % 10;
          }
        } while (!valid);

        return {
          question: isAddition ? `${num1} + ${num2}` : `${num1} - ${num2}`,
          answer: isAddition ? num1 + num2 : num1 - num2,
          mother: num1,
        };
      },
    });
  }

  function createTwoDigitMixedProblems() {
    return createBasicLevel({
      generator(index) {
        let num1;
        let num2;
        const isAddition = index % 2 === 0;
        do {
          num1 = randomInt(10, 99);
          num2 = randomInt(10, 99);
        } while (
          (isAddition && num1 + num2 > 100) ||
          (!isAddition && num1 < num2)
        );

        return {
          question: isAddition ? `${num1} + ${num2}` : `${num1} - ${num2}`,
          answer: isAddition ? num1 + num2 : num1 - num2,
          mother: num1,
        };
      },
    });
  }

  function createBridgeToHundredsProblems() {
    return createBasicLevel({
      generator() {
        const mode = pick(["cross", "close"]);

        if (mode === "cross") {
          if (Math.random() > 0.5) {
            const num1 = randomInt(91, 99);
            const num2 = randomInt(101 - num1, 9);
            return {
              question: `${num1} + ${num2}`,
              answer: num1 + num2,
              mother: num1,
            };
          }
          const num1 = randomInt(101, 109);
          const num2 = randomInt(2, num1 - 99);
          return {
            question: `${num1} - ${num2}`,
            answer: num1 - num2,
            mother: num1,
            visualMother: 100,
          };
        }

        if (Math.random() > 0.5) {
          const num1 = randomInt(35, 95);
          const num2 = 100 - num1;
          return {
            question: `${num1} + ${num2}`,
            answer: 100,
            mother: num1,
          };
        }

        const base = 100;
        const num1 = randomInt(base - 5, base + 5);
        const num2 = randomInt(2, 9);
        return num1 > base
          ? {
              question: `${num1} - ${num2}`,
              answer: num1 - num2,
              mother: num1,
              visualMother: base,
            }
          : {
              question: `${num1} + ${num2}`,
              answer: num1 + num2,
              mother: num1,
              visualMother: base,
            };
      },
    });
  }

  function createThreeTermBasicProblems() {
    return createBasicLevel({
      generator(index) {
        let a;
        let b;
        let c;
        const op2 = index % 2 === 0 ? "+" : "-";
        let answer;
        do {
          a = randomInt(20, 89);
          b = randomInt(2, 19);
          c = randomInt(2, 19);
          answer = op2 === "+" ? a + b + c : a + b - c;
        } while (answer < 0 || answer > 120 || Math.abs(a + b - 100) <= 2);

        return {
          question: `${a} + ${b} ${op2} ${c}`,
          answer,
          mother: a,
        };
      },
    });
  }

  function createThreeTermRoundProblems() {
    return createBasicLevel({
      generator(index) {
        if (index % 2 === 0) {
          const base = pick([100, 200, 300, 400]);
          const a = base - randomInt(1, 9);
          const b = base - a;
          const c = randomInt(11, 39);
          return {
            question: `${a} + ${b} + ${c}`,
            answer: a + b + c,
            mother: a,
            visualMother: base,
          };
        }

        const base = pick([100, 200, 300, 400, 500, 600]);
        const a = base + randomInt(1, 9);
        const b = a - base;
        if (Math.random() > 0.5) {
          const c = randomInt(11, 39);
          return {
            question: `${a} - ${b} + ${c}`,
            answer: a - b + c,
            mother: a,
            visualMother: base,
          };
        }
        const c = randomInt(11, 29);
        return {
          question: `${a} - ${b} - ${c}`,
          answer: a - b - c,
          mother: a,
          visualMother: base,
        };
      },
    });
  }

  function createHundredsRoundingProblems() {
    return createBasicLevel({
      generator() {
        const base = pick([100, 200, 300, 400, 500, 600, 700, 800, 900]);
        const offset = randomInt(1, 9);
        const delta = randomInt(6, 39);
        if (Math.random() > 0.5) {
          const num1 = Math.random() > 0.5 ? base - offset : base + offset;
          return {
            question: `${num1} + ${delta}`,
            answer: num1 + delta,
            mother: num1,
            visualMother: base,
          };
        }
        const num1 = base + offset;
        return {
          question: `${num1} - ${delta}`,
          answer: num1 - delta,
          mother: num1,
          visualMother: base,
        };
      },
    });
  }

  function createThreeDigitByDigitsProblems(maxDigits) {
    const maxSub = maxDigits === 1 ? 9 : maxDigits === 2 ? 99 : 999;
    const minSub = maxDigits === 1 ? 2 : maxDigits === 2 ? 10 : 100;
    return createBasicLevel({
      generator(index) {
        const isAddition = index % 2 === 0;
        const num1 = randomInt(100, 999);
        let num2;
        do {
          num2 = randomInt(minSub, maxSub);
        } while (!isAddition && num2 >= num1);

        return {
          question: isAddition ? `${num1} + ${num2}` : `${num1} - ${num2}`,
          answer: isAddition ? num1 + num2 : num1 - num2,
          mother: num1,
          visualMother: Math.floor(num1 / 100) * 100,
        };
      },
    });
  }

  function createSingleDigitMultiplicationProblems(firstFactors) {
    return createBasicLevel({
      generator() {
        const a = pick(firstFactors);
        const b = randomInt(2, 10);
        return {
          question: `${a} × ${b}`,
          answer: a * b,
          mother: a,
        };
      },
    });
  }

  function createTeenBySingleMultiplicationProblems() {
    return createBasicLevel({
      generator() {
        const a = randomInt(11, 19);
        const b = randomInt(2, 9);
        return {
          question: `${a} × ${b}`,
          answer: a * b,
          mother: a,
          visualMother: a,
        };
      },
    });
  }

  function createTeenSquareProblems() {
    return createBasicLevel({
      count: 9,
      generator() {
        const a = randomInt(11, 19);
        return {
          question: `${a} × ${a}`,
          answer: a * a,
          mother: a,
          visualMother: a,
        };
      },
    });
  }

  function createDivisionFromDivisors(divisors, quotientMin, quotientMax) {
    return createBasicLevel({
      generator() {
        let divisor;
        let quotient;
        let dividend;
        do {
          divisor = pick(divisors);
          quotient = randomInt(quotientMin, quotientMax);
          dividend = divisor * quotient;
        } while (quotient === 10);
        return {
          question: `${dividend} ÷ ${divisor}`,
          answer: quotient,
          mother: dividend,
          visualMother: Math.min(dividend, 100),
        };
      },
    });
  }

  function canFitTenByTenArea(value) {
    for (let a = 1; a <= 10; a++) {
      if (value % a !== 0) continue;
      const b = value / a;
      if (b <= 10) return true;
    }
    return false;
  }

  function createGridDivisionProblems(divisors, quotientMin, quotientMax) {
    return createBasicLevel({
      generator() {
        let divisor;
        let quotient;
        let dividend;
        do {
          divisor = pick(divisors);
          quotient = randomInt(quotientMin, quotientMax);
          dividend = divisor * quotient;
        } while (!canFitTenByTenArea(dividend) || quotient === 10);

        return {
          question: `${dividend} ÷ ${divisor}`,
          answer: quotient,
          mother: dividend,
          visualMother: dividend,
        };
      },
    });
  }

  function createChunkDivisionProblems() {
    const dividends = [40, 60, 80, 90, 100, 120, 150, 180, 200];
    return createBasicLevel({
      generator() {
        let dividend;
        let divisor;
        do {
          dividend = pick(dividends);
          divisor = randomInt(2, 10);
        } while (
          dividend % divisor !== 0 ||
          dividend / divisor > 30 ||
          dividend / divisor === 10
        );
        return {
          question: `${dividend} ÷ ${divisor}`,
          answer: dividend / divisor,
          mother: dividend,
          visualMother: Math.min(dividend, 100),
        };
      },
    });
  }

  function createSplitDivisionProblems() {
    const bigParts = [60, 80, 90, 100, 120, 150, 180];
    return createBasicLevel({
      generator() {
        let divisor;
        let part1;
        let part2;
        do {
          divisor = randomInt(2, 9);
          part1 = pick(bigParts);
          part2 = divisor * randomInt(1, 8);
        } while (
          part1 % divisor !== 0 ||
          part1 + part2 > 180 ||
          (part1 + part2) / divisor === 10
        );
        const dividend = part1 + part2;
        return {
          question: `${dividend} ÷ ${divisor}`,
          answer: dividend / divisor,
          mother: dividend,
          visualMother: Math.min(dividend, 100),
        };
      },
    });
  }

  function createLargeRoundDivisionProblems() {
    const dividends = [100, 120, 150, 180, 200, 240, 270, 300, 320, 360, 400];
    return createBasicLevel({
      generator() {
        let dividend;
        let divisor;
        do {
          dividend = pick(dividends);
          divisor = randomInt(2, 10);
        } while (dividend % divisor !== 0 || dividend / divisor === 10);
        return {
          question: `${dividend} ÷ ${divisor}`,
          answer: dividend / divisor,
          mother: dividend,
          visualMother: 100,
        };
      },
    });
  }

  function createMixedProblems(builders) {
    return function createProblems(problems) {
      const seen = new Set();
      let guard = 0;
      while (problems.length < PROBLEM_COUNT && guard < 5000) {
        const builder = pick(builders);
        const scratch = [];
        builder(scratch, problems.length);
        const problem = scratch[0];
        guard++;
        if (!problem || seen.has(problem.question)) continue;
        seen.add(problem.question);
        problems.push(problem);
      }
    };
  }

  window.LEVEL_DEFS = {
    1: {
      label: "Lv.1",
      storageKey: "bestRecord1",
      grid: "5",
      motherMode: "5",
      createProblems: createBasicLevel({
        generator() {
          const a = randomInt(1, 9);
          const b = randomInt(1, 9);
          return { question: `${a} + ${b}`, answer: a + b, mother: a };
        },
      }),
    },
    2: {
      label: "Lv.2",
      storageKey: "bestRecord2",
      grid: "5",
      motherMode: "5",
      createProblems: createBasicLevel({
        generator() {
          let a;
          let b;
          do {
            a = randomInt(1, 20);
            b = randomInt(1, 10);
          } while (a <= b);
          return { question: `${a} - ${b}`, answer: a - b, mother: a };
        },
      }),
    },
    3: {
      label: "Lv.3",
      storageKey: "bestRecord3",
      grid: "5",
      motherMode: "5",
      createProblems: createBasicLevel({
        generator() {
          const a = randomInt(11, 20);
          return { question: `${a} + 5`, answer: a + 5, mother: a };
        },
      }),
    },
    4: {
      label: "Lv.4",
      storageKey: "bestRecord4",
      grid: "5",
      motherMode: "10",
      createProblems: createBasicLevel({
        generator() {
          const a = randomInt(11, 20);
          return { question: `${a} - 5`, answer: a - 5, mother: a };
        },
      }),
    },
    5: {
      label: "Lv.5",
      storageKey: "bestRecord5",
      grid: "5",
      motherMode: "5",
      createProblems: createBasicLevel({
        generator() {
          let a;
          let b;
          do {
            a = randomInt(11, 20);
            b = randomInt(1, 10);
          } while (a + b > 20);
          return { question: `${a} + ${b}`, answer: a + b, mother: a };
        },
      }),
    },
    6: {
      label: "Lv.6",
      storageKey: "bestRecord6",
      grid: "5",
      motherMode: "5",
      createProblems: createBasicLevel({
        generator() {
          let a;
          let b;
          do {
            a = randomInt(11, 20);
            b = randomInt(1, 10);
          } while (a < b || b === 5);
          return { question: `${a} - ${b}`, answer: a - b, mother: a };
        },
      }),
    },
    7: {
      label: "Lv.7",
      storageKey: "bestRecord7",
      grid: "10",
      motherMode: "10",
      createProblems: createCarryBorrowProblems(),
    },
    8: {
      label: "Lv.8",
      storageKey: "bestRecord8",
      legacyStorageKeys: ["bestRecord"],
      grid: "10",
      motherMode: "10",
      createProblems: createTwoDigitMixedProblems(),
    },
    9: {
      label: "Lv.9",
      storageKey: "bestRecord9",
      grid: "10",
      motherMode: "10",
      createProblems: createBasicLevel({
        generator(index) {
          if (index % 2 === 0) {
            let a;
            do {
              a = randomInt(12, 98);
            } while (a % 10 === 0);
            const b = randomInt(10 - (a % 10), 9);
            return { question: `${a} + ${b}`, answer: a + b, mother: a };
          }
          let a;
          do {
            a = randomInt(20, 99);
          } while (a % 10 === 9);
          const b = randomInt((a % 10) + 1, 9);
          return { question: `${a} - ${b}`, answer: a - b, mother: a };
        },
      }),
    },
    10: {
      label: "Lv.10",
      storageKey: "bestRecord10",
      legacyStorageKeys: ["bestRecord11"],
      grid: "10",
      motherMode: "10",
      createProblems: createThreeTermBasicProblems(),
    },
    11: {
      label: "Lv.11",
      storageKey: "bestRecord11",
      legacyStorageKeys: ["bestRecord12"],
      grid: "10",
      motherMode: "10",
      createProblems: createThreeTermRoundProblems(),
    },
    12: {
      label: "Lv.12",
      storageKey: "bestRecord12",
      legacyStorageKeys: ["bestRecord13", "bestRecord14"],
      grid: "10",
      motherMode: "10",
      createProblems: createThreeDigitByDigitsProblems(1),
    },
    13: {
      label: "Lv.13",
      storageKey: "bestRecord13",
      legacyStorageKeys: ["bestRecord15"],
      grid: "10",
      motherMode: "10",
      createProblems: createThreeDigitByDigitsProblems(2),
    },
    14: {
      label: "Lv.14",
      storageKey: "bestRecord14",
      legacyStorageKeys: ["bestRecord16"],
      grid: "10",
      motherMode: "10",
      createProblems: createThreeDigitByDigitsProblems(3),
    },
    15: {
      label: "Lv.15",
      storageKey: "bestRecord15",
      legacyStorageKeys: ["bestRecord17"],
      grid: "10",
      motherMode: "10",
      createProblems: createMixedProblems([
        createThreeDigitByDigitsProblems(1),
        createThreeDigitByDigitsProblems(2),
        createThreeDigitByDigitsProblems(3),
      ]),
    },
    16: {
      label: "Lv.16",
      storageKey: "bestRecord16",
      legacyStorageKeys: ["bestRecord18"],
      grid: "10",
      motherMode: "10",
      createProblems: createSingleDigitMultiplicationProblems([2, 5, 10]),
    },
    17: {
      label: "Lv.17",
      storageKey: "bestRecord17",
      legacyStorageKeys: ["bestRecord19"],
      grid: "10",
      motherMode: "10",
      createProblems: createSingleDigitMultiplicationProblems([3, 4]),
    },
    18: {
      label: "Lv.18",
      storageKey: "bestRecord18",
      legacyStorageKeys: ["bestRecord20"],
      grid: "10",
      motherMode: "10",
      createProblems: createSingleDigitMultiplicationProblems([6, 7, 8, 9]),
    },
    19: {
      label: "Lv.19",
      storageKey: "bestRecord19",
      legacyStorageKeys: ["bestRecord21"],
      grid: "10",
      motherMode: "10",
      createProblems: createMixedProblems([
        createSingleDigitMultiplicationProblems([2, 5, 10]),
        createSingleDigitMultiplicationProblems([3, 4]),
        createSingleDigitMultiplicationProblems([6, 7, 8, 9]),
      ]),
    },
    20: {
      label: "Lv.20",
      storageKey: "bestRecord20",
      legacyStorageKeys: ["bestRecord22"],
      grid: "10",
      motherMode: "10",
      createProblems: createTeenBySingleMultiplicationProblems(),
    },
    21: {
      label: "Lv.21",
      storageKey: "bestRecord21",
      legacyStorageKeys: ["bestRecord23"],
      problemCount: 9,
      grid: "10",
      motherMode: "10",
      createProblems: createTeenSquareProblems(),
    },
    22: {
      label: "Lv.22",
      storageKey: "bestRecord22",
      legacyStorageKeys: ["bestRecord24", "bestRecord28"],
      grid: "10",
      motherMode: "10",
      createProblems: createGridDivisionProblems([2, 5], 2, 20),
    },
    23: {
      label: "Lv.23",
      storageKey: "bestRecord23",
      legacyStorageKeys: ["bestRecord25", "bestRecord29"],
      grid: "10",
      motherMode: "10",
      createProblems: createGridDivisionProblems([3, 4], 2, 20),
    },
    24: {
      label: "Lv.24",
      storageKey: "bestRecord24",
      legacyStorageKeys: ["bestRecord26", "bestRecord30"],
      grid: "10",
      motherMode: "10",
      createProblems: createGridDivisionProblems([6, 7, 8, 9], 2, 12),
    },
    25: {
      label: "Lv.25",
      storageKey: "bestRecord25",
      grid: "10",
      motherMode: "10",
      createProblems: createMixedProblems([
        createGridDivisionProblems([2, 5], 2, 20),
        createGridDivisionProblems([3, 4], 2, 20),
        createGridDivisionProblems([6, 7, 8, 9], 2, 12),
      ]),
    },
  };
})();
