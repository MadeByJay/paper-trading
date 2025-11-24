import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

type EnvironmentVariables = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // This is where Prisma 7 reads the URL from now
    url: env<EnvironmentVariables>('DATABASE_URL'),
  },
});
