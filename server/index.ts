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
