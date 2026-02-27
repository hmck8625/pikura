#!/usr/bin/env node

/**
 * YouTube OAuth2 認証スクリプト
 *
 * 初回認証時にブラウザを開き、OAuth2フローでトークンを取得・保存する。
 *
 * 事前準備:
 *   1. Google Cloud Console でプロジェクト作成 → YouTube Data API v3 を有効化
 *   2. OAuth同意画面を設定（External / テストユーザーに自分のGmail追加）
 *   3. OAuth クライアントID を「デスクトップアプリ」で作成 → JSONダウンロード
 *   4. ダウンロードしたJSONを pikura/.youtube-client-secret.json に配置
 *
 * 使い方:
 *   node scripts/youtube-auth.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { URL } from "node:url";
import { execSync } from "node:child_process";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");

const CLIENT_SECRET_FILE = join(PROJECT_ROOT, ".youtube-client-secret.json");
const TOKEN_FILE = join(PROJECT_ROOT, ".youtube-token.json");
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

async function main() {
  // クライアントシークレットの存在確認
  if (!existsSync(CLIENT_SECRET_FILE)) {
    console.error("エラー: .youtube-client-secret.json が見つかりません");
    console.error("");
    console.error("手順:");
    console.error("  1. Google Cloud Console でプロジェクト作成");
    console.error("  2. YouTube Data API v3 を有効化");
    console.error("  3. OAuth同意画面を設定（External / テストユーザーに自分のGmail追加）");
    console.error("  4. 認証情報 → OAuth クライアントID → デスクトップアプリ で作成");
    console.error("  5. JSONダウンロード → pikura/.youtube-client-secret.json に配置");
    process.exit(1);
  }

  // 既存トークンの確認
  if (existsSync(TOKEN_FILE)) {
    console.log("既存のトークンファイルが見つかりました。");
    console.log("再認証すると既存トークンが上書きされます。");
    console.log("");
  }

  // クライアントシークレット読み込み
  const secretContent = JSON.parse(await readFile(CLIENT_SECRET_FILE, "utf-8"));
  const credentials = secretContent.installed || secretContent.web;

  if (!credentials) {
    console.error("エラー: クライアントシークレットの形式が不正です。");
    console.error("「デスクトップアプリ」タイプのOAuthクライアントIDを使用してください。");
    process.exit(1);
  }

  const { client_id, client_secret } = credentials;

  // 登録済みリダイレクトURIに合わせてポート8080固定
  const port = 8080;
  const redirectUri = `http://127.0.0.1:${port}/`;
  const server = createServer();
  await new Promise((resolve) => server.listen(port, "0.0.0.0", resolve));

  // OAuth2クライアント作成
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("=".repeat(60));
  console.log("YouTube OAuth2 認証");
  console.log("=".repeat(60));
  console.log("");
  console.log("ブラウザで認証ページを開きます...");
  console.log("");

  // WSL2からWindowsブラウザを開く
  try {
    execSync(`powershell.exe Start-Process "'${authUrl}'"`, { stdio: "ignore" });
    console.log("ブラウザが開きました。Googleアカウントでログインしてください。");
  } catch {
    console.log("ブラウザを自動で開けませんでした。以下のURLを手動で開いてください:");
    console.log("");
    console.log(authUrl);
  }

  console.log("");
  console.log("認証完了を待機中... (5分でタイムアウト)");

  // コールバック受信
  const code = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("認証タイムアウト（5分）"));
    }, 5 * 60 * 1000);

    server.on("request", (req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>認証エラー</h1><p>${error}</p><p>ウィンドウを閉じてください。</p>`);
        clearTimeout(timeout);
        server.close();
        reject(new Error(`認証エラー: ${error}`));
        return;
      }

      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>認証成功!</h1><p>このウィンドウを閉じてください。ターミナルに戻って確認してください。</p>`);
        clearTimeout(timeout);
        server.close();
        resolve(authCode);
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });
  });

  console.log("");
  console.log("認証コード取得。トークンを交換中...");

  // コードをトークンに交換
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.warn("警告: refresh_token が取得できませんでした。");
    console.warn("Google Cloud Console で OAuth同意画面のテストユーザーに自分を追加しているか確認してください。");
  }

  // トークン保存
  const tokenData = {
    ...tokens,
    obtained_at: Date.now(),
    client_id,
    client_secret,
    redirect_uri: redirectUri,
  };

  await writeFile(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");

  console.log("");
  console.log("=".repeat(60));
  console.log("認証完了!");
  console.log("=".repeat(60));
  console.log(`  トークン保存先: .youtube-token.json`);
  console.log(`  access_token: ${tokens.access_token.substring(0, 20)}...`);
  console.log(`  refresh_token: ${tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + "..." : "なし"}`);
  console.log(`  scope: ${tokens.scope}`);
  console.log("");
  console.log("これで動画アップロードが可能です:");
  console.log("  node scripts/youtube-upload.mjs pickleball-rules --dry-run");
}

main().catch((err) => {
  console.error(`エラー: ${err.message}`);
  process.exit(1);
});
