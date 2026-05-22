import express from 'express';
import cors from 'cors';
import path from 'path';
import { getClaudeProjectsDir } from './services/claude-reader';
import projectsRouter from './routes/projects';
import sessionsRouter from './routes/sessions';
import statsRouter from './routes/stats';
import recentRouter from './routes/recent';
import searchRouter from './routes/search';
import projectDetailRouter from './routes/project-detail';

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 配置 API
  app.get('/api/config', (_req, res) => {
    res.json({
      projectsDir: getClaudeProjectsDir(),
      platform: process.platform,
    });
  });

  app.use('/api/projects', projectsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/stats', statsRouter);
  app.use('/api/recent', recentRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/project-detail', projectDetailRouter);

  // 生产环境：托管前端静态文件
  // bundle 在 dist/bin/ → 静态文件在 dist/client/
  const staticDir = path.join(__dirname, '../client');
  app.use(express.static(staticDir, { index: false }));

  // SPA fallback：所有非 /api 路由返回 index.html
  app.get('{*path}', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  return app;
}

export function startServer(port?: number) {
  const PORT = port || parseInt(process.env.PORT || '5174', 10);
  const app = createServer();

  app.listen(PORT, () => {
    console.log(`\n  Claude Dashboard`);
    console.log(`  数据目录: ${getClaudeProjectsDir()}`);
    console.log(`  访问地址: http://localhost:${PORT}\n`);
    console.log(`  提示: 设置 CLAUDE_DATA_DIR 环境变量可自定义数据路径`);
    console.log(`  示例: CLAUDE_DATA_DIR=/path/to/.claude claude-dashboard\n`);
  });
}
