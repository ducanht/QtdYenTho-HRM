#!/usr/bin/env node

/**
 * AUTO SHIP & DEPLOY SCRIPT - QTDYENTHO-HRM
 * Tự động hóa toàn bộ quy trình:
 * 1. Kiểm tra linter (oxlint)
 * 2. Build ứng dụng sản xuất (vite build)
 * 3. Git: Add, Commit với thông điệp tự động hoặc tùy chỉnh, và Push lên GitHub
 * 4. Firebase: Deploy Hosting (hoặc cả Firestore Rules/Indexes) lên https://qtdyentho-hrm.web.app
 */

import { execSync } from 'child_process';
import process from 'process';

function run(command, options = {}) {
  console.log(`\x1b[36m▶ [EXEC]\x1b[0m ${command}`);
  try {
    return execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`\x1b[31m✖ [ERROR] Lệnh thất bại: ${command}\x1b[0m`);
    process.exit(1);
  }
}

function runSilent(command) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

const args = process.argv.slice(2);
const isDeployAll = args.includes('--all') || args.includes('-a');
const customMsgArg = args.filter(a => !a.startsWith('-')).join(' ').trim();

console.log('\n\x1b[1m\x1b[32m=====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m🚀 QTDYENTHO-HRM: TỰ ĐỘNG SHIP GIT & DEPLOY FIREBASE \x1b[0m');
console.log('\x1b[1m\x1b[32m=====================================================\x1b[0m\n');

// 1. Linting
console.log('\x1b[34m[BƯỚC 1/4] Kiểm tra cú pháp mã nguồn (Linting)...\x1b[0m');
try {
  execSync('npm run lint', { stdio: 'inherit' });
} catch (e) {
  console.warn('\x1b[33m⚠ Có cảnh báo linter nhưng cho phép tiếp tục quy trình build.\x1b[0m');
}

// 2. Build sản xuất
console.log('\n\x1b[34m[BƯỚC 2/4] Build ứng dụng sản xuất (Vite Build)...\x1b[0m');
run('npm run build');

// 3. Git Commit & Push
console.log('\n\x1b[34m[BƯỚC 3/4] Đồng bộ Git Repository & Push lên GitHub...\x1b[0m');

const currentBranch = runSilent('git rev-parse --abbrev-ref HEAD') || 'master';
const gitStatus = runSilent('git status --porcelain');

if (gitStatus) {
  console.log('\x1b[33mPhát hiện thay đổi chưa commit. Đang tạo commit mới...\x1b[0m');
  run('git add -A');

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const commitMsg = customMsgArg || `feat(sync): tự động đồng bộ mã nguồn & deploy [${timestamp}]`;

  run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
} else {
  console.log('\x1b[32m✔ Không có file thay đổi mới trong working directory.\x1b[0m');
}

console.log(`\x1b[34mĐang đẩy mã nguồn lên nhánh [${currentBranch}] trên GitHub...\x1b[0m`);
run(`git push origin ${currentBranch}`);

// 4. Firebase Deploy
console.log('\n\x1b[34m[BƯỚC 4/4] Deploy trực tiếp lên Google Firebase...\x1b[0m');
const isWin = process.platform === 'win32';
const fbCmd = isWin ? 'firebase.cmd' : 'firebase';

if (isDeployAll) {
  console.log('Chế độ deploy toàn bộ: Hosting, Firestore Rules & Firestore Indexes...');
  run(`${fbCmd} deploy --only hosting,firestore:rules,firestore:indexes --non-interactive`);
} else {
  console.log('Chế độ deploy hosting mặc định...');
  run(`${fbCmd} deploy --only hosting --non-interactive`);
}

const latestCommit = runSilent('git rev-parse --short HEAD');

console.log('\n\x1b[1m\x1b[32m=====================================================\x1b[0m');
console.log('\x1b[1m\x1b[32m🎉 ĐÃ HOÀN TẤT TỰ ĐỘNG GIT PUSH & FIREBASE DEPLOY!   \x1b[0m');
console.log('\x1b[1m\x1b[32m=====================================================\x1b[0m');
console.log(`\x1b[36m• Git Branch    :\x1b[0m ${currentBranch} (${latestCommit})`);
console.log(`\x1b[36m• Remote Repo   :\x1b[0m https://github.com/ducanht/QtdYenTho-HRM`);
console.log(`\x1b[36m• Firebase Live :\x1b[0m \x1b[1mhttps://qtdyentho-hrm.web.app\x1b[0m`);
console.log(`\x1b[36m• Console       :\x1b[0m https://console.firebase.google.com/project/qtdyentho-hrm/overview\n`);
