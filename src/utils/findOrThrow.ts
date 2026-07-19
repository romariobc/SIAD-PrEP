import { AppError } from '../middlewares/error.middleware';

export async function findOrThrow<T>(finder: () => Promise<T | null>, message: string): Promise<T> {
  const record = await finder();
  if (!record) throw new AppError(404, message);
  return record;
}
