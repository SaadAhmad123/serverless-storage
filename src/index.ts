import { IStorageManager, ILockingManager } from './storage_manager';
import LockableStorageManager, {
  ILockableStorageManager,
  LockableStorageMangerInput,
} from './storage_manager/lockable_storage_manager';
import DynamoLockingManager from './storage_manager/dynamo_locking_manager';
import S3StorageManager from './storage_manager/s3_storage_manager';
import LocalFileStorageManager from './storage_manager/local_file_storage_manager';
import { AcquireLockError, waitForTime, acquireLock } from './utils';

const utils = {
  AcquireLockError,
  waitForTime,
  acquireLock,
};

export {
  IStorageManager,
  ILockableStorageManager,
  ILockingManager,
  LockableStorageManager,
  DynamoLockingManager,
  S3StorageManager,
  LocalFileStorageManager,
  LockableStorageMangerInput,
  utils,
};
