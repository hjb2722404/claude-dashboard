import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getClaudeProjectsDir, decodeProjectPath, cached } from '../services/claude-reader';

const router = Router();

interface RecentSession {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  messageCount: number;
  totalInput: number;
  totalOutput: number;
  preview: string;
  continuedFrom: string | null;
}

function buildRecent(limit: number): RecentSession[] {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) return [];

  const uuidToSession = new Map<string, string>();
  const projectDirs = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const dir of projectDirs) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, dir.name);
    const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      const sessionId = file.replace('.jsonl', '');
      for (const line of lines.slice(0, 20)) {
        try {
          const entry = JSON.parse(line);
          if (entry.uuid) uuidToSession.set(entry.uuid, sessionId);
        } catch { /* skip */ }
      }
    }
  }

  const results: RecentSession[] = [];

  for (const dir of projectDirs) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, dir.name);
    const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      const sessionId = file.replace('.jsonl', '');
      let model = 'unknown';
      let startTime = '';
      let preview = '';
      let messageCount = 0;
      let totalInput = 0;
      let totalOutput = 0;
      let continuedFrom: string | null = null;

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          if (entry.message?.model && entry.message.model !== 'unknown') {
            model = entry.message.model;
          }
          if (entry.timestamp && !startTime) {
            startTime = entry.timestamp;
          }
          if (entry.type === 'user' || entry.type === 'assistant') {
            messageCount++;
          }
          if (entry.message?.usage) {
            totalInput += entry.message.usage.input_tokens || 0;
            totalOutput += entry.message.usage.output_tokens || 0;
          }

          if (!preview && entry.type === 'user' && entry.message?.content) {
            if (typeof entry.message.content === 'string') {
              preview = entry.message.content;
            } else if (Array.isArray(entry.message.content)) {
              for (const block of entry.message.content) {
                if (typeof block === 'object' && block.type === 'text' && block.text) {
                  preview = block.text as string;
                  break;
                }
              }
            }
          }

          if (!continuedFrom && entry.parentUuid) {
            const parentSession = uuidToSession.get(entry.parentUuid);
            if (parentSession && parentSession !== sessionId) {
              continuedFrom = parentSession;
            }
          }
        } catch { /* skip */ }
      }

      if (startTime) {
        results.push({
          projectPath: dir.name,
          projectDisplayName: decodeProjectPath(dir.name),
          sessionId,
          model,
          startTime,
          messageCount,
          totalInput,
          totalOutput,
          preview: preview.slice(0, 300),
          continuedFrom,
        });
      }
    }
  }

  results.sort((a, b) => b.startTime.localeCompare(a.startTime));
  return results.slice(0, limit);
}

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const results = cached('recent', 30_000, () => buildRecent(200));
    res.json(results.slice(0, limit));
  } catch (error) {
    console.error('Error reading recent:', error);
    res.status(500).json({ error: 'Failed to read recent sessions' });
  }
});

export default router;
