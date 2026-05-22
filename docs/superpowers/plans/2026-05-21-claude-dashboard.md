# Claude Dashboard 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个全栈 Web 应用，读取 `~/.claude/projects/` 下的 JSONL 会话文件，以 Claude 风格的对话界面展示历史会话。

**Architecture:** Express 后端读取 JSONL 文件并提供 REST API，React 前端通过 react-query 请求数据并渲染对话界面。前后端通过 Vite proxy 连接。

**Tech Stack:** Express, React 18, Vite, TypeScript, Tailwind CSS, react-router-dom v6, tanstack/react-query, react-markdown, rehype-highlight, concurrently

---

## 文件结构

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
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── index.html
```

---

## Task 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (占位)
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `src/index.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "claude-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "tsx watch server/index.ts",
    "dev:client": "vite",
    "build": "tsc && vite build"
  },
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "@tanstack/react-query": "^5.62.0",
    "react-markdown": "^9.0.1",
    "rehype-highlight": "^7.0.0",
    "highlight.js": "^11.11.0"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.10.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "concurrently": "^9.1.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
npm install
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "server"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

- [ ] **Step 5: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 src/main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 7: 创建 src/App.tsx 占位**

```typescript
function App() {
  return <div className="text-xl">Claude Dashboard</div>;
}

export default App;
```

- [ ] **Step 8: 创建 Tailwind 配置**

tailwind.config.js:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

postcss.config.js:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 9: 创建 src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- [ ] **Step 10: 验证项目能启动**

```bash
npm run dev:client
```

Expected: Vite dev server 启动在 http://localhost:5173，显示 "Claude Dashboard" 文字。

- [ ] **Step 11: 首次提交**

```bash
git init
git add .
git commit -m "chore: initialize project with Vite + React + TypeScript + Tailwind"
```

---

## Task 2: 共享类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建 src/types/index.ts**

```typescript
// 项目摘要
export interface ProjectSummary {
  path: string;
  displayName: string;
  sessionCount: number;
  lastActive: string;
}

// 会话摘要
export interface SessionSummary {
  id: string;
  startTime: string;
  messageCount: number;
  totalTokens: number;
  model: string;
}

// 工具调用
export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
  result: string;
}

// Token 使用情况
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
}

// 会话消息
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  timestamp: string;
}

// 完整会话数据
export interface SessionDetail {
  id: string;
  model: string;
  messages: Message[];
  totalTokens: {
    input: number;
    output: number;
  };
  filesModified: string[];
}
```

- [ ] **Step 2: 提交**

```bash
git add src/types/index.ts
git commit -m "feat: add shared type definitions"
```

---

## Task 3: Claude Reader 服务

**Files:**
- Create: `server/services/claude-reader.ts`
- Create: `server/services/__tests__/claude-reader.test.ts`

- [ ] **Step 1: 编写 claude-reader.ts**

```typescript
import fs from 'fs';
import path from 'path';

const CLAUDE_PROJECTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.claude',
  'projects'
);

export interface ProjectInfo {
  path: string;
  displayName: string;
  sessionCount: number;
  lastActive: string;
}

export interface SessionInfo {
  id: string;
  startTime: string;
  messageCount: number;
  totalTokens: number;
  model: string;
}

// 获取所有项目列表
export function getProjects(): ProjectInfo[] {
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((dir) => {
      const projectDir = path.join(CLAUDE_PROJECTS_DIR, dir.name);
      const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

      if (jsonlFiles.length === 0) {
        return null;
      }

      // 获取最新修改时间
      const stats = jsonlFiles.map((f) =>
        fs.statSync(path.join(projectDir, f))
      );
      const lastModified = Math.max(...stats.map((s) => s.mtimeMs));

      return {
        path: dir.name,
        displayName: decodeProjectPath(dir.name),
        sessionCount: jsonlFiles.length,
        lastActive: new Date(lastModified).toISOString(),
      };
    })
    .filter((p): p is ProjectInfo => p !== null);
}

// 获取项目下的会话列表
export function getSessions(projectPath: string): SessionInfo[] {
  const projectDir = path.join(CLAUDE_PROJECTS_DIR, projectPath);

  if (!fs.existsSync(projectDir)) {
    return [];
  }

  const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

  return jsonlFiles.map((file) => {
    const sessionId = file.replace('.jsonl', '');
    const filePath = path.join(projectDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    // 解析会话摘要信息
    let messageCount = 0;
    let totalTokens = 0;
    let model = 'unknown';
    let startTime = '';

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        if (entry.type === 'message' || entry.type === 'user') {
          messageCount++;
        }

        if (entry.usage) {
          totalTokens +=
            (entry.usage.input_tokens || 0) +
            (entry.usage.output_tokens || 0);
        }

        if (entry.model && entry.model !== model) {
          model = entry.model;
        }

        if (entry.timestamp && !startTime) {
          startTime = entry.timestamp;
        }
      } catch {
        // 跳过损坏的行
      }
    }

    return {
      id: sessionId,
      startTime: startTime || new Date().toISOString(),
      messageCount,
      totalTokens,
      model,
    };
  });
}

// 读取完整会话数据
export function getSessionDetail(projectPath: string, sessionId: string) {
  const filePath = path.join(CLAUDE_PROJECTS_DIR, projectPath, `${sessionId}.jsonl`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return content;
}

// 解码项目路径（D--projects-xxx → D:\projects\xxx）
export function decodeProjectPath(encoded: string): string {
  // Windows 路径: D--projects-xxx → D:\projects\xxx
  // Unix 路径: home-user-xxx → /home/user/xxx
  const decoded = encoded.replace(/--/g, ':\\').replace(/-/g, '\\');
  return decoded;
}
```

