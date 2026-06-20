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

export type MonthlyRow = {
  id: string;
  type: RowType;
  item: string;
  amount: number;
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
