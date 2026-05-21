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