- [ ] **Step 2: 提交**

```bash
git add server/services/claude-reader.ts
git commit -m "feat: add Claude reader service for scanning projects directory"
```

---

## Task 4: JSONL 解析服务

**Files:**
- Create: `server/services/jsonl-parser.ts`

- [ ] **Step 1: 编写 jsonl-parser.ts**

```typescript
import { Message, SessionDetail, ToolCall, TokenUsage } from '../../src/types';

interface RawEntry {
  type: string;
  uuid?: string;
  parentUuid?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: string | Array<Record<string, unknown>>;
    model?: string;
    usage?: TokenUsage;
  };
  leafUuid?: string;
  toolUseResult?: {
    content?: string;
  };
}

// 解析 JSONL 内容为会话详情
export function parseSession(jsonlContent: string): SessionDetail {
  const lines = jsonlContent.split('\n').filter((l) => l.trim());
  const entries: RawEntry[] = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // 跳过损坏的行
    }
  }

  // 构建 UUID → entry 映射
  const entryMap = new Map<string, RawEntry>();
  for (const entry of entries) {
    if (entry.uuid) {
      entryMap.set(entry.uuid, entry);
    }
  }

  // 找到叶子节点（last-prompt 类型）
  const leafEntry = entries.find((e) => e.type === 'last-prompt');
  const leafUuid = leafEntry?.leafUuid;

  if (!leafUuid) {
    return {
      id: '',
      model: 'unknown',
      messages: [],
      totalTokens: { input: 0, output: 0 },
      filesModified: [],
    };
  }

  // 沿 parentUuid 反向遍历构建消息链
  const messageChain: RawEntry[] = [];
  let currentUuid: string | undefined = leafUuid;

  while (currentUuid) {
    const entry = entryMap.get(currentUuid);
    if (!entry) break;

    messageChain.push(entry);
    currentUuid = entry.parentUuid;
  }

  // 反转为正序
  messageChain.reverse();

  // 转换为 Message 格式
  const messages: Message[] = [];
  const filesModified: string[] = [];
  let totalInput = 0;
  let totalOutput = 0;

  for (const entry of messageChain) {
    if (entry.type !== 'message' && entry.type !== 'user') continue;
    if (!entry.message) continue;

    const { role, content, usage } = entry.message;

    if (!role || (role !== 'user' && role !== 'assistant')) continue;

    let textContent = '';
    let thinking = '';
    const toolCalls: ToolCall[] = [];

    if (typeof content === 'string') {
      textContent = content;
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && block.text) {
          textContent += block.text;
        } else if (block.type === 'thinking' && block.thinking) {
          thinking = block.thinking as string;
        } else if (block.type === 'tool_use') {
          const toolCall: ToolCall = {
            name: (block.name as string) || 'unknown',
            input: (block.input as Record<string, unknown>) || {},
            result: '',
          };

          // 提取修改的文件
          if (['Edit', 'Write'].includes(toolCall.name)) {
            const filePath = toolCall.input.file_path || toolCall.input.path;
            if (filePath && typeof filePath === 'string') {
              filesModified.push(filePath);
            }
          }

          toolCalls.push(toolCall);
        }
      }
    }

    // 累计 token
    if (usage) {
      totalInput += usage.input_tokens || 0;
      totalOutput += usage.output_tokens || 0;
    }

    messages.push({
      role: role as 'user' | 'assistant',
      content: textContent,
      thinking: thinking || undefined,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: usage || undefined,
      timestamp: entry.timestamp || new Date().toISOString(),
    });
  }

  // 获取模型名
  const modelEntry = entries.find((e) => e.message?.model);
  const model = modelEntry?.message?.model || 'unknown';

  // 获取会话 ID
  const firstEntry = entries[0];
  const sessionId = firstEntry?.uuid || '';

  return {
    id: sessionId,
    model,
    messages,
    totalTokens: {
      input: totalInput,
      output: totalOutput,
    },
    filesModified: [...new Set(filesModified)],
  };
}
```

