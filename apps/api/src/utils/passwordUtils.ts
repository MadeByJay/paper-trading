import bcrypt from 'bcryptjs';

const defaultSaltRounds = 10;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(defaultSaltRounds);
  const hashPassword = await bcrypt.hash(plainTextPassword, salt);
  return hashPassword;
}

export async function verifyPassword(
  plainTextPassword: string,
  hashPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashPassword);
}
