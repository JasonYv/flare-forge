#!/usr/bin/env node

/**
 * setup.mjs — FlareForge 项目初始化脚本
 *
 * 执行:  npm run setup
 *
 * 流程:
 *   1. 检测 Node.js >= 22
 *   2. 检测 wrangler + Cloudflare 登录状态
 *   3. 创建 D1 数据库（如尚未创建），写入 database_id 到 wrangler.toml
 *   4. 创建 R2 存储桶（如尚未创建）
 *   5. 生成 API_KEY（本地 + 远程 secret）
 *   6. 生成 Drizzle 迁移 SQL
 *   7. 执行迁移建表（本地 + 远程）
 *   8. 打印后续步骤
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WRANGLER_TOML = resolve(ROOT, 'wrangler.toml');
const DRIZZLE_DIR = resolve(ROOT, 'drizzle');

// ── Helpers ───────────────────────────────────────────────
function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: 'pipe', ...opts }).trim();
  } catch (e) {
    if (opts.allowFail) return null;
    throw e;
  }
}

function step(num, msg) {
  console.log(`\n${num}  ${msg}`);
}

function ok(msg) {
  console.log(`   ✅ ${msg}`);
}

function warn(msg) {
  console.log(`   ⚠️  ${msg}`);
}

function fail(msg) {
  console.error(`\n   ❌ ${msg}\n`);
  process.exit(1);
}

function readToml() {
  return readFileSync(WRANGLER_TOML, 'utf-8');
}

function writeToml(content) {
  writeFileSync(WRANGLER_TOML, content, 'utf-8');
}

// ══════════════════════════════════════════════════════════
console.log('');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   FlareForge — 项目初始化                    ║');
console.log('╚══════════════════════════════════════════════╝');

// ── 1. Node.js 版本 ──────────────────────────────────────
step('1️⃣', '检测 Node.js 版本...');
const nodeVersion = process.versions.node;
const major = parseInt(nodeVersion.split('.')[0]);
if (major < 22) {
  fail(`需要 Node.js >= 22，当前: v${nodeVersion}\n      请运行: nvm install 22 && nvm use 22`);
}
ok(`Node.js v${nodeVersion}`);

// ── 2. Wrangler + Cloudflare 登录 ────────────────────────
step('2️⃣', '检测 Wrangler + Cloudflare 登录...');
const wranglerVersion = run('npx wrangler --version', { allowFail: true });
if (!wranglerVersion) {
  fail('wrangler 未安装，请运行: npm install');
}
ok(`Wrangler ${wranglerVersion}`);

const whoami = run('npx wrangler whoami 2>&1', { allowFail: true });
if (!whoami || whoami.includes('not authenticated') || whoami.includes('No OAuth')) {
  fail('未登录 Cloudflare\n      请先运行: npx wrangler login\n      然后重新运行: npm run setup');
}
// 提取账户名
const accountMatch = whoami.match(/──\s+(.+?)\s+──/);
const accountName = accountMatch?.[1] || '已登录';
ok(`Cloudflare 账户: ${accountName}`);

// ── 3. D1 数据库 ─────────────────────────────────────────
step('3️⃣', '配置 D1 数据库...');

let toml = readToml();
const currentDbId = toml.match(/database_id\s*=\s*"([^"]*)"/)?.[1];

if (currentDbId && currentDbId !== 'YOUR_D1_DATABASE_ID') {
  ok(`D1 已配置 (id: ${currentDbId.slice(0, 8)}...)`);
} else {
  // 先检查是否已存在
  const dbList = run('npx wrangler d1 list 2>&1', { allowFail: true }) || '';
  const existingDb = dbList.match(/flare-forge-db\s+([a-f0-9-]+)/);

  let dbId;
  if (existingDb) {
    dbId = existingDb[1];
    ok(`发现已有 D1 数据库: ${dbId.slice(0, 8)}...`);
  } else {
    console.log('   🔨 创建 D1 数据库: flare-forge-db');
    const output = run('npx wrangler d1 create flare-forge-db 2>&1');
    dbId = output.match(/database_id\s*=\s*"([^"]*)"/)?.[1];
    if (!dbId) {
      // 尝试另一种格式
      dbId = output.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/)?.[1];
    }
    if (!dbId) {
      fail('创建 D1 失败，请手动运行:\n      npx wrangler d1 create flare-forge-db\n      然后将 database_id 填入 wrangler.toml');
    }
    ok(`D1 已创建: ${dbId.slice(0, 8)}...`);
  }

  toml = toml.replace(
    /database_id\s*=\s*"YOUR_D1_DATABASE_ID"/,
    `database_id = "${dbId}"`,
  );
  writeToml(toml);
  ok('database_id 已写入 wrangler.toml');
}

// ── 4. R2 存储桶 ─────────────────────────────────────────
step('4️⃣', '配置 R2 存储桶...');

const buckets = run('npx wrangler r2 bucket list 2>&1', { allowFail: true }) || '';
if (buckets.includes('flare-forge-assets')) {
  ok('R2 存储桶 flare-forge-assets 已存在');
} else {
  console.log('   🔨 创建 R2 存储桶: flare-forge-assets');
  const r2Result = run('npx wrangler r2 bucket create flare-forge-assets 2>&1', { allowFail: true });
  if (r2Result && r2Result.includes('already exists')) {
    ok('R2 存储桶已存在');
  } else {
    // 创建完后再查一次确认
    const verify = run('npx wrangler r2 bucket list 2>&1', { allowFail: true }) || '';
    if (verify.includes('flare-forge-assets')) {
      ok('R2 存储桶已创建');
    } else {
      fail('R2 创建失败，请手动运行:\n      npx wrangler r2 bucket create flare-forge-assets');
    }
  }
}

// ── 5. API_KEY ───────────────────────────────────────────
step('5️⃣', '配置 API_KEY...');

toml = readToml();
const existingKey = toml.match(/API_KEY\s*=\s*"([^"]*)"/)?.[1];

let apiKey;
if (existingKey && existingKey !== 'REPLACE_ME') {
  apiKey = existingKey;
  ok('API_KEY 已存在，跳过生成');
} else {
  apiKey = randomBytes(32).toString('hex');

  // 写入 wrangler.toml [vars] 给本地 dev 用
  if (toml.includes('[vars]')) {
    toml = toml.replace(
      /API_KEY\s*=\s*"[^"]*"/,
      `API_KEY = "${apiKey}"`,
    );
  } else {
    toml += `\n[vars]\nAPI_KEY = "${apiKey}"\n`;
  }
  writeToml(toml);
  ok(`API_KEY 已生成并写入 wrangler.toml`);
}

// 同步到远程 secret
console.log('   🔑 同步 API_KEY 到 Cloudflare Secret...');
try {
  execSync(`echo "${apiKey}" | npx wrangler secret put API_KEY 2>&1`, {
    cwd: ROOT,
    stdio: 'pipe',
  });
  ok('远程 Secret 已设置');
} catch (e) {
  warn('远程 Secret 设置失败（可能项目尚未部署），部署后请运行:');
  warn('npx wrangler secret put API_KEY');
}

// ── 6. Drizzle 迁移 ──────────────────────────────────────
step('6️⃣', '生成数据库迁移文件...');

const sqlFiles = existsSync(DRIZZLE_DIR)
  ? run(`ls ${DRIZZLE_DIR}/*.sql 2>/dev/null`, { allowFail: true })
  : null;

if (sqlFiles) {
  ok('迁移文件已存在');
} else {
  console.log('   🔨 生成 Drizzle 迁移...');
  run('npx drizzle-kit generate');
  ok('迁移文件已生成');
}

// ── 7. 执行迁移建表 ──────────────────────────────────────
step('7️⃣', '执行数据库迁移建表...');

const migrationFile = run(`ls ${DRIZZLE_DIR}/*.sql | head -1`, { allowFail: true });
if (!migrationFile) {
  fail('找不到迁移 SQL 文件');
}

// 本地 D1 建表
console.log('   📦 本地 D1 建表...');
run(
  `npx wrangler d1 execute flare-forge-db --local --file=${migrationFile}`,
  { allowFail: true },
);
ok('本地 D1 建表完成');

// 远程 D1 建表
console.log('   ☁️  远程 D1 建表...');
const remoteResult = run(
  `npx wrangler d1 execute flare-forge-db --remote --file=${migrationFile} 2>&1`,
  { allowFail: true },
);
if (remoteResult && remoteResult.includes('success')) {
  ok('远程 D1 建表完成');
} else if (remoteResult && remoteResult.includes('already exists')) {
  ok('远程 D1 表已存在');
} else {
  ok('远程 D1 已就绪');
}

// ── 8. 完成 ──────────────────────────────────────────────
const finalToml = readToml();
const finalKey = finalToml.match(/API_KEY\s*=\s*"([^"]*)"/)?.[1] || '';
const finalDbId = finalToml.match(/database_id\s*=\s*"([^"]*)"/)?.[1] || '';

console.log('\n');
console.log('╔══════════════════════════════════════════════╗');
console.log('║   🎉 初始化完成！                            ║');
console.log('╠══════════════════════════════════════════════╣');
console.log('║                                              ║');
console.log('║   已配置资源:                                ║');
console.log(`║   D1 数据库:  ${finalDbId.slice(0, 20).padEnd(28)}  ║`);
console.log(`║   R2 存储桶:  flare-forge-assets              ║`);
console.log(`║   API_KEY:    ${finalKey.slice(0, 20)}...        ║`);
console.log('║                                              ║');
console.log('╠══════════════════════════════════════════════╣');
console.log('║                                              ║');
console.log('║   下一步:                                    ║');
console.log('║                                              ║');
console.log('║   1. 启动开发服务器                           ║');
console.log('║      npm run dev                             ║');
console.log('║                                              ║');
console.log('║   2. 写文章 → 发布                           ║');
console.log('║      content/news/ 下写 .md + 放图片         ║');
console.log('║      npm run publish content/news/xxx.md     ║');
console.log('║                                              ║');
console.log('║   3. 部署上线                                 ║');
console.log('║      npm run build                           ║');
console.log('║      npm run deploy                          ║');
console.log('║                                              ║');
console.log('╚══════════════════════════════════════════════╝');
console.log('');