- [ ] **Step 2: 提交**

```bash
git add server/services/jsonl-parser.ts
git commit -m "feat: add JSONL parser with tree-to-linear message conversion"
```

---

## Task 5: API 路由

**Files:**
- Create: `server/routes/projects.ts`
- Create: `server/routes/sessions.ts`

- [ ] **Step 1: 创建 projects 路由**

```typescript
import { Router } from 'express';
import { getProjects } from '../services/claude-reader';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const projects = getProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects' });
  }
});

export default router;
```

- [ ] **Step 2: 创建 sessions 路由**

```typescript
import { Router } from 'express';
import { getSessions, getSessionDetail } from '../services/claude-reader';
import { parseSession } from '../services/jsonl-parser';

const router = Router();

// GET /api/sessions/:projectPath - 获取会话列表
router.get('/:projectPath', (req, res) => {
  try {
    const { projectPath } = req.params;
    const sessions = getSessions(projectPath);
    res.json(sessions);
  } catch (error) {
    console.error('Error reading sessions:', error);
    res.status(500).json({ error: 'Failed to read sessions' });
  }
});

// GET /api/sessions/:projectPath/:sessionId - 获取会话详情
router.get('/:projectPath/:sessionId', (req, res) => {
  try {
    const { projectPath, sessionId } = req.params;
    const content = getSessionDetail(projectPath, sessionId);

    if (!content) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const session = parseSession(content);
    res.json(session);
  } catch (error) {
    console.error('Error parsing session:', error);
    res.status(500).json({ error: 'Failed to parse session' });
  }
});

export default router;
```

- [ ] **Step 3: 提交**

```bash
git add server/routes/
git commit -m "feat: add projects and sessions API routes"
```

---

## Task 6: Express 服务入口

**Files:**
- Create: `server/index.ts`

- [ ] **Step 1: 创建 server/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import sessionsRouter from './routes/sessions';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/sessions', sessionsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

- [ ] **Step 2: 提交**

```bash
git add server/index.ts
git commit -m "feat: add Express server entry point on port 3001"
```

- [ ] **Step 3: 验证后端能启动**

```bash
npm run dev:server
```

Expected: Server 启动，输出 "Server running on http://localhost:3001"

---

