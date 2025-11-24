import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const databaseConnectionString = process.env.DATABASE_URL;

if (!databaseConnectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const databaseConnectionPool = new pg.Pool({
  connectionString: databaseConnectionString,
});

const prismaAdapter = new PrismaPg(databaseConnectionPool);

const prismaClient = new PrismaClient({
  adapter: prismaAdapter,
});

const expressApplication = express();
const serverPort = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;

// Middleware
expressApplication.use(cors());
expressApplication.use(express.json());

// Simple request logging middleware (basic for now)
expressApplication.use((request: Request, response: Response, next: NextFunction) => {
  // In a real app you would use a proper logger here
  // For now this shows basic observability during development.
  // eslint-disable-next-line no-console
  console.log(`${request.method} ${request.path}`);
  next();
});

// Health check route
expressApplication.get('/health', async (request: Request, response: Response) => {
  try {
    await prismaClient.$queryRawUnsafe('SELECT 1');
    response.json({ status: 'ok', database: 'up' });
  } catch (error) {
    response.status(500).json({ status: 'error', database: 'down' });
  }
});

// Placeholder route to prove everything is wired
expressApplication.get('/api/hello', (request: Request, response: Response) => {
  response.json({ message: 'Trading Platform API is running' });
});

// Start server
expressApplication.listen(serverPort, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on port ${serverPort}`);
});
