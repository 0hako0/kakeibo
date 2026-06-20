export type RowType =
  | "income"
  | "income_deduction"
  | "fixed_expense"
  | "card_payment"
  | "investment"
  | "other_expense";

export type CardCategory =
  | "food"
  | "daily_goods"
  | "dining"
  | "cat_goods"
  | "gasoline"
  | "medical"
  | "entertainment"
  | "communication"
  | "other";

export type BurdenType =
  | "household"
  | "husband"
  | "wife"
  | "household_advanced_by_husband"
  | "household_advanced_by_wife";

export type AdvancePayer = "none" | "husband" | "wife";
export type SettlementTarget = "none" | "husband" | "wife" | "household";
export type SettlementStatus = "unsettled" | "partially_settled" | "settled";

export type PaymentSource = {
  id: string;
  name: string;
  sortOrder: number;
};

export type MonthlyRow = {
  id: string;
  type: RowType;
  item: string;
  amount: number;
  paymentSourceId: string;
  burdenType: BurdenType;
  advancePayer: AdvancePayer;
  settlementTarget: SettlementTarget;
  settlementStatus: SettlementStatus;
  memo: string;
  sortOrder: number;
  cardDetails: CardDetail[];
};

export type CardDetail = {
  id: string;
  category: CardCategory;
  amount: number;
  memo: string;
  sortOrder: number;
};

export type MonthlySheet = {
  id: string;
  yearMonth: string;
  previousMonthBalance: number;
  paymentSources: PaymentSource[];
  rows: MonthlyRow[];
  updatedAt: string;
};

export type MonthlySummary = {
  incomeTotal: number;
  incomeDeductionTotal: number;
  expenseTotal: number;
  cardPaymentTotal: number;
  investmentTotal: number;
  monthlyBalance: number;
  previousDiff: number;
  savedAmount: number;
  paymentSourceExpenseTotals: Array<{
    paymentSourceId: string;
    paymentSourceName: string;
    amount: number;
  }>;
  householdBurdenTotal: number;
  husbandBurdenTotal: number;
  wifeBurdenTotal: number;
  husbandAdvanceTotal: number;
  wifeAdvanceTotal: number;
  amountToSettleToHusband: number;
  amountToSettleToWife: number;
  householdBalanceAfterSettlement: number;
};

export const rowTypeLabels: Record<RowType, string> = {
  income: "収入",
  income_deduction: "収入控除",
  fixed_expense: "固定支出",
  card_payment: "カード引落",
  investment: "投資",
  other_expense: "その他支出"
};

export const rowTypeOptions: RowType[] = [
  "income",
  "income_deduction",
  "fixed_expense",
  "card_payment",
  "investment",
  "other_expense"
];

export const cardCategoryLabels: Record<CardCategory, string> = {
  food: "食費",
  daily_goods: "日用品",
  dining: "外食",
  cat_goods: "猫用品",
  gasoline: "ガソリン",
  medical: "医療",
  entertainment: "娯楽",
  communication: "通信費",
  other: "その他"
};

export const cardCategoryOptions: CardCategory[] = [
  "food",
  "daily_goods",
  "dining",
  "cat_goods",
  "gasoline",
  "medical",
  "entertainment",
  "communication",
  "other"
];

export const burdenTypeLabels: Record<BurdenType, string> = {
  household: "家計負担",
  husband: "夫負担",
  wife: "妻負担",
  household_advanced_by_husband: "家計負担・夫立替",
  household_advanced_by_wife: "家計負担・妻立替"
};

export const burdenTypeOptions: BurdenType[] = [
  "household",
  "husband",
  "wife",
  "household_advanced_by_husband",
  "household_advanced_by_wife"
];

export const advancePayerLabels: Record<AdvancePayer, string> = {
  none: "-",
  husband: "夫",
  wife: "妻"
};

export const advancePayerOptions: AdvancePayer[] = ["none", "husband", "wife"];

export const settlementTargetLabels: Record<SettlementTarget, string> = {
  none: "-",
  husband: "夫へ精算",
  wife: "妻へ精算",
  household: "家計へ精算"
};

export const settlementTargetOptions: SettlementTarget[] = ["none", "husband", "wife", "household"];

export const settlementStatusLabels: Record<SettlementStatus, string> = {
  unsettled: "未精算",
  partially_settled: "一部精算",
  settled: "精算済み"
};

export const settlementStatusOptions: SettlementStatus[] = [
  "unsettled",
  "partially_settled",
  "settled"
];

export const defaultPaymentSourceNames = [
  "家計用口座",
  "家計用カード",
  "夫の個人口座",
  "夫の個人カード",
  "妻の個人口座",
  "妻の個人カード",
  "現金"
];