## Task 7: 前端路由和布局

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 更新 App.tsx 为路由入口**

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectList from './pages/ProjectList';
import SessionView from './pages/SessionView';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <header className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Claude Dashboard</h1>
        </header>
        <div className="flex-1 flex overflow-hidden">
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:projectPath" element={<SessionView />} />
            <Route path="/project/:projectPath/session/:sessionId" element={<SessionView />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: 提交**

```bash
git add src/App.tsx
git commit -m "feat: add React Router with project and session routes"
```

---

## Task 8: Sidebar 组件

**Files:**
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: 编写 Sidebar.tsx**

```typescript
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProjectSummary, SessionSummary } from '../types';

interface SidebarProps {
  projectPath?: string;
}

function Sidebar({ projectPath }: SidebarProps) {
  const { data: projects = [] } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  const { data: sessions = [] } = useQuery<SessionSummary[]>({
    queryKey: ['sessions', projectPath],
    queryFn: () =>
      fetch(`/api/sessions/${projectPath}`).then((r) => r.json()),
    enabled: !!projectPath,
  });

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          项目列表
        </h2>
        <nav className="space-y-1">
          {projects.map((project) => (
            <div key={project.path}>
              <Link
                to={`/project/${project.path}`}
                className={`block px-3 py-2 rounded-md text-sm ${
                  projectPath === project.path
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{project.displayName}</span>
                  <span className="text-xs text-gray-400">
                    {project.sessionCount}
                  </span>
                </div>
              </Link>

              {projectPath === project.path && sessions.length > 0 && (
                <div className="ml-4 mt-1 space-y-1">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/project/${project.path}/session/${session.id}`}
                      className="block px-3 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100 truncate"
                    >
                      {new Date(session.startTime).toLocaleDateString('zh-CN')} - {session.model}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
```

- [ ] **Step 2: 提交**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add Sidebar component with project and session list"
```

---

## Task 9: ThinkingBlock 组件

**Files:**
- Create: `src/components/ThinkingBlock.tsx`

- [ ] **Step 1: 编写 ThinkingBlock.tsx**

```typescript
import { useState } from 'react';

interface ThinkingBlockProps {
  thinking: string;
}

function ThinkingBlock({ thinking }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-2 border border-purple-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 text-left text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center justify-between"
      >
        <span>Thinking</span>
        <svg
          className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="p-3 bg-gray-50 text-sm text-gray-700 whitespace-pre-wrap font-mono">
          {thinking}
        </div>
      )}
    </div>
  );
}

export default ThinkingBlock;
```

- [ ] **Step 2: 提交**

```bash
git add src/components/ThinkingBlock.tsx
git commit -m "feat: add collapsible ThinkingBlock component"
```

---

## Task 10: TokenStats 组件

**Files:**
- Create: `src/components/TokenStats.tsx`

- [ ] **Step 1: 编写 TokenStats.tsx**

```typescript
interface TokenStatsProps {
  input: number;
  output: number;
  cacheRead?: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function TokenStats({ input, output, cacheRead }: TokenStatsProps) {
  return (
    <div className="bg-gray-900 text-gray-300 px-6 py-2 text-sm flex items-center gap-6">
      <span>
        Token: 输入 <span className="text-white font-medium">{formatNumber(input)}</span>
      </span>
      <span>
        | 输出 <span className="text-white font-medium">{formatNumber(output)}</span>
      </span>
      {cacheRead !== undefined && cacheRead > 0 && (
        <span>
          | 缓存 <span className="text-white font-medium">{formatNumber(cacheRead)}</span>
        </span>
      )}
    </div>
  );
}

export default TokenStats;
```

- [ ] **Step 2: 提交**

```bash
git add src/components/TokenStats.tsx
git commit -m "feat: add TokenStats component for token consumption display"
```

---

## Task 11: MessageBubble 组件

**Files:**
- Create: `src/components/MessageBubble.tsx`

- [ ] **Step 1: 编写 MessageBubble.tsx**

```typescript
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Message } from '../types';
import ThinkingBlock from './ThinkingBlock';

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gray-800 text-white'
            : 'bg-white border border-gray-200 text-gray-900'
        }`}
      >
        {/* 消息内容 */}
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Thinking 区域 */}
        {message.thinking && <ThinkingBlock thinking={message.thinking} />}

        {/* 工具调用 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-2 space-y-1">
            {message.toolCalls.map((tool, i) => (
              <details key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <summary className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 cursor-pointer hover:bg-gray-100">
                  <span className="text-blue-600">{tool.name}</span>
                  {tool.input.file_path && (
                    <span className="ml-2 text-gray-500 font-mono text-xs">
                      {(tool.input.file_path as string).split('/').pop()}
                    </span>
                  )}
                </summary>
                <div className="p-3 bg-gray-50">
                  <div className="text-xs font-medium text-gray-500 mb-1">输入:</div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(tool.input, null, 2)}
                  </pre>
                  {tool.result && (
                    <>
                      <div className="text-xs font-medium text-gray-500 mt-2 mb-1">结果:</div>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-48">
                        {tool.result}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}

        {/* 时间戳 */}
        <div
          className={`text-xs mt-2 ${
            isUser ? 'text-gray-400' : 'text-gray-400'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString('zh-CN')}
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
```

- [ ] **Step 2: 提交**

```bash
git add src/components/MessageBubble.tsx
git commit -m "feat: add MessageBubble with markdown, thinking, and tool call rendering"
```

---

## Task 12: ProjectList 页面

**Files:**
- Create: `src/pages/ProjectList.tsx`

- [ ] **Step 1: 编写 ProjectList.tsx**

```typescript
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ProjectSummary } from '../types';
import Sidebar from '../components/Sidebar';

