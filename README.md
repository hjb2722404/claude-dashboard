# Claude Dashboard

Claude Code 会话仪表板 —— 在本地可视化浏览、搜索和分析你的 AI 对话记录。数据完全离线，不上传任何内容。

## 功能特性

- **活动概览** —— 查看最近活跃的会话，支持按今天、近 7 天、近 30 天筛选
- **项目管理** —— 以卡片形式浏览所有 Claude 项目，快速定位历史会话
- **会话详情** —— 渲染完整对话（含 Markdown、代码高亮），展示思考过程、工具调用时间线、相关文件和 Token 消耗
- **全文搜索** —— 跨所有项目搜索对话内容，关键词高亮，支持按项目和模型过滤
- **数据统计** —— Token 消耗趋势、模型使用分布、工具调用统计、费用估算可视化
- **会话对比** —— 并排对比两个会话的 Token 和数据差异
- **导出功能** —— 将会话导出为 Markdown 文件
- **主题切换** —— 支持深色 / 浅色模式，自动跟随系统偏好

## 安装

### 方式一：下载预编译包（推荐）

从 [GitHub Releases](https://github.com/he-jianbo/claude-dashboard/releases) 下载最新版本的 `claude-code-dashboard.zip`，解压后运行：

- **Mac / Linux**：双击 `start.sh` 或终端执行 `./start.sh`
- **Windows**：双击 `start.bat`
- **通用方式**：`node cli.cjs`

> 需要 [Node.js 18+](https://nodejs.org)

### 方式二：源码运行

```bash
git clone https://github.com/he-jianbo/claude-dashboard.git
cd claude-dashboard
npm install
npm run dev
```

## 使用说明

### 启动服务

```bash
# 默认方式，端口 5174
claude-dashboard

# 指定端口
claude-dashboard --port 8080

# 自定义 Claude 数据目录
CLAUDE_DATA_DIR=/path/to/.claude claude-dashboard
```

启动后访问 `http://localhost:5174` 即可使用。

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `CLAUDE_DATA_DIR` | Claude 数据目录（需包含 `projects/` 子目录） | `~/.claude` |
| `PORT` | 服务端口号 | `5174` |

### 界面导航

- **活动** —— 查看最近会话列表
- **项目** —— 浏览所有项目及会话数量
- **统计** —— Token 和费用数据可视化
- **搜索框** —— 顶部搜索栏，输入关键词实时搜索所有对话内容
- **设置** —— 右上角齿轮图标，查看当前数据路径配置

### 数据目录结构

应用会自动读取 `CLAUDE_DATA_DIR/projects/` 下的 JSONL 会话文件。标准结构如下：

```
~/.claude/
└── projects/
    ├── my-project/
    │   └── 2025-01-01-abcdef.jsonl
    └── another-project/
        └── 2025-01-02-ghijkl.jsonl
```

## 技术栈

- **前端**：React 18 + TypeScript + Vite + Tailwind CSS + Recharts
- **后端**：Express + TypeScript
- **数据解析**：自定义 JSONL 解析器

## License

MIT
