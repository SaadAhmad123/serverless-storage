import { ILockingManager } from './storage_manager';

/**
 * Represents an error when acquiring a lock fails.
 */
export class AcquireLockError extends Error {
  /**
   * Creates an instance of LockingError.
   * @param message - The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'AcquireLockError';
  }
}

/**
 * Waits for a specified duration.
 *
 * @param ms - The amount of time to wait in milliseconds.
 * @returns A promise that resolves after the specified duration.
 */
export const waitForTime = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Tries to acquire a lock on a resource, with retries if necessary.
 *
 * @param pathToLock - The path of the resource to lock.
 * @param lockingManager - The locking manager to handle the lock operation.
 * @param maxRetry - The maximum number of retry attempts (defaults to 5).
 * @param retryWait - The duration to wait between retries in milliseconds (defaults to 400).
 * @throws {LockingError} If the lock could not be acquired after the maximum number of retries.
 */
export async function acquireLock(
  pathToLock: string,
  lockingManager: ILockingManager,
  maxRetry: number = 5,
  retryWait: number = 400,
): Promise<void> {
  for (let i = 0; i < maxRetry; i++) {
    const lockAcquired = await lockingManager.lock(pathToLock);
    if (lockAcquired) return;
    if (i < maxRetry) {
      await waitForTime(retryWait);
    }
  }
  throw new AcquireLockError(`Could not acquire lock on path ${pathToLock}.`);
}
/**
 * Get the current timestamp in seconds since the Unix epoch.
 * @returns {number} The current timestamp in seconds.
 */
export function getTimestamp(): number {
  const now = new Date();
  return Math.floor(now.getTime() / 1000);
}
