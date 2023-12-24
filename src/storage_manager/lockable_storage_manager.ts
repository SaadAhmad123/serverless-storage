import { IStorageManager, ILockingManager } from '.';

/**
 * Interface extending both IStorageManager and ILockingManager.
 *
 * Represents a storage manager capable of lockable operations,
 * combining the functionalities of both storage and locking management.
 */
export interface ILockableStorageManager
  extends IStorageManager,
    ILockingManager {}

/**
 * Type defining the structure for input parameters of LockableStorageManager.
 *
 * @property storageManager - Optional IStorageManager instance for storage operations.
 * @property lockingManager - Optional ILockingManager instance for lock management.
 */
export type LockableStorageMangerInput = {
  storageManager?: IStorageManager;
  lockingManager?: ILockingManager;
};

/**
 * Implementation of a storage manager with integrated locking capabilities.
 *
 * This class extends the basic storage operations (read, write, delete, exists) with
 * the ability to lock and unlock paths for secure and controlled access. It requires
 * concrete implementations of IStorageManager and ILockingManager to function.
 */
export default class LockableStorageManager implements ILockableStorageManager {
  constructor(private params: LockableStorageMangerInput) {}

  /**
   * Reads data from a specified path. Throws an error if storageManager is not defined.
   *
   * @param path - The path from which data is to be read.
   * @param __default - The default value to return if data is not found.
   * @returns A promise resolving to the data read from the path or the default value.
   */
  async read(path: string, __default: string): Promise<string> {
    if (!this.params.storageManager) {
      throw new Error(
        `[LockableStorageManager][read] Trying to use storage manager which does not exist.`,
      );
    }
    return await this.params.storageManager.read(path, __default);
  }

  /**
   * Writes data to a specified path. Throws an error if storageManager is not defined.
   *
   * @param data - The data to write.
   * @param path - The target path for storing the data.
   * @returns A promise that resolves once the write operation is complete.
   */
  async write(data: string, path: string): Promise<void> {
    if (!this.params.storageManager) {
      throw new Error(
        `[LockableStorageManager][write] Trying to use storage manager which does not exist.`,
      );
    }
    return await this.params.storageManager.write(data, path);
  }

  /**
   * Deletes data from a specified path. Throws an error if storageManager is not defined.
   *
   * @param path - The path from which to delete data.
   * @returns A promise that resolves once the delete operation is complete.
   */
  async delete(path: string): Promise<void> {
    if (!this.params.storageManager) {
      throw new Error(
        `[LockableStorageManager][delete] Trying to use storage manager which does not exist.`,
      );
    }
    return await this.params.storageManager.delete(path);
  }

  /**
   * Checks for the existence of data at a specified path. Throws an error if storageManager is not defined.
   *
   * @param path - The path to check for data existence.
   * @returns A promise resolving to a boolean indicating if the data exists.
   */
  async exists(path: string): Promise<boolean> {
    if (!this.params.storageManager) {
      throw new Error(
        `[LockableStorageManager][exists] Trying to use storage manager which does not exist.`,
      );
    }
    return await this.params.storageManager.exists(path);
  }

  /**
   * Attempts to acquire a lock on a specified path. Throws an error if lockingManager is not defined.
   *
   * @param path - The path to acquire a lock on.
   * @returns A promise resolving to true if the lock is acquired, false otherwise.
   */
  async lock(path: string): Promise<Boolean> {
    if (!this.params.lockingManager) {
      throw new Error(
        `[LockableStorageManager][lock] Trying to use locking manager which does not exist.`,
      );
    }
    return await this.params.lockingManager.lock(path);
  }

  /**
   * Releases a lock on a specified path. Throws an error if lockingManager is not defined.
   *
   * @param path - The path to release the lock from.
   * @returns A promise resolving once the lock is released.
   */
  async unlock(path: string): Promise<Boolean> {
    if (!this.params.lockingManager) {
      throw new Error(
        `[LockableStorageManager][unlock] Trying to use locking manager which does not exist.`,
      );
    }
    return await this.params.lockingManager.unlock(path);
  }

  /**
   * Checks if a lock is currently held on a specified path. Throws an error if lockingManager is not defined.
   *
   * @param path - The path to check for a lock.
   * @returns A promise resolving to a boolean indicating if the path is locked.
   */
  async isLocked(path: string): Promise<Boolean> {
    if (!this.params.lockingManager) {
      throw new Error(
        `[LockableStorageManager][isLocked] Trying to use locking manager which does not exist.`,
      );
    }
    return await this.params.lockingManager.isLocked(path);
  }
}
