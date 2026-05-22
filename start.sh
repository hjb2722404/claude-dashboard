#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node &> /dev/null; then
  echo "错误: 未检测到 Node.js，请先安装 Node.js 18+"
  echo "下载地址: https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "错误: Node.js 版本过低 (当前 $(node -v))，需要 18+"
  exit 1
fi

exec node "$SCRIPT_DIR/cli.cjs" "$@"
