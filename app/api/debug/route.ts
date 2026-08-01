import { NextResponse } from "next/server";
import { getSheets } from "@/app/actions";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sheets = await getSheets();
    const dbUrl = process.env.DATABASE_URL ?? "";
    const hostMatch = dbUrl.match(/@([^/]+)\//);
    const raw = await sql`select year_month from monthly_sheets`;
    const currentDb = await sql`select current_database() as db, current_user as usr`;
    return NextResponse.json({
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      dbHost: hostMatch?.[1] ?? null,
      urlLength: dbUrl.length,
      keys: Object.keys(sheets),
      sample: sheets["2026-08"]?.rows?.[0]?.item ?? null,
      raw,
      currentDb
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
