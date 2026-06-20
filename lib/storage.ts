import type { MonthlySheet } from "./types";

const storageKey = "kakeibo.monthlySheets.v1";

export function loadSheets(): Record<string, MonthlySheet> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, MonthlySheet>;
  } catch {
    return {};
  }
}

export function saveSheets(sheets: Record<string, MonthlySheet>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(sheets));
}
