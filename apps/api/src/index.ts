import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prismaClient } from './prismaClient';
import { instrumentsRouter } from './routes/instruments';

const app = express();
const serverPort = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;

// Middleware
app.use(cors());
app.use(express.json());

app.use((request: Request, response: Response, next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.log(`${request.method} ${request.path}`);
  next();
});
app.use('/api/instruments', instrumentsRouter);

app.get('/health', async (request: Request, response: Response) => {
  try {
    await prismaClient.$queryRaw`SELECT 1;`;
    response.json({ status: 'ok', database: 'up' });
  } catch (error) {
    response.status(500).json({ status: 'error', database: 'down' });
  }
});

app.listen(serverPort, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${serverPort}`);
});
