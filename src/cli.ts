#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import { startServer } from '../server/index';

const args = process.argv.slice(2);
let port: number | undefined;

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '-p' || args[i] === '--port') && args[i + 1]) {
    port = parseInt(args[i + 1], 10);
    i++;
  }
  if (args[i] === '-h' || args[i] === '--help') {
    console.log(`
  claude-dashboard [options]

  Options:
    -p, --port <port>    指定端口号 (默认 5174)
    -h, --help           显示帮助信息

  Environment Variables:
    CLAUDE_DATA_DIR      自定义 Claude 数据目录路径
                        默认: ~/.claude
    PORT                 服务端口号 (默认 5174)

  Examples:
    claude-dashboard
    claude-dashboard --port 8080
    CLAUDE_DATA_DIR=/custom/path/.claude claude-dashboard
`);
    process.exit(0);
  }
}

// 自动检测 client 目录（支持 dist/bin/cli.js 和 cli.js 同级两种布局）
const dir = __dirname;
const candidates = [
  path.join(dir, 'client'),        // cli.cjs 和 client/ 同级（standalone）
  path.join(dir, '../client'),     // cli.cjs 在 dist/bin/，client/ 在 dist/（npm）
];
const staticDir = candidates.find(c => fs.existsSync(path.join(c, 'index.html')));

startServer(port, staticDir);
