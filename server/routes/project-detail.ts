import { Router } from 'express';
import { getClaudeProjectsDir, decodeProjectPath, getSessions, cached } from '../services/claude-reader';
import { parseSession } from '../services/jsonl-parser';
import fs from 'fs';
import path from 'path';

const router = Router();

function buildProjectDetail(projectPath: string) {
  const CLAUDE_PROJECTS_DIR = getClaudeProjectsDir();
  const projectDir = path.join(CLAUDE_PROJECTS_DIR, projectPath);
  if (!fs.existsSync(projectDir)) return null;

  const sessions = getSessions(projectPath);
  const displayName = decodeProjectPath(projectPath);

  let totalInput = 0;
  let totalOutput = 0;
  let totalMessages = 0;
  const modelMap = new Map<string, { count: number; tokens: number }>();
  const filesSet = new Map<string, number>();
  const dailyTokens = new Map<string, number>();

  for (const s of sessions) {
    totalMessages += s.messageCount;
    totalOutput += s.totalTokens;

    if (!modelMap.has(s.model)) modelMap.set(s.model, { count: 0, tokens: 0 });
    const m = modelMap.get(s.model)!;
    m.count++;
    m.tokens += s.totalTokens;

    const day = s.startTime.slice(0, 10);
    dailyTokens.set(day, (dailyTokens.get(day) || 0) + s.totalTokens);
  }

  const jsonlFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith('.jsonl'));
  for (const file of jsonlFiles) {
    try {
      const content = fs.readFileSync(path.join(projectDir, file), 'utf-8');
      const session = parseSession(content);
      totalInput += session.totalTokens.input;
      totalOutput += session.totalTokens.output - session.totalTokens.input;

      for (const f of session.filesModified) {
        const name = f.split(/[/\\]/).pop() || f;
        filesSet.set(name, (filesSet.get(name) || 0) + 1);
      }
    } catch { /* skip */ }
  }

  const topFiles = Array.from(filesSet.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([f]) => f);

  const models = Array.from(modelMap.entries())
    .map(([name, data]) => ({ name, count: data.count, tokens: data.tokens }))
    .sort((a, b) => b.tokens - a.tokens);

  return {
    displayName,
    totalSessions: sessions.length,
    totalTokens: totalInput + totalOutput,
    totalInput,
    totalOutput,
    totalMessages,
    models,
    topFiles,
    dailyTokens: Array.from(dailyTokens.entries())
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    sessions: sessions.map(s => ({
      id: s.id,
      model: s.model,
      startTime: s.startTime,
      messageCount: s.messageCount,
      totalTokens: s.totalTokens,
    })),
  };
}

router.get('/:projectPath', (req, res) => {
  try {
    const { projectPath } = req.params;
    const data = cached(`project-detail-${projectPath}`, 30_000, () => buildProjectDetail(projectPath));
    if (!data) return res.status(404).json({ error: 'Project not found' });
    res.json(data);
  } catch (error) {
    console.error('Error reading project detail:', error);
    res.status(500).json({ error: 'Failed to read project' });
  }
});

export default router;
