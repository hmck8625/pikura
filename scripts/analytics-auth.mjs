#!/usr/bin/env node

/**
 * Google Analytics 統合認証スクリプト
 *
 * Google Search Console + YouTube Analytics の OAuth2 認証を行い、
 * トークンを .google-analytics-token.json に保存する。
 *
 * 既存の .youtube-client-secret.json を流用する。
 *
 * 事前準備:
 *   1. Google Cloud Console で以下のAPIを有効化:
 *      - Search Console API
 *      - YouTube Analytics API
 *   2. .youtube-client-secret.json が配置済みであること
 *
 * 使い方:
 *   node scripts/analytics-auth.mjs
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";
import { URL } from "node:url";
import { execSync } from "node:child_process";
import { google } from "googleapis";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const CLIENT_SECRET_FILE = join(PROJECT_ROOT, ".youtube-client-secret.json");
const TOKEN_FILE = join(PROJECT_ROOT, ".google-analytics-token.json");

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
  "https://www.googleapis.com/auth/youtube.readonly",
];

async function main() {
  if (!existsSync(CLIENT_SECRET_FILE)) {
    console.error("エラー: .youtube-client-secret.json が見つかりません");
    process.exit(1);
  }

  if (existsSync(TOKEN_FILE)) {
    console.log("既存のアナリティクストークンが見つかりました。再認証すると上書きされます。");
    console.log("");
  }

  const secretContent = JSON.parse(await readFile(CLIENT_SECRET_FILE, "utf-8"));
  const credentials = secretContent.installed || secretContent.web;

  if (!credentials) {
    console.error("エラー: クライアントシークレットの形式が不正です。");
    process.exit(1);
  }

  const { client_id, client_secret } = credentials;
  // WSL2ではlocalhostコールバックが不安定なため、2つの方式を用意
  // 方式1: ローカルサーバー（自動）
  // 方式2: リダイレクトURLからcodeを手動コピペ（フォールバック）
  const port = 8080;
  const redirectUri = `http://127.0.0.1:${port}/`;

  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("=".repeat(60));
  console.log("Google Analytics 統合認証（GSC + YouTube Analytics）");
  console.log("=".repeat(60));
  console.log("");
  console.log("スコープ:");
  SCOPES.forEach((s) => console.log(`  - ${s}`));
  console.log("");

  // ブラウザを開く
  try {
    execSync(`powershell.exe Start-Process "'${authUrl}'"`, { stdio: "ignore" });
    console.log("ブラウザが開きました。Googleアカウントでログインしてください。");
  } catch {
    console.log("以下のURLを手動で開いてください:");
    console.log("");
    console.log(authUrl);
  }

  console.log("");
  console.log("【自動モード】ローカルサーバーでコールバック待機中...");
  console.log("【手動モード】自動で進まない場合は、ブラウザのURLバーから");
  console.log("  code=XXXX の部分をコピーして以下に貼り付けてください。");
  console.log("");

  // ローカルサーバーとstdin入力を並行で待つ
  const code = await new Promise((resolve, reject) => {
    let resolved = false;

    // 方式1: ローカルサーバー
    const server = createServer();
    server.listen(port, "0.0.0.0", () => {});

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        server.close();
        reject(new Error("認証タイムアウト（5分）。URLバーの code= パラメータを確認してください。"));
      }
    }, 5 * 60 * 1000);

    server.on("request", (req, res) => {
      if (resolved) return;
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>認証エラー</h1><p>${error}</p>`);
        resolved = true;
        clearTimeout(timeout);
        server.close();
        reject(new Error(`認証エラー: ${error}`));
        return;
      }

      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>認証成功!</h1><p>GSC + YouTube Analytics のアクセスが許可されました。ウィンドウを閉じてください。</p>`);
        resolved = true;
        clearTimeout(timeout);
        server.close();
        resolve(authCode);
        return;
      }

      res.writeHead(404);
      res.end("Not found");
    });

    // 方式2: stdin入力
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    rl.question("認証コード（またはリダイレクトURL）を貼り付け: ", (input) => {
      rl.close();
      if (resolved) return;

      let authCode = input.trim();
      // URLが貼られた場合、codeパラメータを抽出
      if (authCode.includes("code=")) {
        try {
          const url = new URL(authCode);
          authCode = url.searchParams.get("code") || authCode;
        } catch {
          const match = authCode.match(/code=([^&]+)/);
          if (match) authCode = decodeURIComponent(match[1]);
        }
      }

      if (authCode) {
        resolved = true;
        clearTimeout(timeout);
        server.close();
        resolve(authCode);
      }
    });
  });

  console.log("認証コード取得。トークンを交換中...");

  const { tokens } = await oauth2Client.getToken(code);

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
  console.log(`  トークン保存先: .google-analytics-token.json`);
  console.log(`  scope: ${tokens.scope}`);
  console.log(`  refresh_token: ${tokens.refresh_token ? "あり" : "なし"}`);
  console.log("");
  console.log("レポート生成:");
  console.log("  node scripts/gsc-report.mjs");
  console.log("  node scripts/youtube-report.mjs");
}

main().catch((err) => {
  console.error(`エラー: ${err.message}`);
  process.exit(1);
});
