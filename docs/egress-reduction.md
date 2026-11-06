# 公開サイトの通信量削減

## 変更内容

- 公開トップとSEOはCookieなし・公開キーのSupabaseクライアントを使用。Next Data Cacheで1時間保存し、同一リクエストのSEO/本文取得も共有する。公開設定・公開コンテンツ・料金・営業カレンダーのみ対象。管理者セッション、予約情報、メール設定、プロフィールは含めない。
- 公開内容を変更する既存の認証済みServer Actionは、保存成功後に `updateTag("public-content-v1")` と既存の `revalidatePath("/")` を実行する。失敗した取得結果はキャッシュしない。キャッシュ更新時の上流エラーではNextの既存キャッシュ維持に依存する。初回取得が402で失敗する場合は復旧できない。
- 予約APIの営業日再確認・予約RPCは引き続き `no-store`。管理画面の認証、権限判定、予約処理を変更しない。
- 新規Storage画像のみ `cacheControl: "31536000"`。UUIDの新しいパスと `upsert:false` を使用し、同じURLを上書きしない。既存画像のメタデータは変更しない。
- 公開写真はNext Image（WebP、画像キャッシュ最低30日）で配信。許可範囲は環境変数で指定されたSupabaseの公開 `site-media` バケットのみ。ヒーローは既存のPC/スマホ背景切替・陰影を保ち `getImageProps` の最適化URLを使用する。既存の外部画像URLは互換性のため直接配信する。

## 既存PNG/JPEGの段階的WebP化

402制限中はStorageからの一括ダウンロードや変換アップロードを実行しない。このPRは既存オブジェクトや本番DBを変更しない。

1. 店舗所有の本番 `butadesumon` から取得済みのバックアップを使用する。旧個人 `butadesumon-hp` は対象外。バックアップの保存場所とハッシュを確認する。
2. `node scripts/prepare-webp.mjs INPUT_DIR NEW_OUTPUT_DIR` を実行。出力先は新しい別ディレクトリにする。元ファイルを `originals/` に複製しSHA-256を記録。PNG/JPEGだけ変換し、アニメーションは保留、元より小さいWebPだけ `webp/` に保存する。上書き・削除・通信は行わない。失敗時も入力原本は残る。
3. manifestと写真を確認する。透過・色・文字・向き・トリミングをPC/スマホで確認。1920pxを超える写真は縮小されるため元画像も必ず保持する。
4. 承認後、通常の画像ライブラリに少数ずつ新規画像として追加し、管理画面で選び直す。元画像と参照パスを記録し、原本を削除しない。問題があれば元画像を再選択する。今回この手順は実行しない。

## リリース前後の確認

- 本番マージ・デプロイはユーザー承認後。Previewの環境変数は店舗のプロジェクトであることを別途確認する。秘密情報はログやPRに載せない。
- HTTP 402解除後に実アカウントのログイン、権限ごとの編集、保存後の公開反映、営業日、予約成功、満席・駐車場・休業日の拒否を確認する。今回の検証は本番への書き込みを行わない。
- DevToolsで公開写真が `/_next/image` を通ること、2回目の閲覧でSupabaseへのデータ取得が増えないこと、更新直後に新しい内容になることを確認する。管理画面を直接編集しないDB変更は最長1時間後に反映。
- Supabase Storage Cached EgressとVercel Image Optimizationの使用量を比較する。Next側のキャッシュミスは引き続きSupabase通信を発生させる。既存の402制限解除や通信量ゼロを保証する変更ではない。

参考: [Next Data Cache](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)、[Next Image](https://nextjs.org/docs/app/api-reference/components/image)、[Supabase Storage CDN](https://supabase.com/docs/guides/storage/cdn/fundamentals)。

## このPRの検証結果

- `pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build` 成功。
- `pnpm verify:egress`: ループバックの模擬Supabaseに対して本番ビルドを起動。SEOと本文の初回取得は1回、別Cookieでの再閲覧は追加取得0回、認証済みFAQ保存後は再取得1回。未認証の管理画面リダイレクト・保存拒否、保存失敗時のキャッシュ維持を確認。
- 同じ検証で予約成功、満席/駐車場上限の409、営業時間外/休業日の400、各予約リクエストが営業日を毎回再取得することを確認。実Supabaseの認証やDB制約の代わりになる検証ではない。
- 合成PNGで原本・バックアップのバイト一致、1920px以内への縮小、透過の保持、元より小さいWebP、既存出力先の上書き拒否を確認。実際の店舗写真の目視確認と変換は未実施。
- 公開HTMLの最適化URLを確認。実画像のVercel配信、スマホでの目視確認、実アカウントのログイン/予約は402解除後・承認済み環境で確認する。
