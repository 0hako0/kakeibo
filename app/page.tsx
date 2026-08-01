import { getSheets } from "@/app/actions";
import KakeiboClient from "@/app/KakeiboClient";
import { thisYearMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const sheets = await getSheets();

  return <KakeiboClient initialSheets={sheets} initialYearMonth={thisYearMonth()} />;
}
