import fs from 'fs';
import path from 'path';

const CLAUDE_PROJECTS_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.claude',
  'projects'
);

// 复用共享类型，不重复定义
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
// 编码规则：-- → :\（驱动器），- → \（路径分隔）
// 注意：目录名中含 - 时会有歧义，此函数做近似解码，精确匹配用原始 path
export function decodeProjectPath(encoded: string): string {
  // 驱动器: D-- → D:\
  let decoded = encoded.replace(/--/g, ':\\');
  // 路径分隔: - → \
  decoded = decoded.replace(/-/g, '\\');
  return decoded;
}
