-- TeesZone Order Workflow, Tracking, and Google Review Notification Migration
-- Adds paymentStatus, trackingId, courierName, statusUpdatedAt, reviewStatus, internalRating, reviewDismissedAt, socialDismissed

-- Add columns safely if not present
SET @dbname = DATABASE();

SET @tablename = 'userorder';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'paymentStatus'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `paymentStatus` VARCHAR(50) NOT NULL DEFAULT \'PAID\''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'trackingId'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `trackingId` VARCHAR(100) NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'courierName'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `courierName` VARCHAR(100) NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'statusUpdatedAt'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `statusUpdatedAt` DATETIME(3) NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'reviewStatus'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `reviewStatus` VARCHAR(50) NOT NULL DEFAULT \'Review Pending\''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'internalRating'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `internalRating` INT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'reviewDismissedAt'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `reviewDismissedAt` DATETIME(3) NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
      AND TABLE_NAME = @tablename
      AND COLUMN_NAME = 'socialDismissed'
  ) > 0,
  'SELECT 1',
  'ALTER TABLE `userorder` ADD COLUMN `socialDismissed` TINYINT(1) NOT NULL DEFAULT 0'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Normalize existing order statuses to standard order lifecycle
UPDATE `userorder` SET `status` = 'Order Placed' WHERE `status` = 'PAID';
UPDATE `userorder` SET `statusUpdatedAt` = `createdAt` WHERE `statusUpdatedAt` IS NULL;

-- Remove nithya admin account from database if present
DELETE FROM `User` WHERE `email` IN ('nithyasri@teeszone.in', 'nithyateeszone.in', 'nithya@teeszone.in');

