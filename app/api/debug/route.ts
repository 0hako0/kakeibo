import { NextResponse } from "next/server";
import { getSheets } from "@/app/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sheets = await getSheets();
    const dbUrl = process.env.DATABASE_URL ?? "";
    const hostMatch = dbUrl.match(/@([^/]+)\//);
    return NextResponse.json({
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      dbHost: hostMatch?.[1] ?? null,
      urlLength: dbUrl.length,
      keys: Object.keys(sheets),
      sample: sheets["2026-08"]?.rows?.[0]?.item ?? null
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
