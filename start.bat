@echo off
setlocal

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo 错误: 未检测到 Node.js，请先安装 Node.js 18+
  echo 下载地址: https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -v') do set MAJOR=%%v
set MAJOR=%MAJOR:~1%
if %MAJOR% LSS 18 (
  echo 错误: Node.js 版本过低，需要 18+
  pause
  exit /b 1
)

node "%~dp0cli.cjs" %*
