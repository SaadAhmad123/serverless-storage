/**
 * Interface for managing access locks.
 *
 * This interface provides methods for acquiring and releasing locks, ensuring
 * controlled access to resources, usable independently of the storage manager.
 */

export interface ILockingManager {
  /**
   * Attempts to acquire a lock on the specified path.
   *
   * @param path - The path to acquire a lock on.
   * @returns A promise resolving to true if the lock is acquired, false otherwise.
   */
  lock(path: string): Promise<Boolean>;

  /**
   * Releases a lock on the specified path.
   *
   * @param path - The path to release the lock from.
   * @returns A promise resolving once the lock is released.
   */
  unlock(path: string): Promise<Boolean>;

  /**
   * Checks if a lock is currently held on the specified path.
   *
   * @param path - The path to check for a lock.
   * @returns A promise resolving to a boolean indicating if the path is locked.
   */
  isLocked(path: string): Promise<Boolean>;
}
