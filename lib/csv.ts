import { cardCategoryLabels, rowTypeLabels, type MonthlySheet } from "./types";

export function monthlySheetToCsv(sheet: MonthlySheet) {
  const lines = [
    ["年月", "区分", "項目", "金額", "メモ", "内訳あり"],
    ...sheet.rows.map((row) => [
      sheet.yearMonth,
      rowTypeLabels[row.type],
      row.item,
      String(row.amount),
      row.memo,
      row.cardDetails.length > 0 ? "あり" : ""
    ])
  ];

  return toCsv(lines);
}

export function cardDetailsToCsv(sheet: MonthlySheet) {
  const lines = [["年月", "カード", "カテゴリ", "金額", "メモ"]];

  sheet.rows
    .filter((row) => row.type === "card_payment")
    .forEach((row) => {
      row.cardDetails.forEach((detail) => {
        lines.push([
          sheet.yearMonth,
          row.item,
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
