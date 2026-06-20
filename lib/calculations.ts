import type { MonthlyRow, MonthlySummary } from "./types";

export function calculateSummary(rows: MonthlyRow[], previousMonthBalance: number): MonthlySummary {
  const incomeTotal = sumByType(rows, ["income"]);
  const cardPaymentTotal = sumByType(rows, ["card_payment"]);
  const investmentTotal = sumByType(rows, ["investment"]);
  const expenseTotal = sumByType(rows, [
    "fixed_expense",
    "card_payment",
    "investment",
    "other_expense"
  ]);
  const monthlyBalance = incomeTotal - expenseTotal;

  return {
    incomeTotal,
    expenseTotal,
    cardPaymentTotal,
    investmentTotal,
    monthlyBalance,
    previousDiff: monthlyBalance - previousMonthBalance,
    savedAmount: Math.max(monthlyBalance, 0)
  };
}

export function calculateCardDetailTotal(row: MonthlyRow) {
  return row.cardDetails.reduce((total, detail) => total + detail.amount, 0);
}

function sumByType(rows: MonthlyRow[], types: MonthlyRow["type"][]) {
  return rows
    .filter((row) => types.includes(row.type))
    .reduce((total, row) => total + row.amount, 0);
}
