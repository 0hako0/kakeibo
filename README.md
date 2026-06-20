# 月末家計簿

月末に1か月分をまとめて登録する家計簿アプリです。日々の利用日ではなく、今月実際に口座・現金・カード引落などから出入りした金額を月次シートで管理します。

## MVP

- 年月選択
- 月次シート作成
- 月次シートの行追加
- 区分、項目、金額、メモ入力
- localStorage 自動保存
- 月次集計
- カード引落行からカード明細を入力
- カード引落金額と明細合計の差額表示
- 月次CSV、カード明細CSV出力

## データ構造

- 月次シート: 今月実際に出入りした金額
- カード明細: カード引落の使い道

カード明細は支出合計へ二重計上せず、月次シートの「カード引落」行の補助データとして扱います。

## Supabase

MVPの画面は未設定でも動くように localStorage へ保存します。Supabase のテーブル定義は `supabase/schema.sql` にあります。

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 開発

```bash
npm install
npm run dev
```
