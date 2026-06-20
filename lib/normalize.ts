import { createDefaultPaymentSources } from "./fixtures";
import type { MonthlyRow, MonthlySheet, PaymentSource } from "./types";

export function normalizeSheet(sheet: MonthlySheet): MonthlySheet {
  const paymentSources =
    sheet.paymentSources && sheet.paymentSources.length > 0
      ? sheet.paymentSources.map(normalizePaymentSource)
      : createDefaultPaymentSources();
  const defaultPaymentSourceId = paymentSources[0]?.id ?? "";

  return {
    ...sheet,
    paymentSources,
    rows: sheet.rows.map((row) => normalizeRow(row, defaultPaymentSourceId))
  };
}

function normalizePaymentSource(source: PaymentSource, index: number): PaymentSource {
  return {
    ...source,
    sortOrder: source.sortOrder ?? index
  };
}

function normalizeRow(row: MonthlyRow, defaultPaymentSourceId: string): MonthlyRow {
  const burdenType = row.burdenType || "household";
  const isHusbandAdvance = burdenType === "household_advanced_by_husband";
  const isWifeAdvance = burdenType === "household_advanced_by_wife";

  return {
    ...row,
    paymentSourceId: row.paymentSourceId || defaultPaymentSourceId,
    burdenType,
    advancePayer: isHusbandAdvance ? "husband" : isWifeAdvance ? "wife" : "none",
    settlementTarget: isHusbandAdvance ? "husband" : isWifeAdvance ? "wife" : "none",
    settlementStatus: row.settlementStatus || "unsettled",
    cardDetails: row.cardDetails ?? []
  };
}
