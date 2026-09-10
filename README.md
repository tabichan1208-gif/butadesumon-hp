# 豚ですもん。公式サイト

マイクロブタカフェ「豚ですもん。」の公式サイト、店舗管理画面、予約管理の本番用 Next.js プロジェクトです。

## 起動

```bash
npm install
npm run dev
```

- 公開サイト: `http://localhost:3000`
- 管理画面: `http://localhost:3000/admin`

現在はモックデータで動作します。`.env.example` の項目は次段階の Supabase 接続時に設定します。

## 現在の範囲

- 公開トップページとレスポンシブ表示
- 利用案内・料金表・FAQ・店舗情報
- 料金計算をしない予約入力 UI
- 管理画面の予約一覧・日別表示・編集メニュー
- Supabase 接続前でも静的ビルド可能な仮データ層

## 次段階

Supabase の schema、RLS、Auth、Storage、公開予約 API、定員・駐車場の排他制御を追加します。
