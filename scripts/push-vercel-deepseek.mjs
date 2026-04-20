#!/usr/bin/env node
/**
 * 将本地 .env.local 中的 DEEPSEEK_API_KEY 写入 Vercel（production / preview / development）。
 * 前置：已安装依赖、已执行 `npx vercel link`，且已 `vercel login`（或设置 VERCEL_TOKEN）。
 *
 * 用法：npm run vercel:push-deepseek
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const envPath = path.join(root, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("未找到 momentlog/.env.local，请先创建并写入 DEEPSEEK_API_KEY。");
  process.exit(1);
}

const env = parseEnvFile(fs.readFileSync(envPath, "utf8"));
const key = env.DEEPSEEK_API_KEY?.trim();
if (!key) {
  console.error(".env.local 中未找到 DEEPSEEK_API_KEY。");
  process.exit(1);
}

const vercelDir = path.join(root, ".vercel");
if (!fs.existsSync(vercelDir)) {
  console.error(
    "尚未关联 Vercel 项目。请在 momentlog 目录执行：\n  npx vercel link\n然后再运行：\n  npm run vercel:push-deepseek",
  );
  process.exit(1);
}

const targets = ["production", "preview", "development"];

for (const target of targets) {
  console.log(`→ ${target} …`);
  const r = spawnSync(
    "npx",
    ["vercel", "env", "add", "DEEPSEEK_API_KEY", target, "--value", key, "--yes", "--force"],
    { cwd: root, stdio: "inherit", env: process.env },
  );
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`写入 ${target} 失败（exit ${r.status}）。`);
    process.exit(r.status ?? 1);
  }
}

console.log("\n已完成：DEEPSEEK_API_KEY 已写入三种环境。请在 Vercel 上重新部署一次。");
