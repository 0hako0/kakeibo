import type { MonthlyRow, MonthlySummary, PaymentSource } from "./types";

const expenseTypes: MonthlyRow["type"][] = [
  "fixed_expense",
  "card_payment",
  "investment",
  "other_expense"
];

export function calculateSummary(
  rows: MonthlyRow[],
  previousMonthBalance: number,
  paymentSources: PaymentSource[] = []
): MonthlySummary {
  const incomeTotal = sumByType(rows, ["income"]);
  const incomeDeductionTotal = sumByType(rows, ["income_deduction"]);
  const cardPaymentTotal = sumByType(rows, ["card_payment"]);
  const investmentTotal = sumByType(rows, ["investment"]);
  const expenseRows = rows.filter((row) => expenseTypes.includes(row.type));
  const expenseTotal = expenseRows.reduce((total, row) => total + row.amount, 0);
  const monthlyBalance = incomeTotal - incomeDeductionTotal - expenseTotal;

  return {
    incomeTotal,
    incomeDeductionTotal,
    expenseTotal,
    cardPaymentTotal,
    investmentTotal,
    monthlyBalance,
    previousDiff: monthlyBalance - previousMonthBalance,
    savedAmount: Math.max(monthlyBalance, 0),
    paymentSourceExpenseTotals: calculatePaymentSourceExpenseTotals(expenseRows, paymentSources),
    householdBurdenTotal: sumByBurden(expenseRows, [
      "household",
      "household_advanced_by_husband",
      "household_advanced_by_wife"
    ]),
    husbandBurdenTotal: sumByBurden(expenseRows, ["husband"]),
    wifeBurdenTotal: sumByBurden(expenseRows, ["wife"])
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

function sumByBurden(rows: MonthlyRow[], burdens: MonthlyRow["burdenType"][]) {
  return rows
    .filter((row) => burdens.includes(row.burdenType))
    .reduce((total, row) => total + row.amount, 0);
}

function calculatePaymentSourceExpenseTotals(
  rows: MonthlyRow[],
  paymentSources: PaymentSource[]
): MonthlySummary["paymentSourceExpenseTotals"] {
  return paymentSources
    .map((source) => ({
      paymentSourceId: source.id,
      paymentSourceName: source.name,
      amount: rows
        .filter((row) => row.paymentSourceId === source.id)
        .reduce((total, row) => total + row.amount, 0)
    }))
    .filter((source) => source.amount !== 0);
}
