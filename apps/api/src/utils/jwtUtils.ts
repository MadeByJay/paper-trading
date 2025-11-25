import jwt, { SignOptions } from 'jsonwebtoken';

type AuthTokenPayload = {
  userId: string;
};

const defaultTokenExpiry = '7d';

const jwtSecret = process.env.JWT_SECRET || '';

if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is not set');
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const signOptions: SignOptions = {
    expiresIn: defaultTokenExpiry,
  };

  return jwt.sign(payload, jwtSecret, signOptions);
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decodedToken = jwt.verify(token, jwtSecret);

  if (
    typeof decodedToken !== 'object' ||
    decodedToken === null ||
    !('userId' in decodedToken)
  ) {
    throw new Error('Invalid token payload');
  }

  return decodedToken as AuthTokenPayload;
}
