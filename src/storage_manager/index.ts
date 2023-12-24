/**
 * Interface for managing storage operations.
 *
 * This interface abstracts the basic functionalities for storage operations
 * including writing, reading, deleting, and existence checks of data in a storage medium.
 */
export interface IStorageManager {
  /**
   * Writes data to a specified storage path.
   *
   * @param data - The data to write.
   * @param path - The target path for storing the data.
   * @returns A promise that resolves once the write operation is complete.
   */
  write(data: string, path: string): Promise<void>;

  /**
   * Reads data from a specified storage path.
   *
   * @param path - The path from which to read the data.
   * @param __default - The default value to return if the data is not found.
   * @returns A promise resolving to the read data or the provided default value.
   */
  read(path: string, __default: string): Promise<string>;

  /**
   * Deletes data from a specified storage path.
   *
   * @param path - The path from which to delete the data.
   * @returns A promise that resolves once the delete operation is complete.
   */
  delete(path: string): Promise<void>;

  /**
   * Checks the existence of data at a specified storage path.
   *
   * @param path - The path to check for data existence.
   * @returns A promise resolving to a boolean indicating if the data exists.
   */
  exists(path: string): Promise<boolean>;
}

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
