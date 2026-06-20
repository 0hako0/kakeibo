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
    ["月末家計簿", "", "", "", "", "", "", "", "", ""],
    ["年月", sheet.yearMonth, "", "", "", "", "", "", "", ""],
    [],
    [
      "収入合計",
      "収入控除合計",
      "家計支出合計",
      "カード引落合計",
      "投資合計",
      "月間残高",
      "前月比",
      "貯金できた金額",
      "",
      ""
    ],
    [
      String(summary.incomeTotal),
      String(summary.incomeDeductionTotal),
      String(summary.expenseTotal),
      String(summary.cardPaymentTotal),
      String(summary.investmentTotal),
      String(summary.monthlyBalance),
      String(summary.previousDiff),
      String(summary.savedAmount),
      "",
      ""
    ],
    [],
    ["支払い元・負担集計", "", "", "", "", "", "", "", "", ""],
    [
      "家計負担額",
      "夫負担額",
      "妻負担額",
      "夫立替合計",
      "妻立替合計",
      "精算後の家計残高",
      "夫へ精算すべき金額",
      "妻へ精算すべき金額",
      "",
      ""
    ],
    [
      String(summary.householdBurdenTotal),
      String(summary.husbandBurdenTotal),
      String(summary.wifeBurdenTotal),
      String(summary.husbandAdvanceTotal),
      String(summary.wifeAdvanceTotal),
      String(summary.householdBalanceAfterSettlement),
      String(summary.amountToSettleToHusband),
      String(summary.amountToSettleToWife),
      "",
      ""
    ],
    [],
    ["支払い元", "支出合計", "", "", "", "", "", "", "", ""],
    ...summary.paymentSourceExpenseTotals.map((source) => [
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
    ]),
    [],
    ["月次シート", "", "", "", "", "", "", "", "", ""],
    ["前月残高", String(sheet.previousMonthBalance), "", "", "", "", "", "", "", ""],
    [
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
      rowTypeLabels[row.type],
      row.item,
      String(row.amount),
      sheet.paymentSources.find((source) => source.id === row.paymentSourceId)?.name ?? "",
      burdenTypeLabels[row.burdenType],
      settlementTargetLabels[row.settlementTarget],
      settlementStatusLabels[row.settlementStatus],
      row.memo,
      row.cardDetails.length > 0 ? "あり" : ""
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

function escapeCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}
