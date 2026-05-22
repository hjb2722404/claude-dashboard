# Claude Dashboard 设计文档

## 概述

构建一个全栈 Web 应用，读取 `~/.claude/projects/` 下的 JSONL 会话文件，以 Claude 风格的对话界面展示历史会话，包含对话内容、thinking 过程、工具调用记录和 token 消耗统计。

## 目标用户

开发者本人，用于回顾和分析自己的 Claude Code 使用历史。

## 技术栈

| 层 | 选型 |
|---|------|
| 后端 | Express + TypeScript |
| 前端 | React 18 + Vite + TypeScript |
| CSS | Tailwind CSS |
| 路由 | react-router-dom v6 |
| 数据请求 | tanstack/react-query |
| 代码高亮 | react-markdown + rehype-highlight |
| 并发启动 | concurrently |

## 项目结构

```
claude-dashboard/
├── server/
│   ├── index.ts              # Express 入口，监听 3001
│   ├── routes/
│   │   ├── projects.ts       # GET /api/projects
│   │   └── sessions.ts       # GET /api/sessions/:projectPath
│   └── services/
│       ├── claude-reader.ts   # 扫描 ~/.claude/projects/ 目录
│       └── jsonl-parser.ts    # 解析 JSONL，树形→线性转换
├── src/
│   ├── App.tsx               # 路由入口
│   ├── pages/
│   │   ├── ProjectList.tsx   # 项目列表页
│   │   └── SessionView.tsx   # 会话详情页
│   ├── components/
│   │   ├── Sidebar.tsx       # 项目/会话侧边栏
│   │   ├── MessageBubble.tsx # 单条消息
│   │   ├── ThinkingBlock.tsx # 折叠 thinking 区域
│   │   └── TokenStats.tsx    # token 消耗统计
│   └── types/
│       └── index.ts          # 共享类型定义
├── vite.config.ts            # proxy /api → localhost:3001
└── package.json
```

## API 设计

### GET /api/projects

返回所有项目的摘要列表。

```json
[
  {
    "path": "D--projects-claude-dashboard",
    "displayName": "D:\\projects\\claude-dashboard",
    "sessionCount": 3,
    "lastActive": "2026-05-21T09:51:42Z"
  }
]
```

### GET /api/sessions/:projectPath

返回指定项目下的会话列表。

```json
[
  {
    "id": "2158d427-62f9-4ba3-9d57-ca30ae6c20e4",
    "startTime": "2026-05-21T09:51:42Z",
    "messageCount": 50,
    "totalTokens": 123456,
    "model": "mimo-v2-pro"
  }
]
```

### GET /api/sessions/:projectPath/:sessionId

返回完整会话数据，消息已展平为有序列表。

```json
{
  "id": "2158d427-...",
  "model": "mimo-v2-pro",
  "messages": [
    {
      "role": "user",
      "content": "...",
      "timestamp": "2026-05-21T09:51:42Z"
    },
    {
      "role": "assistant",
      "content": "回复文本",
      "thinking": "思考过程...",
      "toolCalls": [
        {
          "name": "Read",
          "input": { "file_path": "/path/to/file" },
          "result": "文件内容..."
        }
      ],
      "usage": {
        "input_tokens": 23786,
        "output_tokens": 97,
        "cache_read_input_tokens": 0
      },
      "timestamp": "2026-05-21T09:54:14Z"
    }
  ],
  "totalTokens": {
    "input": 50000,
    "output": 5000
  },
  "filesModified": ["src/App.tsx", "server/index.ts"]
}
```

## 数据处理

### JSONL 格式

源文件位于 `~/.claude/projects/<项目目录>/<uuid>.jsonl`，每行一个 JSON 对象。

### 树形→线性转换

每条消息有 `parentUuid` 字段形成链表。解析逻辑：

1. 读取全部行，过滤出 `type=message` 和 `type=user` 的条目
2. 从 `last-prompt` 类型条目获取叶子节点 UUID
3. 沿 `parentUuid` 反向遍历，构建有序消息列表

### 消息类型处理

| type | 处理 |
|------|------|
| `message` (role=user) | 用户消息气泡 |
| `message` (role=assistant, content.thinking) | 折叠 thinking 区域 |
| `message` (role=assistant, content.tool_use) | 工具调用卡片 |
| `message` (role=assistant, content.text) | 助手文本回复 |
| `user` (role=user) | 用户输入消息 |
| `tool_result` | 关联到对应 tool_use，展示结果 |
| `hook_*`, `permission-mode` 等 | 忽略 |

### Token 聚合

遍历所有 assistant 消息的 `usage` 字段，累加：
- `input_tokens`
- `output_tokens`
- `cache_read_input_tokens`

### 文件修改记录

从工具调用中提取 `Edit`、`Write` 工具的 `file_path` 参数，去重后汇总。

## UI 设计

### 页面布局

```
┌─────────────────────────────────────────────┐
│  Claude Dashboard                    [刷新] │
├──────────┬──────────────────────────────────┤
│ 项目列表  │                                  │
│  ├─ 项目A │   会话对话区域                    │
│  │  ├─ 会话1                                │
│  │  └─ 会话2 │  [用户] 你好，请帮我...       │
│  ├─ 项目B │                                  │
│  └─ 项目C │  [助手] 好的，我来...            │
│           │    └─ [thinking] 折叠/展开       │
│           │    └─ [工具: Read] file.ts       │
│           │                                  │
│           │  [用户] 继续...                   │
│           │                                  │
├──────────┴──────────────────────────────────┤
│ Token: 输入 50,000 | 输出 5,000 | 缓存 10,000 │
└─────────────────────────────────────────────┘
```

### 交互细节

- **左侧栏**：项目列表 + 会话列表，两级树形结构，点击切换
- **消息气泡**：用户消息深色靠右，助手消息浅色靠左
- **Thinking 区域**：默认折叠，点击标题展开，显示完整思考过程
- **工具调用**：可折叠卡片，显示工具名 + 关键参数，展开查看完整输入和输出结果
- **代码块**：markdown 渲染 + 语法高亮
- **顶部状态栏**：会话开始时间、模型名称
- **底部统计栏**：input/output/cache token 消耗

## 错误处理

- `~/.claude` 目录不存在：页面提示"未找到 Claude 数据目录"
- JSONL 文件损坏：跳过该行，记录警告日志
- 空项目目录：不显示在项目列表中
- 网络错误：react-query 自动重试，显示加载失败提示

## 验收标准

1. 启动后能看到 `~/.claude/projects/` 下所有项目的列表
2. 点击项目能看到该项目下的所有会话列表
3. 点击会话能看到完整的对话内容，包括：
   - 用户消息和助手回复
   - Thinking 过程（可折叠展开）
   - 工具调用记录（可折叠展开）
   - Token 消耗统计
4. 代码块有语法高亮
5. 界面风格接近 Claude 官网对话界面
