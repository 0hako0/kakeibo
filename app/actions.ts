"use server";

import { sql } from "@/lib/db";
import type { MonthlySheet } from "@/lib/types";

export async function getSheets(): Promise<Record<string, MonthlySheet>> {
  const rows = await sql`select year_month, data from monthly_sheets`;

  const sheets: Record<string, MonthlySheet> = {};
  for (const row of rows as Array<{ year_month: string; data: MonthlySheet }>) {
    sheets[row.year_month] = row.data;
  }

  return sheets;
}

export async function saveSheet(yearMonth: string, sheet: MonthlySheet): Promise<void> {
  await sql`
    insert into monthly_sheets (year_month, data, updated_at)
    values (${yearMonth}, ${JSON.stringify(sheet)}::jsonb, now())
    on conflict (year_month)
    do update set data = excluded.data, updated_at = now()
  `;
}
