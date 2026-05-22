import { Router } from 'express';
import { getProjects } from '../services/claude-reader';
import { parseSession } from '../services/jsonl-parser';
import { getClaudeProjectsDir, cached } from '../services/claude-reader';
import fs from 'fs';
import path from 'path';

const router = Router();

interface SessionStat {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  endTime: string;
  inputTokens: number;
  outputTokens: number;
  toolCalls: Record<string, number>;
}

function buildStats(): SessionStat[] {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  const projects = getProjects();
  const stats: SessionStat[] = [];

  for (const project of projects) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, project.path);
    if (!fs.existsSync(projectDir)) continue;

    const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      try {
        const content = fs.readFileSync(path.join(projectDir, file), 'utf-8');
        const session = parseSession(content);

        const toolCounts: Record<string, number> = {};
        for (const msg of session.messages) {
          if (msg.toolCalls) {
            for (const tc of msg.toolCalls) {
              toolCounts[tc.name] = (toolCounts[tc.name] || 0) + 1;
            }
          }
        }

        const firstTs = session.messages.length > 0 ? session.messages[0].timestamp : '';
        const lastTs = session.messages.length > 1
          ? session.messages[session.messages.length - 1].timestamp
          : firstTs;

        stats.push({
          projectPath: project.path,
          projectDisplayName: project.displayName,
          sessionId: session.id || file.replace('.jsonl', ''),
          model: session.model,
          startTime: firstTs,
          endTime: lastTs,
          inputTokens: session.totalTokens.input,
          outputTokens: session.totalTokens.output,
          toolCalls: toolCounts,
        });
      } catch { /* skip */ }
    }
  }

  return stats;
}

router.get('/', (_req, res) => {
  try {
    const stats = cached('stats', 60_000, buildStats);
    res.json(stats);
  } catch (error) {
    console.error('Error reading stats:', error);
    res.status(500).json({ error: 'Failed to read stats' });
  }
});

router.delete('/cache', (_req, res) => {
  res.json({ ok: true });
});

export default router;
