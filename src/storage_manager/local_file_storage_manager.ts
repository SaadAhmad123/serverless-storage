import * as fs from 'fs';
import * as path from 'path';
import { IStorageManager } from './index';

/**
 * Implementation of IStorageManager using the Node.js file system.
 *
 * This class provides storage operations like writing, reading, deleting,
 * and checking data existence using the Node.js file system. Paths are
 * interpreted relative to a specified root directory.
 */
export default class LocalFileStorageManager implements IStorageManager {
  /**
   * Constructs a LocalFileStorageManager instance.
   *
   * @param rootDir - The root directory for managing files. All file operations will be relative to this directory.
   */
  constructor(private rootDir: string) {}

  /**
   * Writes data to a file at the specified relative path.
   *
   * Automatically creates the necessary directories if they do not exist.
   * Logs a message upon successful write operation.
   *
   * @param data - The data to be written to the file.
   * @param relativePath - The file path relative to the root directory where the data will be written.
   * @returns A promise resolved once the write operation is complete.
   */
  async write(data: string, relativePath: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath);
    // Ensure the directory exists
    const directory = path.dirname(fullPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(fullPath, data);
    console.log(`File ${fullPath} has been written successfully.`);
  }

  /**
   * Reads data from a file at the specified relative path.
   *
   * Returns a default value if the file is not found or an error occurs.
   * Logs an error message if an exception is caught during the read operation.
   *
   * @param relativePath - The file path relative to the root directory from which data will be read.
   * @param __default - The default value to return if the file is not found or an error occurs.
   * @returns A promise resolved to the data read from the file or the default value.
   */
  async read(relativePath: string, __default: string = ''): Promise<string> {
    const fullPath = path.join(this.rootDir, relativePath);
    try {
      return fs.readFileSync(fullPath, 'utf-8');
    } catch (err) {
      console.error(err);
      return __default;
    }
  }

  /**
   * Deletes a file at the specified relative path.
   *
   * Logs a message upon successful deletion or if the file does not exist.
   * Logs an error if any other exception occurs during deletion.
   *
   * @param relativePath - The file path relative to the root directory to be deleted.
   * @returns A promise resolved once the delete operation is complete.
   */
  async delete(relativePath: string): Promise<void> {
    const fullPath = path.join(this.rootDir, relativePath);
    try {
      fs.unlinkSync(fullPath);
      console.log(`File ${fullPath} has been deleted successfully.`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`File ${fullPath} not found.`);
      } else {
        console.error(err);
      }
    }
  }

  /**
   * Checks if a file exists at the specified relative path.
   *
   * @param relativePath - The file path relative to the root directory to check for existence.
   * @returns A promise resolved to true if the file exists, false otherwise.
   */
  async exists(relativePath: string): Promise<boolean> {
    return fs.existsSync(path.join(this.rootDir, relativePath));
  }
}
