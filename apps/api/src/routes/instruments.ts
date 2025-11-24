import { Router, Request, Response } from 'express';
import { prismaClient } from '../prismaClient';

export const instrumentsRouter = Router();

const defaultLimit = 50;
const maximumLimit = 200;

instrumentsRouter.get('/', async (request: Request, response: Response) => {
  try {
    const searchTermRaw = request.query.search;
    const limitRaw = request.query.limit;

    const searchTerm =
      typeof searchTermRaw === 'string' && searchTermRaw.trim().length > 0
        ? searchTermRaw.trim()
        : undefined;

    let limit = defaultLimit;

    if (typeof limitRaw === 'string') {
      const parsedLimit = Number(limitRaw);

      if (!Number.isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= maximumLimit) {
        limit = parsedLimit;
      }
    }

    const instruments = await prismaClient.instrument.findMany({
      where:
        searchTerm !== undefined
          ? {
              OR: [
                { symbol: { contains: searchTerm, mode: 'insensitive' } },
                { name: { contains: searchTerm, mode: 'insensitive' } },
              ],
            }
          : undefined,

      orderBy: {
        symbol: 'asc',
      },
      take: limit,
    });

    response.json({ instruments });
  } catch (error) {
    console.error('Error in GET /api/instruments', error);
    response.status(500).json({ message: 'Failed to fetch instruments' });
  }
});
