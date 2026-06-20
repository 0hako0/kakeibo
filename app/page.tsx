"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateSummary } from "@/lib/calculations";
import { cardDetailsToCsv, downloadCsv, monthlySheetToCsv } from "@/lib/csv";
import { createInitialSheet } from "@/lib/fixtures";
import { formatCurrency, parseAmount, thisYearMonth } from "@/lib/format";
import { createId } from "@/lib/ids";
import { normalizeSheet } from "@/lib/normalize";
import { loadSheets, saveSheets } from "@/lib/storage";
import { downloadMonthlyXlsx } from "@/lib/xlsx";
import {
  burdenTypeLabels,
  burdenTypeOptions,
  cardCategoryLabels,
  cardCategoryOptions,
  rowTypeLabels,
  rowTypeOptions,
  settlementStatusLabels,
  settlementStatusOptions,
  settlementTargetLabels,
  settlementTargetOptions,
  type BurdenType,
  type CardDetail,
  type MonthlyRow,
  type MonthlySheet,
  type MonthlySummary,
  type PaymentSource,
  type RowType,
  type SettlementStatus,
  type SettlementTarget
} from "@/lib/types";
import { calculateCardDetailTotal } from "@/lib/calculations";

export default function Home() {
  const [yearMonth, setYearMonth] = useState(thisYearMonth());
  const [sheets, setSheets] = useState<Record<string, MonthlySheet>>({});
  const [activeCardRowId, setActiveCardRowId] = useState<string | null>(null);
  const [isPaymentSourceMasterOpen, setIsPaymentSourceMasterOpen] = useState(false);
  const [isBurdenSummaryOpen, setIsBurdenSummaryOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSheets(loadSheets());
    setLoaded(true);
  }, []);

  const sheet = useMemo(() => {
    return normalizeSheet(sheets[yearMonth] ?? createInitialSheet(yearMonth));
  }, [sheets, yearMonth]);

  const summary = useMemo(
    () => calculateSummary(sheet.rows, sheet.previousMonthBalance, sheet.paymentSources),
    [sheet.paymentSources, sheet.previousMonthBalance, sheet.rows]
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
      const currentSheet = normalizeSheet(current[yearMonth] ?? createInitialSheet(yearMonth));
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
          paymentSourceId: current.paymentSources[0]?.id ?? "",
          burdenType: "household",
          advancePayer: "none",
          settlementTarget: "none",
          settlementStatus: "unsettled",
          memo: "",
          sortOrder: current.rows.length,
          cardDetails: []
        }
      ]
    }));
  }

  function addPaymentSource() {
    updateSheet((current) => ({
      ...current,
      paymentSources: [
        ...current.paymentSources,
        {
          id: createId("source"),
          name: "新しい支払い元",
          sortOrder: current.paymentSources.length
        }
      ]
    }));
  }

  function updatePaymentSource(sourceId: string, patch: Partial<PaymentSource>) {
    updateSheet((current) => ({
      ...current,
      paymentSources: current.paymentSources.map((source) =>
        source.id === sourceId ? { ...source, ...patch } : source
      )
    }));
  }

  function deletePaymentSource(sourceId: string) {
    const source = sheet.paymentSources.find((item) => item.id === sourceId);
    const isUsed = sheet.rows.some((row) => row.paymentSourceId === sourceId);

    if (isUsed) {
      window.alert("この支払い元は月次シートで使用中のため削除できません。先に行の支払い元を変更してください。");
      return;
    }

    if (!window.confirm(`${source?.name ?? "この支払い元"} を削除しますか？`)) {
      return;
    }

    updateSheet((current) => ({
      ...current,
      paymentSources: current.paymentSources
        .filter((item) => item.id !== sourceId)
        .map((item, index) => ({ ...item, sortOrder: index }))
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
        const nextBurdenType = patch.burdenType ?? row.burdenType;
        const settlementDefaults = getSettlementDefaults(nextBurdenType);
        return {
          ...row,
          ...patch,
          ...("burdenType" in patch ? settlementDefaults : {}),
          cardDetails: nextType === "card_payment" ? row.cardDetails : []
        };
      })
    }));
  }

  function deleteRow(rowId: string) {
    const row = sheet.rows.find((item) => item.id === rowId);
    const label = row?.item || rowTypeLabels[row?.type ?? "other_expense"];

    if (!window.confirm(`${label} の行を削除しますか？`)) {
      return;
    }

    if (activeCardRowId === rowId) {
      setActiveCardRowId(null);
    }

    updateSheet((current) => ({
      ...current,
      rows: current.rows
        .filter((item) => item.id !== rowId)
        .map((item, index) => ({ ...item, sortOrder: index }))
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

  function deleteCardDetail(rowId: string, detailId: string) {
    if (!window.confirm("この明細行を削除しますか？")) {
      return;
    }

    updateSheet((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              cardDetails: row.cardDetails
                .filter((detail) => detail.id !== detailId)
                .map((detail, index) => ({ ...detail, sortOrder: index }))
            }
          : row
      )
    }));
  }

  function exportMonthlyCsv() {
    downloadCsv(`monthly-sheet-${sheet.yearMonth}.csv`, monthlySheetToCsv(sheet));
  }

  async function exportMonthlyXlsx() {
    await downloadMonthlyXlsx(sheet);
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
              onClick={exportMonthlyXlsx}
              className="h-10 border border-slate-400 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              月次XLSX
            </button>
            <button
              type="button"
              onClick={exportCardCsv}
              className="h-10 border border-slate-400 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              カードCSV
            </button>
            <button
              type="button"
              onClick={() => setIsPaymentSourceMasterOpen(true)}
              className="h-10 border border-slate-400 bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              支払い元マスタ
            </button>
          </div>
        </header>

        <section className="grid gap-2 border border-line bg-white p-3 md:grid-cols-4 lg:grid-cols-8">
          <SummaryItem label="収入合計" value={summary.incomeTotal} />
          <SummaryItem label="収入控除合計" value={summary.incomeDeductionTotal} />
          <SummaryItem label="家計支出合計" value={summary.expenseTotal} />
          <SummaryItem label="カード引落合計" value={summary.cardPaymentTotal} />
          <SummaryItem label="投資合計" value={summary.investmentTotal} />
          <SummaryItem label="月間残高" value={summary.monthlyBalance} emphasize />
          <SummaryItem label="前月比" value={summary.previousDiff} />
          <SummaryItem label="貯金できた金額" value={summary.savedAmount} />
        </section>

        <section className="space-y-2">
          {!isBurdenSummaryOpen ? (
            <CompactToggleRow title="支払い元・負担集計" buttonLabel="集計を開く" onClick={() => setIsBurdenSummaryOpen(true)} />
          ) : null}

          {isPaymentSourceMasterOpen || isBurdenSummaryOpen ? (
            <div
              className={
                isPaymentSourceMasterOpen && isBurdenSummaryOpen
                  ? "grid gap-4 lg:grid-cols-[1.1fr_1fr]"
                  : "grid gap-4"
              }
            >
              {isPaymentSourceMasterOpen ? (
                <PaymentSourceMaster
                  paymentSources={sheet.paymentSources}
                  onClose={() => setIsPaymentSourceMasterOpen(false)}
                  onAdd={addPaymentSource}
                  onUpdate={updatePaymentSource}
                  onDelete={deletePaymentSource}
                />
              ) : null}

              {isBurdenSummaryOpen ? (
                <BurdenSummary summary={summary} onClose={() => setIsBurdenSummaryOpen(false)} />
              ) : null}
            </div>
          ) : null}
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
            <table className="min-w-[1520px] table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-36" />
                <col className="w-56" />
                <col className="w-36" />
                <col className="w-48" />
                <col className="w-52" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-[22rem]" />
                <col className="w-32" />
                <col className="w-24" />
              </colgroup>
              <thead>
                <tr>
                  <th className="sheet-header">区分</th>
                  <th className="sheet-header">項目</th>
                  <th className="sheet-header">金額</th>
                  <th className="sheet-header">支払い元</th>
                  <th className="sheet-header">負担区分</th>
                  <th className="sheet-header">精算先</th>
                  <th className="sheet-header">精算状態</th>
                  <th className="sheet-header">メモ</th>
                  <th className="sheet-header">内訳あり</th>
                  <th className="sheet-header">操作</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.burdenType === "household_advanced_by_husband" ||
                      row.burdenType === "household_advanced_by_wife"
                        ? "advance-row"
                        : ""
                    }
                  >
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
                      <select
                        value={row.paymentSourceId}
                        onChange={(event) => updateRow(row.id, { paymentSourceId: event.target.value })}
                        className="sheet-input"
                      >
                        {sheet.paymentSources.map((source) => (
                          <option key={source.id} value={source.id}>
                            {source.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="sheet-cell">
                      <select
                        value={row.burdenType}
                        onChange={(event) =>
                          updateRow(row.id, { burdenType: event.target.value as BurdenType })
                        }
                        className="sheet-input"
                      >
                        {burdenTypeOptions.map((burden) => (
                          <option key={burden} value={burden}>
                            {burdenTypeLabels[burden]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="sheet-cell">
                      <select
                        value={row.settlementTarget}
                        onChange={(event) =>
                          updateRow(row.id, {
                            settlementTarget: event.target.value as SettlementTarget
                          })
                        }
                        className="sheet-input"
                      >
                        {settlementTargetOptions.map((target) => (
                          <option key={target} value={target}>
                            {settlementTargetLabels[target]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="sheet-cell">
                      <select
                        value={row.settlementStatus}
                        onChange={(event) =>
                          updateRow(row.id, {
                            settlementStatus: event.target.value as SettlementStatus
                          })
                        }
                        className="sheet-input"
                      >
                        {settlementStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {settlementStatusLabels[status]}
                          </option>
                        ))}
                      </select>
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
                    <td className="sheet-cell px-2">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        className="h-8 w-full border border-rose-300 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        削除
                      </button>
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
          onDeleteDetail={deleteCardDetail}
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

function getSettlementDefaults(burdenType: BurdenType): Pick<
  MonthlyRow,
  "advancePayer" | "settlementTarget" | "settlementStatus"
> {
  if (burdenType === "household_advanced_by_husband") {
    return {
      advancePayer: "husband",
      settlementTarget: "husband",
      settlementStatus: "unsettled"
    };
  }

  if (burdenType === "household_advanced_by_wife") {
    return {
      advancePayer: "wife",
      settlementTarget: "wife",
      settlementStatus: "unsettled"
    };
  }

  return {
    advancePayer: "none",
    settlementTarget: "none",
    settlementStatus: "unsettled"
  };
}

function CompactToggleRow({
  title,
  buttonLabel,
  onClick
}: {
  title: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="flex min-h-0 items-center justify-between bg-transparent py-1">
      <h2 className="text-sm font-semibold">{title}</h2>
      <button
        type="button"
        onClick={onClick}
        className="h-9 border border-slate-500 bg-white px-3 text-sm font-medium hover:bg-slate-50"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function PaymentSourceMaster({
  paymentSources,
  onClose,
  onAdd,
  onUpdate,
  onDelete
}: {
  paymentSources: PaymentSource[];
  onClose: () => void;
  onAdd: () => void;
  onUpdate: (sourceId: string, patch: Partial<PaymentSource>) => void;
  onDelete: (sourceId: string) => void;
}) {
  return (
    <section className="border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">支払い元マスタ</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 border border-slate-500 bg-white px-3 text-sm font-medium hover:bg-slate-50"
          >
            支払い元マスタを閉じる
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="h-9 border border-slate-500 bg-ink px-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            支払い元追加
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[520px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-20" />
            <col className="w-80" />
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr>
              <th className="sheet-header">No.</th>
              <th className="sheet-header">支払い元名</th>
              <th className="sheet-header">操作</th>
            </tr>
          </thead>
          <tbody>
            {paymentSources.map((source, index) => (
              <tr key={source.id}>
                <td className="sheet-cell px-2 text-right tabular-nums">{index + 1}</td>
                <td className="sheet-cell">
                  <input
                    value={source.name}
                    onChange={(event) => onUpdate(source.id, { name: event.target.value })}
                    className="sheet-input"
                  />
                </td>
                <td className="sheet-cell px-2">
                  <button
                    type="button"
                    onClick={() => onDelete(source.id)}
                    className="h-8 w-full border border-rose-300 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BurdenSummary({
  summary,
  onClose
}: {
  summary: MonthlySummary;
  onClose: () => void;
}) {
  return (
    <section className="border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line bg-slate-50 p-3">
        <h2 className="text-sm font-semibold">支払い元・負担集計</h2>
        <button
          type="button"
          onClick={onClose}
          className="h-9 border border-slate-500 bg-white px-3 text-sm font-medium hover:bg-slate-50"
        >
          集計を閉じる
        </button>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-3">
        <SummaryItem label="家計負担額" value={summary.householdBurdenTotal} />
        <SummaryItem label="夫負担額" value={summary.husbandBurdenTotal} />
        <SummaryItem label="妻負担額" value={summary.wifeBurdenTotal} />
        <SummaryItem label="夫立替合計" value={summary.husbandAdvanceTotal} />
        <SummaryItem label="妻立替合計" value={summary.wifeAdvanceTotal} />
        <SummaryItem label="精算後の家計残高" value={summary.householdBalanceAfterSettlement} emphasize />
        <SummaryItem label="夫へ精算すべき金額" value={summary.amountToSettleToHusband} />
        <SummaryItem label="妻へ精算すべき金額" value={summary.amountToSettleToWife} />
      </div>
      <div className="overflow-x-auto px-3 pb-3">
        <table className="min-w-[420px] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-64" />
            <col className="w-40" />
          </colgroup>
          <thead>
            <tr>
              <th className="sheet-header">支払い元</th>
              <th className="sheet-header">支出合計</th>
            </tr>
          </thead>
          <tbody>
            {summary.paymentSourceExpenseTotals.length === 0 ? (
              <tr>
                <td className="sheet-cell px-2 py-2 text-slate-500" colSpan={2}>
                  支出はまだありません。
                </td>
              </tr>
            ) : (
              summary.paymentSourceExpenseTotals.map((source) => (
                <tr key={source.paymentSourceId}>
                  <td className="sheet-cell px-2 py-2">{source.paymentSourceName}</td>
                  <td className="sheet-cell px-2 py-2 text-right tabular-nums">
                    {formatCurrency(source.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CardDetailPanel({
  row,
  onAddDetail,
  onUpdateDetail,
  onDeleteDetail
}: {
  row: MonthlyRow | undefined;
  onAddDetail: (rowId: string) => void;
  onUpdateDetail: (rowId: string, detailId: string, patch: Partial<CardDetail>) => void;
  onDeleteDetail: (rowId: string, detailId: string) => void;
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
            <col className="w-24" />
          </colgroup>
          <thead>
            <tr>
              <th className="sheet-header">カテゴリ</th>
              <th className="sheet-header">金額</th>
              <th className="sheet-header">メモ</th>
              <th className="sheet-header">操作</th>
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
                <td className="sheet-cell px-2">
                  <button
                    type="button"
                    onClick={() => onDeleteDetail(row.id, detail.id)}
                    className="h-8 w-full border border-rose-300 bg-white text-xs font-semibold text-rose-700 hover:bg-rose-50"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
