import fs from 'fs';
import os from 'os';
import path from 'path';

// 获取 Claude 数据目录，优先级：环境变量 > 默认路径
function resolveClaudeDir(): string {
  if (process.env.CLAUDE_DATA_DIR) return process.env.CLAUDE_DATA_DIR;
  return path.join(os.homedir(), '.claude');
}

export function getClaudeProjectsDir(): string {
  return path.join(resolveClaudeDir(), 'projects');
}

// 平台感知的路径解码
export function decodeProjectPath(encoded: string): string {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: -- → :\ (驱动器), - → \ (路径分隔)
    // 先处理 --，再处理单独的 -
    let decoded = encoded.replace(/--/g, ':\\');
    decoded = decoded.replace(/-/g, '\\');
    return decoded;
  }

  // macOS / Linux: - → / (路径分隔)
  // 没有驱动器编码，所以 -- 不需要特殊处理
  return encoded.replace(/-/g, '/');
}

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

// 通用缓存
interface CacheEntry<T> {
  data: T;
  time: number;
}

const caches = new Map<string, CacheEntry<unknown>>();

export function cached<T>(key: string, ttl: number, fn: () => T): T {
  const entry = caches.get(key);
  if (entry && Date.now() - entry.time < ttl) return entry.data as T;
  const data = fn();
  caches.set(key, { data, time: Date.now() });
  return data;
}

export function clearCache(key?: string) {
  if (key) caches.delete(key);
  else caches.clear();
}

export function getProjects(): ProjectInfo[] {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) return [];

  const entries = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((dir) => {
      const projectDir = path.join(CLAUDE_PROJECTS_DIR, dir.name);
      const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

      if (jsonlFiles.length === 0) return null;

      const stats = jsonlFiles.map((f) => fs.statSync(path.join(projectDir, f)));
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

export function getSessions(projectPath: string): SessionInfo[] {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  const projectDir = path.join(CLAUDE_PROJECTS_DIR, projectPath);
  if (!fs.existsSync(projectDir)) return [];

  const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

  return jsonlFiles.map((file) => {
    const sessionId = file.replace('.jsonl', '');
    const filePath = path.join(projectDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    let messageCount = 0;
    let totalTokens = 0;
    let model = 'unknown';
    let startTime = '';

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        if (entry.type === 'user' || entry.type === 'assistant') {
          messageCount++;
        }

        if (entry.message?.usage) {
          totalTokens +=
            (entry.message.usage.input_tokens || 0) +
            (entry.message.usage.output_tokens || 0);
        }

        if (entry.message?.model && entry.message.model !== 'unknown') {
          model = entry.message.model;
        }

        if (entry.timestamp && !startTime) {
          startTime = entry.timestamp;
        }
      } catch { /* skip */ }
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

export function getSessionDetail(projectPath: string, sessionId: string) {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  const filePath = path.join(CLAUDE_PROJECTS_DIR, projectPath, `${sessionId}.jsonl`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf-8');
}
