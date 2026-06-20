import { createId } from "./ids";
import { defaultPaymentSourceNames, type MonthlySheet, type PaymentSource } from "./types";

export function createDefaultPaymentSources(): PaymentSource[] {
  return defaultPaymentSourceNames.map((name, index) => ({
    id: createId("source"),
    name,
    sortOrder: index
  }));
}

export function createInitialSheet(yearMonth: string): MonthlySheet {
  const rakutenId = createId("row");
  const paypayId = createId("row");
  const paymentSources = createDefaultPaymentSources();
  const householdAccount = paymentSources[0]?.id ?? "";

  return {
    id: createId("sheet"),
    yearMonth,
    previousMonthBalance: 0,
    paymentSources,
    updatedAt: new Date().toISOString(),
    rows: [
      {
        id: createId("row"),
        type: "income",
        item: "給与",
        amount: 350000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "今月給与",
        sortOrder: 0,
        cardDetails: []
      },
      {
        id: createId("row"),
        type: "fixed_expense",
        item: "家賃",
        amount: 80000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "マンション家賃",
        sortOrder: 1,
        cardDetails: []
      },
      {
        id: rakutenId,
        type: "card_payment",
        item: "楽天カード",
        amount: 52000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "先月利用分",
        sortOrder: 2,
        cardDetails: [
          { id: createId("detail"), category: "food", amount: 20000, memo: "", sortOrder: 0 },
          { id: createId("detail"), category: "daily_goods", amount: 8000, memo: "", sortOrder: 1 },
          { id: createId("detail"), category: "gasoline", amount: 5000, memo: "", sortOrder: 2 },
          { id: createId("detail"), category: "entertainment", amount: 19000, memo: "", sortOrder: 3 }
        ]
      },
      {
        id: paypayId,
        type: "card_payment",
        item: "PayPayカード",
        amount: 89000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "先月利用分",
        sortOrder: 3,
        cardDetails: []
      },
      {
        id: createId("row"),
        type: "investment",
        item: "新NISA",
        amount: 30000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "積立",
        sortOrder: 4,
        cardDetails: []
      },
      {
        id: createId("row"),
        type: "other_expense",
        item: "保険",
        amount: 12000,
        paymentSourceId: householdAccount,
        burdenType: "household",
        advancePayer: "none",
        settlementTarget: "none",
        settlementStatus: "unsettled",
        memo: "生命保険",
        sortOrder: 5,
        cardDetails: []
      }
    ]
  };
}