function ProjectList() {
  const { data: projects = [], isLoading, error } = useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  });

  return (
    <>
      <Sidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">所有项目</h2>

        {isLoading && <p className="text-gray-500">加载中...</p>}

        {error && (
          <p className="text-red-500">加载失败，请检查后端服务是否启动</p>
        )}

        {!isLoading && projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">未找到 Claude 数据目录</p>
            <p className="text-sm mt-2">请确保 ~/.claude/projects/ 目录存在</p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.path}
              to={`/project/${project.path}`}
              className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-gray-900 truncate">
                {project.displayName}
              </h3>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                <span>{project.sessionCount} 个会话</span>
                <span>
                  {new Date(project.lastActive).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}

export default ProjectList;
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/ProjectList.tsx
git commit -m "feat: add ProjectList page with project cards"
```

---

## Task 13: SessionView 页面

**Files:**
- Create: `src/pages/SessionView.tsx`

- [ ] **Step 1: 编写 SessionView.tsx**

```typescript
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SessionDetail } from '../types';
import Sidebar from '../components/Sidebar';
import MessageBubble from '../components/MessageBubble';
import TokenStats from '../components/TokenStats';

function SessionView() {
  const { projectPath, sessionId } = useParams<{
    projectPath: string;
    sessionId: string;
  }>();

  const { data: session, isLoading, error } = useQuery<SessionDetail>({
    queryKey: ['session', projectPath, sessionId],
    queryFn: () =>
      fetch(`/api/sessions/${projectPath}/${sessionId}`).then((r) => r.json()),
    enabled: !!projectPath && !!sessionId,
  });

  return (
    <>
      <Sidebar projectPath={projectPath} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部状态栏 */}
        {session && (
          <div className="bg-gray-100 px-6 py-2 text-sm text-gray-600 flex items-center gap-4 border-b">
            <span>模型: {session.model}</span>
            <span>
              {session.messages.length > 0 &&
                new Date(session.messages[0].timestamp).toLocaleString('zh-CN')}
            </span>
            {session.filesModified.length > 0 && (
              <span>修改文件: {session.filesModified.length} 个</span>
            )}
          </div>
        )}

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {isLoading && <p className="text-gray-500">加载中...</p>}

          {error && (
            <p className="text-red-500">加载会话失败</p>
          )}

          {!sessionId && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">选择一个会话查看对话内容</p>
            </div>
          )}

          {session && session.messages.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>此会话没有消息内容</p>
            </div>
          )}

          {session?.messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}
        </div>

        {/* 底部 Token 统计 */}
        {session && (
          <TokenStats
            input={session.totalTokens.input}
            output={session.totalTokens.output}
          />
        )}
      </main>
    </>
  );
}

export default SessionView;
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/SessionView.tsx
git commit -m "feat: add SessionView page with message list and token stats"
```

---

## Task 14: 集成测试和验收

**Files:**
- (无新文件)

- [ ] **Step 1: 启动完整应用**

```bash
npm run dev
```

Expected: 同时启动后端 (3001) 和前端 (5173)

- [ ] **Step 2: 手动验证功能**

1. 打开 http://localhost:5173
2. 检查项目列表是否显示 `~/.claude/projects/` 下的项目
3. 点击项目，检查会话列表是否显示
4. 点击会话，检查对话内容是否正确展示
5. 验证 Thinking 区域可折叠展开
6. 验证工具调用卡片可折叠展开
7. 验证底部 Token 统计显示

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "feat: complete Claude Dashboard with full conversation viewer"
```

---

## 自查清单

**Spec 覆盖:**
- [x] GET /api/projects - Task 5
- [x] GET /api/sessions/:projectPath - Task 5
- [x] GET /api/sessions/:projectPath/:sessionId - Task 5
- [x] JSONL 解析 + 树形→线性转换 - Task 4
- [x] 项目列表页 - Task 12
- [x] 会话详情页 - Task 13
- [x] Thinking 区域折叠 - Task 9
- [x] 工具调用卡片 - Task 11
- [x] Token 统计 - Task 10
- [x] 代码高亮 - Task 11 (rehype-highlight)
- [x] 错误处理 - Task 3, Task 12

**无占位符:** 所有步骤包含完整代码，无 "TBD" 或 "implement later"

**类型一致性:** 所有组件使用 src/types/index.ts 中定义的类型，签名统一
