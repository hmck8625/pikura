#!/usr/bin/env node

/**
 * 記事マークダウンファイルから過剰な太字(**bold**)を除去するスクリプト
 *
 * AI生成文章に特有の過剰太字を一括クリーンアップする。
 * テーブルのヘッダーセル (| **項目** |) は保持する。
 *
 * 使い方:
 *   node scripts/clean-bold.mjs          # ドライラン（変更を表示のみ）
 *   node scripts/clean-bold.mjs --apply  # 実際に書き換え
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ARTICLES_DIR = resolve(__dirname, "../../articles");
const apply = process.argv.includes("--apply");

const files = readdirSync(ARTICLES_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

let totalRemoved = 0;

for (const file of files) {
  const filePath = resolve(ARTICLES_DIR, file);
  const original = readFileSync(filePath, "utf-8");
  const lines = original.split("\n");
  let fileRemoved = 0;

  const cleaned = lines
    .map((line) => {
      // テーブル行のヘッダーセル (| **xxx** |) は保持
      if (line.startsWith("|") && line.includes("**")) {
        return line;
      }

      // H1-H6行はそのまま保持
      if (/^#{1,6}\s/.test(line)) {
        return line;
      }

      // 本文中の **xxx** を xxx に置換
      const replaced = line.replace(/\*\*(.+?)\*\*/g, "$1");
      const removedCount = (line.match(/\*\*(.+?)\*\*/g) || []).length;
      fileRemoved += removedCount;
      return replaced;
    })
    .join("\n");

  if (fileRemoved > 0) {
    console.log(`${file}: ${fileRemoved} 個の太字を除去`);
    totalRemoved += fileRemoved;

    if (apply) {
      writeFileSync(filePath, cleaned, "utf-8");
    }
  }
}

console.log(`\n合計: ${totalRemoved} 個の太字を除去${apply ? "（適用済み）" : "（ドライラン — --apply で適用）"}`);
