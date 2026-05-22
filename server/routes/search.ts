import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { getClaudeProjectsDir, decodeProjectPath } from '../services/claude-reader';

const router = Router();

interface SearchResult {
  projectPath: string;
  projectDisplayName: string;
  sessionId: string;
  model: string;
  startTime: string;
  matches: string[];
}

function extractText(entry: Record<string, unknown>): string {
  let text = '';
  const content = (entry as Record<string, unknown>).message
    ? ((entry as Record<string, unknown>).message as Record<string, unknown>).content
    : undefined;

  if (typeof content === 'string') {
    text = content;
  } else if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'object' && block !== null) {
        const b = block as Record<string, unknown>;
        if (b.type === 'text' && b.text) text += (b.text as string) + ' ';
        if (b.type === 'tool_use' && b.input) text += JSON.stringify(b.input) + ' ';
        if (b.type === 'tool_result') {
          if (typeof b.content === 'string') text += b.content + ' ';
          else if (Array.isArray(b.content)) {
            for (const sub of b.content) {
              if (typeof sub === 'object' && sub !== null && (sub as Record<string, unknown>).text) {
                text += ((sub as Record<string, unknown>).text as string) + ' ';
              }
            }
          }
        }
      }
    }
  }
  return text;
}

router.get('/', (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  if (!query || query.length < 2) return res.json([]);

  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  if (!fs.existsSync(CLAUDE_PROJECTS_DIR)) return res.json([]);

  const results: SearchResult[] = [];
  const projectDirs = fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());

  for (const dir of projectDirs) {
    const projectDir = path.join(CLAUDE_PROJECTS_DIR, dir.name);
    const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));

    for (const file of jsonlFiles) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim());

      let model = 'unknown';
      let startTime = '';
      const matches: string[] = [];

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.message?.model && entry.message.model !== 'unknown') model = entry.message.model;
          if (entry.timestamp && !startTime) startTime = entry.timestamp;

          const text = extractText(entry);
          if (text.toLowerCase().includes(query)) {
            const idx = text.toLowerCase().indexOf(query);
            const start = Math.max(0, idx - 40);
            const end = Math.min(text.length, idx + query.length + 80);
            const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
            if (matches.length < 3) matches.push(snippet.trim());
          }
        } catch { /* skip */ }
      }

      if (matches.length > 0) {
        results.push({
          projectPath: dir.name,
          projectDisplayName: decodeProjectPath(dir.name),
          sessionId: file.replace('.jsonl', ''),
          model,
          startTime,
          matches,
        });
      }
    }
  }

  results.sort((a, b) => b.startTime.localeCompare(a.startTime));
  res.json(results.slice(0, 30));
});

export default router;
