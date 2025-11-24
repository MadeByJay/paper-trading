import 'dotenv/config';
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

export const prismaClient = new PrismaClient({
  adapter: prismaAdapter,
});
