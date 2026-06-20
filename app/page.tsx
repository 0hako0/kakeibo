"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSummary } from "@/lib/calculations";
import { cardDetailsToCsv, downloadCsv, monthlySheetToCsv } from "@/lib/csv";
import { createInitialSheet } from "@/lib/fixtures";
import { formatCurrency, parseAmount, thisYearMonth } from "@/lib/format";
import { createId } from "@/lib/ids";
import { loadSheets, saveSheets } from "@/lib/storage";
import {
  cardCategoryLabels,
  cardCategoryOptions,
  rowTypeLabels,
  rowTypeOptions,
  type CardDetail,
  type MonthlyRow,
  type MonthlySheet,
  type RowType
} from "@/lib/types";
import { calculateCardDetailTotal } from "@/lib/calculations";

export default function Home() {
  const [yearMonth, setYearMonth] = useState(thisYearMonth());
  const [sheets, setSheets] = useState<Record<string, MonthlySheet>>({});
  const [activeCardRowId, setActiveCardRowId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSheets(loadSheets());
    setLoaded(true);
  }, []);

  const sheet = useMemo(() => {
    return sheets[yearMonth] ?? createInitialSheet(yearMonth);
  }, [sheets, yearMonth]);

  const summary = useMemo(
    () => calculateSummary(sheet.rows, sheet.previousMonthBalance),
    [sheet.previousMonthBalance, sheet.rows]
  );

  const activeCardRow = sheet.rows.find((row) => row.id === activeCardRowId && row.type === "card_payment");

  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (!sheets[yearMonth]) {
      setSheets((current) => ({
        ...current,
        [yearMonth]: createInitialSheet(yearMonth)
      }));
    }
  }, [loaded, sheets, yearMonth]);

  useEffect(() => {
    if (loaded) {
      saveSheets(sheets);
    }
  }, [loaded, sheets]);

  function updateSheet(updater: (current: MonthlySheet) => MonthlySheet) {
    setSheets((current) => {
      const currentSheet = current[yearMonth] ?? createInitialSheet(yearMonth);
      const nextSheet = {
        ...updater(currentSheet),
        updatedAt: new Date().toISOString()
      };

      return {
        ...current,
        [yearMonth]: nextSheet
      };
    });
  }

  function addRow() {
    updateSheet((current) => ({
      ...current,
      rows: [
        ...current.rows,
        {
          id: createId("row"),
          type: "other_expense",
          item: "",
          amount: 0,
          memo: "",
          sortOrder: current.rows.length,
          cardDetails: []
        }
      ]
    }));
  }

  function updateRow(rowId: string, patch: Partial<MonthlyRow>) {
    updateSheet((current) => ({
      ...current,
      rows: current.rows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        const nextType = patch.type ?? row.type;
        return {
          ...row,
          ...patch,
          cardDetails: nextType === "card_payment" ? row.cardDetails : []
        };
      })
    }));
  }

  function updatePreviousMonthBalance(value: string) {
    updateSheet((current) => ({
      ...current,
      previousMonthBalance: parseAmount(value)
    }));
  }

  function addCardDetail(rowId: string) {
    updateSheet((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cardDetails: [
                ...row.cardDetails,
                {
                  id: createId("detail"),
                  category: "other",
                  amount: 0,
                  memo: "",
                  sortOrder: row.cardDetails.length
                }
              ]
            }
          : row
      )
    }));
  }

  function updateCardDetail(rowId: string, detailId: string, patch: Partial<CardDetail>) {
    updateSheet((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cardDetails: row.cardDetails.map((detail) =>
                detail.id === detailId ? { ...detail, ...patch } : detail
              )
            }
          : row
      )
    }));
  }

  function exportMonthlyCsv() {
    downloadCsv(`monthly-sheet-${sheet.yearMonth}.csv`, monthlySheetToCsv(sheet));
  }

  function exportCardCsv() {
    downloadCsv(`card-details-${sheet.yearMonth}.csv`, cardDetailsToCsv(sheet));
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-3 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">月末家計簿</h1>
            <p className="mt-1 text-sm text-slate-600">
              今月実際に入ったお金と出ていったお金を、月末にまとめて入力します。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="month">
              年月
            </label>
            <input
              id="month"
              type="month"
              value={yearMonth}
              onChange={(event) => {
                setYearMonth(event.target.value);
                setActiveCardRowId(null);
              }}
              className="h-10 border border-line bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={exportMonthlyCsv}
              className="h-10 border border-slate-400 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              月次CSV
            </button>
            <button
              type="button"
              onClick={exportCardCsv}
              className="h-10 border border-slate-400 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              カードCSV
            </button>
          </div>
        </header>

        <section className="grid gap-2 border border-line bg-white p-3 md:grid-cols-4 lg:grid-cols-7">
          <SummaryItem label="収入合計" value={summary.incomeTotal} />
          <SummaryItem label="支出合計" value={summary.expenseTotal} />
          <SummaryItem label="カード引落合計" value={summary.cardPaymentTotal} />
          <SummaryItem label="投資合計" value={summary.investmentTotal} />
          <SummaryItem label="月間残高" value={summary.monthlyBalance} emphasize />
          <SummaryItem label="前月比" value={summary.previousDiff} />
          <SummaryItem label="貯金できた金額" value={summary.savedAmount} />
        </section>

        <section className="border border-line bg-white">
          <div className="flex flex-col gap-2 border-b border-line bg-slate-50 p-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">月次シート</span>
              <label className="text-sm text-slate-600" htmlFor="previous-balance">
                前月残高
              </label>
              <input
                id="previous-balance"
                inputMode="numeric"
                value={sheet.previousMonthBalance}
                onChange={(event) => updatePreviousMonthBalance(event.target.value)}
                className="h-9 w-32 border border-line bg-white px-2 text-right text-sm outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={addRow}
              className="h-9 w-fit border border-slate-500 bg-ink px-3 text-sm font-medium text-white hover:bg-slate-700"
            >
              行追加
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[920px] table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-36" />
                <col className="w-56" />
                <col className="w-36" />
                <col className="w-[22rem]" />
                <col className="w-32" />
              </colgroup>
              <thead>
                <tr>
                  <th className="sheet-header">区分</th>
                  <th className="sheet-header">項目</th>
                  <th className="sheet-header">金額</th>
                  <th className="sheet-header">メモ</th>
                  <th className="sheet-header">内訳あり</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="sheet-cell">
                      <select
                        value={row.type}
                        onChange={(event) =>
                          updateRow(row.id, { type: event.target.value as RowType })
                        }
                        className="sheet-input"
                      >
                        {rowTypeOptions.map((type) => (
                          <option key={type} value={type}>
                            {rowTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="sheet-cell">
                      <input
                        value={row.item}
                        onChange={(event) => updateRow(row.id, { item: event.target.value })}
                        className="sheet-input"
                      />
                    </td>
                    <td className="sheet-cell">
                      <input
                        inputMode="numeric"
                        value={row.amount}
                        onChange={(event) =>
                          updateRow(row.id, { amount: parseAmount(event.target.value) })
                        }
                        className="sheet-input text-right tabular-nums"
                      />
                    </td>
                    <td className="sheet-cell">
                      <input
                        value={row.memo}
                        onChange={(event) => updateRow(row.id, { memo: event.target.value })}
                        className="sheet-input"
                      />
                    </td>
                    <td className="sheet-cell px-2">
                      {row.type === "card_payment" ? (
                        <button
                          type="button"
                          onClick={() => setActiveCardRowId(row.id)}
                          className="h-8 w-full border border-sky-700 bg-sky-50 text-xs font-semibold text-sky-800 hover:bg-sky-100"
                        >
                          明細を開く
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <CardDetailPanel
          row={activeCardRow}
          onAddDetail={addCardDetail}
          onUpdateDetail={updateCardDetail}
        />
      </div>
    </main>
  );
}

function SummaryItem({
  label,
  value,
  emphasize = false
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="border border-line bg-paper px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-right text-base font-semibold tabular-nums ${emphasize ? "text-sky-800" : ""}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

function CardDetailPanel({
  row,
  onAddDetail,
  onUpdateDetail
}: {
  row: MonthlyRow | undefined;
  onAddDetail: (rowId: string) => void;
  onUpdateDetail: (rowId: string, detailId: string, patch: Partial<CardDetail>) => void;
}) {
  if (!row) {
    return (
      <section className="border border-dashed border-line bg-white p-4 text-sm text-slate-500">
        カード引落行の「明細を開く」から、カード明細を入力できます。
      </section>
    );
  }

  const detailTotal = calculateCardDetailTotal(row);
  const difference = row.amount - detailTotal;
  const hasDifference = difference !== 0;

  return (
    <section className="border border-line bg-white">
      <div className="flex flex-col gap-3 border-b border-line bg-slate-50 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">カード明細: {row.item || "未入力"}</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-sm">
            <span>カード引落金額: {formatCurrency(row.amount)}</span>
            <span>内訳合計: {formatCurrency(detailTotal)}</span>
            <span
              className={
                hasDifference
                  ? "bg-rose-100 px-2 py-0.5 font-semibold text-rose-800"
                  : "bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800"
              }
            >
              差額: {formatCurrency(difference)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onAddDetail(row.id)}
          className="h-9 w-fit border border-slate-500 bg-ink px-3 text-sm font-medium text-white hover:bg-slate-700"
        >
          明細行追加
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-48" />
            <col className="w-40" />
            <col className="w-[28rem]" />
          </colgroup>
          <thead>
            <tr>
              <th className="sheet-header">カテゴリ</th>
              <th className="sheet-header">金額</th>
              <th className="sheet-header">メモ</th>
            </tr>
          </thead>
          <tbody>
            {row.cardDetails.map((detail) => (
              <tr key={detail.id}>
                <td className="sheet-cell">
                  <select
                    value={detail.category}
                    onChange={(event) =>
                      onUpdateDetail(row.id, detail.id, {
                        category: event.target.value as CardDetail["category"]
                      })
                    }
                    className="sheet-input"
                  >
                    {cardCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {cardCategoryLabels[category]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="sheet-cell">
                  <input
                    inputMode="numeric"
                    value={detail.amount}
                    onChange={(event) =>
                      onUpdateDetail(row.id, detail.id, {
                        amount: parseAmount(event.target.value)
                      })
                    }
                    className="sheet-input text-right tabular-nums"
                  />
                </td>
                <td className="sheet-cell">
                  <input
                    value={detail.memo}
                    onChange={(event) =>
                      onUpdateDetail(row.id, detail.id, { memo: event.target.value })
                    }
                    className="sheet-input"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
