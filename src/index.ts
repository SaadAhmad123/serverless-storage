import { IStorageManager } from './storage_manager';
import { ILockingManager } from "./locking_manager";
import LockableStorageManager, {
  ILockableStorageManager,
  LockableStorageMangerInput,
} from './storage_manager/lockable_storage_manager';
import DynamoLockingManager from './locking_manager/dynamo_locking_manager';
import S3StorageManager from './storage_manager/s3_storage_manager';
import LocalFileStorageManager from './storage_manager/local_file_storage_manager';
import { AcquireLockError, waitForTime, acquireLock } from './utils';
import DynamoStorageManager, {IDynamoStorageManager} from './storage_manager/dynamo_storage_manager';
import CosmosStorageManager, {ICosmosStorageManager} from './storage_manager/cosmos_storage_manager';

const utils = {
  AcquireLockError,
  waitForTime,
  acquireLock,
};

export {
  IStorageManager,
  ILockableStorageManager,
  ILockingManager,
  IDynamoStorageManager,
  DynamoStorageManager,
  ICosmosStorageManager,
  CosmosStorageManager,
  LockableStorageManager,
  DynamoLockingManager,
  S3StorageManager,
  LocalFileStorageManager,
  LockableStorageMangerInput,
  utils,
};
