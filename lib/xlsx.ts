import { calculateSummary } from "./calculations";
import { formatCurrency } from "./format";
import {
  burdenTypeLabels,
  rowTypeLabels,
  settlementStatusLabels,
  settlementTargetLabels,
  type MonthlyRow,
  type MonthlySheet
} from "./types";

type ExcelJs = typeof import("exceljs");
type Worksheet = import("exceljs").Worksheet;
type Cell = import("exceljs").Cell;

const borderStyle = {
  top: { style: "thin" as const, color: { argb: "FFD8DEE6" } },
  left: { style: "thin" as const, color: { argb: "FFD8DEE6" } },
  bottom: { style: "thin" as const, color: { argb: "FFD8DEE6" } },
  right: { style: "thin" as const, color: { argb: "FFD8DEE6" } }
};

export async function downloadMonthlyXlsx(sheet: MonthlySheet) {
  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "月末家計簿";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("月次シート", {
    views: [{ state: "frozen", ySplit: 17 }]
  });

  buildMonthlyWorksheet(ExcelJS, worksheet, sheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `monthly-sheet-${sheet.yearMonth}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildMonthlyWorksheet(ExcelJS: ExcelJs, worksheet: Worksheet, sheet: MonthlySheet) {
  const summary = calculateSummary(sheet.rows, sheet.previousMonthBalance, sheet.paymentSources);

  worksheet.properties.defaultRowHeight = 24;
  worksheet.columns = [
    { width: 18 },
    { width: 24 },
    { width: 14 },
    { width: 20 },
    { width: 22 },
    { width: 18 },
    { width: 14 },
    { width: 36 },
    { width: 12 }
  ];

  worksheet.mergeCells("A1:I1");
  worksheet.getCell("A1").value = "月末家計簿";
  worksheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FF17202A" } };
  worksheet.getCell("A2").value = "年月";
  worksheet.getCell("B2").value = sheet.yearMonth;
  worksheet.getCell("A2").font = { bold: true };

  addSummaryCards(worksheet, 4, [
    ["収入合計", summary.incomeTotal],
    ["収入控除合計", summary.incomeDeductionTotal],
    ["家計支出合計", summary.expenseTotal],
    ["カード引落合計", summary.cardPaymentTotal],
    ["投資合計", summary.investmentTotal],
    ["月間残高", summary.monthlyBalance],
    ["前月比", summary.previousDiff],
    ["貯金できた金額", summary.savedAmount]
  ]);

  worksheet.getCell("A8").value = "支払い元・負担集計";
  worksheet.getCell("A8").font = { bold: true, size: 12 };
  addSummaryCards(worksheet, 10, [
    ["家計負担額", summary.householdBurdenTotal],
    ["夫負担額", summary.husbandBurdenTotal],
    ["妻負担額", summary.wifeBurdenTotal],
    ["夫立替合計", summary.husbandAdvanceTotal],
    ["妻立替合計", summary.wifeAdvanceTotal],
    ["精算後の家計残高", summary.householdBalanceAfterSettlement],
    ["夫へ精算すべき金額", summary.amountToSettleToHusband],
    ["妻へ精算すべき金額", summary.amountToSettleToWife]
  ]);

  addPaymentSourceTotals(worksheet, 14, summary.paymentSourceExpenseTotals);

  const tableStart = 18;
  worksheet.getCell(`A${tableStart - 2}`).value = "月次シート";
  worksheet.getCell(`A${tableStart - 2}`).font = { bold: true, size: 12 };
  worksheet.getCell(`B${tableStart - 2}`).value = "前月残高";
  worksheet.getCell(`C${tableStart - 2}`).value = sheet.previousMonthBalance;
  worksheet.getCell(`C${tableStart - 2}`).numFmt = "#,##0";

  const headers = ["区分", "項目", "金額", "支払い元", "負担区分", "精算先", "精算状態", "メモ", "内訳あり"];
  worksheet.getRow(tableStart).values = headers;
  styleHeaderRow(worksheet, tableStart, headers.length);

  sheet.rows.forEach((row, index) => {
    const rowNumber = tableStart + index + 1;
    const paymentSource = sheet.paymentSources.find((source) => source.id === row.paymentSourceId)?.name ?? "";
    worksheet.getRow(rowNumber).values = [
      rowTypeLabels[row.type],
      row.item,
      row.amount,
      paymentSource,
      burdenTypeLabels[row.burdenType],
      settlementTargetLabels[row.settlementTarget],
      settlementStatusLabels[row.settlementStatus],
      row.memo,
      row.cardDetails.length > 0 ? "あり" : ""
    ];
    styleDataRow(worksheet, rowNumber, headers.length, row);
  });

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: false };
    });
  });
  worksheet.getColumn(3).numFmt = "#,##0";
}

function addSummaryCards(worksheet: Worksheet, startRow: number, cards: Array<[string, number]>) {
  cards.forEach(([label, amount], index) => {
    const column = index + 1;
    const labelCell = worksheet.getCell(startRow, column);
    const valueCell = worksheet.getCell(startRow + 1, column);
    labelCell.value = label;
    valueCell.value = amount;
    valueCell.numFmt = "#,##0";
    [labelCell, valueCell].forEach((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFBFCFE" } };
      cell.border = borderStyle;
    });
    labelCell.font = { bold: true, size: 9, color: { argb: "FF607086" } };
    valueCell.font = { bold: true, size: 12, color: { argb: amount < 0 ? "FF0B6793" : "FF17202A" } };
    valueCell.alignment = { horizontal: "right", vertical: "middle" };
  });
}

function addPaymentSourceTotals(
  worksheet: Worksheet,
  startRow: number,
  totals: Array<{ paymentSourceName: string; amount: number }>
) {
  worksheet.getCell(startRow, 1).value = "支払い元";
  worksheet.getCell(startRow, 2).value = "支出合計";
  styleHeaderRow(worksheet, startRow, 2);

  if (totals.length === 0) {
    worksheet.getCell(startRow + 1, 1).value = "支出はまだありません。";
    return;
  }

  totals.forEach((source, index) => {
    const rowNumber = startRow + index + 1;
    worksheet.getCell(rowNumber, 1).value = source.paymentSourceName;
    worksheet.getCell(rowNumber, 2).value = source.amount;
    worksheet.getCell(rowNumber, 2).numFmt = "#,##0";
    for (let column = 1; column <= 2; column += 1) {
      worksheet.getCell(rowNumber, column).border = borderStyle;
    }
  });
}

function styleHeaderRow(worksheet: Worksheet, rowNumber: number, columnCount: number) {
  for (let column = 1; column <= columnCount; column += 1) {
    const cell = worksheet.getCell(rowNumber, column);
    cell.font = { bold: true, color: { argb: "FF34465D" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F3F7" } };
    cell.border = borderStyle;
  }
}

function styleDataRow(worksheet: Worksheet, rowNumber: number, columnCount: number, row: MonthlyRow) {
  const isAdvance =
    row.burdenType === "household_advanced_by_husband" ||
    row.burdenType === "household_advanced_by_wife";

  for (let column = 1; column <= columnCount; column += 1) {
    const cell = worksheet.getCell(rowNumber, column);
    cell.border = borderStyle;
    if (isAdvance) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFAEB" } };
    }
  }

  worksheet.getCell(rowNumber, 3).numFmt = "#,##0";
  worksheet.getCell(rowNumber, 3).alignment = { horizontal: "right", vertical: "middle" };
}
