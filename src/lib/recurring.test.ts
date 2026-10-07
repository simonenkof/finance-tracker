import assert from "node:assert/strict";
import { applyRecurring } from "./recurring";
import { emptyFinanceData, type FinanceData } from "./types";

function base(): FinanceData {
  return {
    ...emptyFinanceData(),
    categories: [{ id: "c1", name: "Подписки" }],
    recurring: [
      {
        id: "r1",
        period: "month",
        startDate: "2026-01-01",
        amount: 500,
        categoryId: "c1",
        comment: "Netflix",
        active: true,
        lastGeneratedDate: null,
      },
    ],
  };
}

const data = applyRecurring(base(), "2026-03-01");
assert.equal(data.operations.length, 3);
assert.deepEqual(
  data.operations.map((o) => o.date),
  ["2026-01-01", "2026-02-01", "2026-03-01"],
);
assert.equal(data.recurring[0]?.lastGeneratedDate, "2026-03-01");

const again = applyRecurring(data, "2026-03-01");
assert.equal(again.operations.length, 3);

console.log("recurring.test.ts: ok");
