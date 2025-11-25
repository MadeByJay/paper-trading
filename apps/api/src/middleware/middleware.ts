import { NextFunction, Request, Response } from 'express';
import { verifyAuthToken } from '../utils/jwtUtils';

export function authenticateRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    response
      .status(401)
      .json({ message: 'Missing or invalid Authorization Header' });
    return;
  }

  const startIndex = 'Bearer '.length;
  const token = authorizationHeader.slice(startIndex).trim();

  try {
    const decodedPayload = verifyAuthToken(token);
    request.authenticatedUserId = decodedPayload.userId;
    next();
  } catch (error) {
    response.status(401).json({ message: 'Invalid or expired token' });
  }
}
