#!/usr/bin/env node
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

startServer(port);
