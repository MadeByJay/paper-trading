import { Request, Response, Router } from 'express';
import z from 'zod';
import { prismaClient } from '../prismaClient';

export const watchlistRouter = Router();

const createWatchListSchema = z.object({
  name: z.string().min(1),
});

const addInstrumentToWatchlistSchema = z.object({
  instrumentId: z.string().uuid(),
});

watchlistRouter.get('/', async (request: Request, response: Response) => {
  try {
    const authenticatedUserId = request.authenticatedUserId;

    if (!authenticatedUserId) {
      response.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const watchLists = await prismaClient.watchlist.findMany({
      where: { userId: authenticatedUserId },
      orderBy: { createdAt: 'asc' },
    });

    response.json({ watchLists });
  } catch (error) {
    console.error('Error in GET /api/watchlists', error);
    response.status(500).json({ message: 'Failed to fetch watchlists' });
  }
});
watchlistRouter.post('/', async (request: Request, response: Response) => {
  try {
    const authenticatedUserId = request.authenticatedUserId;

    if (!authenticatedUserId) {
      response.status(401).json({ message: 'Not authenticated' });
    }

    const parsedBody = createWatchListSchema.parse(request.body);

    const createdWatchlist = await prismaClient.watchlist.create({
      data: {
        userId: authenticatedUserId,
        name: parsedBody.name,
      },
    });

    response.status(201).json({ watchlist: createdWatchlist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response
        .status(400)
        .json({ message: 'Invalid reqest body', errors: error.errors });
      return;
    }
    console.error('Error in POST /api/watchlists', error);
    response.status(500).json({ message: 'Failed to add watchlists' });
  }
});

watchlistRouter.get(
  '/:watchlistId',
  async (request: Request, response: Response) => {
    try {
      const authenticatedUserId = request.authenticatedUserId;

      if (!authenticatedUserId) {
        response.status(401).json({
          message: 'Not authenticated',
        });
        return;
      }

      const watchlistId = request.params.watchlistId;

      const watchlist = await prismaClient.watchlist.findFirst({
        where: {
          id: watchlistId,
          userId: authenticatedUserId,
        },
        include: {
          items: {
            orderBy: { positionInList: 'asc' },
            include: { instrument: true },
          },
        },
      });

      if (!watchlist) {
        response.status(404).json({ message: 'Watchlist not found' });
        return;
      }

      response.json({ watchlist });
    } catch (error) {
      console.error('Error in GET /api/watchlists/:watchlistId', error);
      response.status(500).json({ message: 'Failed to fetch watchlist' });
    }
  },
);

watchlistRouter.post('/:watchlistId/instruments', async (request, response) => {
  try {
    const authenticatedUserId = request.authenticatedUserId;
    if (!authenticatedUserId) {
      response.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const watchlistId = request.params.watchlistId;

    const parsedBody = addInstrumentToWatchlistSchema.parse(request.body);
    const instrumentId = parsedBody.instrumentId;

    const watchList = await prismaClient.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId: authenticatedUserId,
      },
    });

    const instrument = await prismaClient.instrument.findUnique({
      where: { id: instrumentId },
    });

    if (!watchList || !instrument) {
      response
        .status(404)
        .json({ message: 'Watchlist or instrument not found' });
      return;
    }

    const lastItem = await prismaClient.watchlistInstrument.findFirst({
      where: {
        watchlistId,
      },
    });

    const nextPositionInList = lastItem ? lastItem.positionInList + 1 : 0;

    const createdItem = await prismaClient.watchlistInstrument.create({
      data: {
        watchlistId,
        instrumentId,
        positionInList: nextPositionInList,
      },
    });

    response.status(201).json({ item: createdItem });
  } catch (error) {}
});

watchlistRouter.delete(
  '/:watchlistId/instruments/:instrumentId',
  async (request, response) => {
    try {
      const authenticatedUserId = request.authenticatedUserId;
      if (!authenticatedUserId) {
        response.status(401).json({ message: 'Not authenticated' });
        return;
      }

      const watchlistId = request.params.watchlistId;
      const instrumentId = request.params.instrumentId;

      const watchlist = prismaClient.watchlist.findFirst({
        where: { id: watchlistId, userId: authenticatedUserId },
      });

      if (!watchlist) {
        response.status(404).json({ message: 'Watchlist not found' });
        return;
      }

      await prismaClient.watchlistInstrument.deleteMany({
        where: {
          watchlistId: watchlistId,
          instrumentId: instrumentId,
        },
      });
      response.status(204).send();
    } catch (error) {
      console.error(
        'Error in DELETE /api/watchlists/:watchlistId/instruments/:instrumentId',
        error,
      );
      response
        .status(500)
        .json({ message: 'Failed to remove instrument from watchlist' });
    }
  },
);
