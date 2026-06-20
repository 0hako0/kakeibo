import { calculateSummary } from "./calculations";
import {
  burdenTypeLabels,
  cardCategoryLabels,
  rowTypeLabels,
  settlementStatusLabels,
  settlementTargetLabels,
  type MonthlySheet
} from "./types";

export function monthlySheetToCsv(sheet: MonthlySheet) {
  const summary = calculateSummary(sheet.rows, sheet.previousMonthBalance, sheet.paymentSources);
  const lines = [
    [
      "年月",
      "区分",
      "項目",
      "金額",
      "支払い元",
      "負担区分",
      "精算先",
      "精算状態",
      "メモ",
      "内訳あり"
    ],
    ...sheet.rows.map((row) => [
      sheet.yearMonth,
      rowTypeLabels[row.type],
      row.item,
      String(row.amount),
      sheet.paymentSources.find((source) => source.id === row.paymentSourceId)?.name ?? "",
      burdenTypeLabels[row.burdenType],
      settlementTargetLabels[row.settlementTarget],
      settlementStatusLabels[row.settlementStatus],
      row.memo,
      row.cardDetails.length > 0 ? "あり" : ""
    ]),
    [],
    ["年月", "集計項目", "金額", "", "", "", "", "", "", ""],
    summaryLine(sheet.yearMonth, "収入合計", summary.incomeTotal),
    summaryLine(sheet.yearMonth, "収入控除合計", summary.incomeDeductionTotal),
    summaryLine(sheet.yearMonth, "家計支出合計", summary.expenseTotal),
    summaryLine(sheet.yearMonth, "カード引落合計", summary.cardPaymentTotal),
    summaryLine(sheet.yearMonth, "投資合計", summary.investmentTotal),
    summaryLine(sheet.yearMonth, "月間残高", summary.monthlyBalance),
    summaryLine(sheet.yearMonth, "前月比", summary.previousDiff),
    summaryLine(sheet.yearMonth, "貯金できた金額", summary.savedAmount),
    summaryLine(sheet.yearMonth, "家計負担額", summary.householdBurdenTotal),
    summaryLine(sheet.yearMonth, "夫負担額", summary.husbandBurdenTotal),
    summaryLine(sheet.yearMonth, "妻負担額", summary.wifeBurdenTotal),
    summaryLine(sheet.yearMonth, "夫立替合計", summary.husbandAdvanceTotal),
    summaryLine(sheet.yearMonth, "妻立替合計", summary.wifeAdvanceTotal),
    summaryLine(sheet.yearMonth, "夫へ精算すべき金額", summary.amountToSettleToHusband),
    summaryLine(sheet.yearMonth, "妻へ精算すべき金額", summary.amountToSettleToWife),
    summaryLine(sheet.yearMonth, "精算後の家計残高", summary.householdBalanceAfterSettlement),
    [],
    ["年月", "支払い元別支出合計", "金額", "", "", "", "", "", "", "", ""],
    ...summary.paymentSourceExpenseTotals.map((source) => [
      sheet.yearMonth,
      source.paymentSourceName,
      String(source.amount),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ])
  ];

  return toCsv(lines);
}

export function cardDetailsToCsv(sheet: MonthlySheet) {
  const lines = [
    ["年月", "カード", "支払い元", "負担区分", "精算先", "精算状態", "カテゴリ", "金額", "メモ"]
  ];

  sheet.rows
    .filter((row) => row.type === "card_payment")
    .forEach((row) => {
      row.cardDetails.forEach((detail) => {
        lines.push([
          sheet.yearMonth,
          row.item,
          sheet.paymentSources.find((source) => source.id === row.paymentSourceId)?.name ?? "",
          burdenTypeLabels[row.burdenType],
          settlementTargetLabels[row.settlementTarget],
          settlementStatusLabels[row.settlementStatus],
          cardCategoryLabels[detail.category],
          String(detail.amount),
          detail.memo
        ]);
      });
    });

  return toCsv(lines);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(lines: string[][]) {
  return lines.map((line) => line.map(escapeCell).join(",")).join("\n");
}

function summaryLine(yearMonth: string, label: string, amount: number) {
  return [yearMonth, label, String(amount), "", "", "", "", "", "", "", ""];
}

function escapeCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
