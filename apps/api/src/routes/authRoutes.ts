import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { prismaClient } from '../prismaClient';
import { hashPassword, verifyPassword } from '../utils/passwordUtils';
import { signAuthToken } from '../utils/jwtUtils';
import { authenticateRequest } from '../middleware/middleware';

export const authRouter = Router();

const registrationInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1),
});

const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const defaultStartingBalance = 100_000;

// POST /api/auth/register
authRouter.post('/register', async (request: Request, response: Response) => {
  try {
    const parsedBody = registrationInputSchema.parse(request.body);
    const { email, password, displayName } = parsedBody;

    const existingUser = await prismaClient.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      response
        .status(409)
        .json({ message: 'A user with this email already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const createdUserWithAccount = await prismaClient.$transaction(
      async (transactionClient) => {
        const createdUser = await transactionClient.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            displayName,
          },
        });
        const createdAccount = await transactionClient.account.create({
          data: {
            userId: createdUser.id,
            name: 'Paper Trading Account',
            baseCurrency: 'USD',
            startingBalance: defaultStartingBalance,
            cashBalance: defaultStartingBalance,
          },
        });

        return {
          user: createdUser,
          defaultAccountId: createdAccount.id,
        };
      },
    );

    const authToken = signAuthToken({ userId: createdUserWithAccount.user.id });

    response.status(201).json({
      token: authToken,
      user: {
        id: createdUserWithAccount.user.id,
        email: createdUserWithAccount.user.email,
        displayName: createdUserWithAccount.user.displayName,
        role: createdUserWithAccount.user.role,
      },
      defaultAccountId: createdUserWithAccount.defaultAccountId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response
        .status(400)
        .json({ message: 'Invalid request body', error: error.errors });
      return;
    }
    console.error('POST Error /api/auth/register', error);
    response.status(500).json({ message: 'Failed to register user' });
  }
});

//POST /api/auth/login
authRouter.post('/login', async (request: Request, response: Response) => {
  try {
    const parsedBody = loginInputSchema.parse(request.body);
    const { email, password } = parsedBody;

    const user = await prismaClient.user.findUnique({
      where: { email },
      include: {
        accounts: {
          take: 1,
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!user) {
      response.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      response.status(401).json({ message: 'Invalid email or password' });
    }

    const authToken = signAuthToken({ userId: user.id });
    const defaultAccount = user.accounts[0];

    response.json({
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      defaultAccountId: defaultAccount?.id ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response
        .status(400)
        .json({ message: 'Invalid request body', error: error.errors });
      return;
    }

    console.error('POST error /api/auth/login', error);
    response.status(500).json({ message: 'Failed to log in' });
  }
});

authRouter.get(
  '/me',
  authenticateRequest,
  async (request: Request, response: Response) => {
    try {
      const authenticatedUserId = request.authenticatedUserId;

      if (!authenticatedUserId) {
        response.status(401).json({ message: 'Not authenticated' });
      }

      const user = await prismaClient.user.findUnique({
        where: { id: authenticatedUserId },
        include: {
          accounts: {
            take: 1,
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });

      if (!user) {
        response.status(401).json({ message: 'User not found' });
        return;
      }

      const mainAccount = user.accounts[0];

      response.json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        defaultAccountId: mainAccount?.id ?? null,
      });
    } catch (error) {
      console.log(error);
    }
  },
);
