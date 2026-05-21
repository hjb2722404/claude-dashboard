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
