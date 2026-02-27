YouTube Shorts を YouTube にアップロードする。

## 手順

### 1. セットアップ確認

以下のファイルが存在するか確認:

- `pikura/.youtube-client-secret.json` — なければユーザーに Google Cloud Console での取得を案内
- `pikura/.youtube-token.json` — なければ `node scripts/youtube-auth.mjs` を実行して認証

### 2. アップロード対象の確認

```bash
node scripts/youtube-upload.mjs --help
```

で利用可能な動画一覧を表示。

### 3. Dry Run で確認

ユーザーに対象を確認した上で:

```bash
node scripts/youtube-upload.mjs $ARGUMENTS --dry-run
```

メタデータが正しいか確認し、ユーザーに承認を求める。

### 4. アップロード実行

```bash
node scripts/youtube-upload.mjs $ARGUMENTS
```

- デフォルトは `--privacy unlisted`（未検証プロジェクトの制限回避のため）
- 1回のアップロードで約1,600 units 消費。日次上限10,000 units（最大6本/日）
- 全動画一括の場合は `--all` を使用（5秒間隔で自動実行）
- 予約投稿: `--schedule 5h` で1本目即公開+残りを5時間間隔で予約（`--schedule 30m` も可）

### 5. 結果確認

アップロード成功したら、表示されたURLをユーザーに共有する。
YouTube Studio で Shorts として認識されているか確認を促す。
