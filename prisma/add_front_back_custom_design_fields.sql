-- Migration: Add Front and Back Custom Design Fields to usercustomdesign
-- Supports independent Front & Back logos, positions, print types, and elements JSON

ALTER TABLE `usercustomdesign`
  ADD COLUMN `productId` VARCHAR(191) NULL AFTER `userId`,
  ADD COLUMN `frontLogoUrl` TEXT NULL AFTER `logoName`,
  ADD COLUMN `backLogoUrl` TEXT NULL AFTER `frontLogoUrl`,
  ADD COLUMN `frontPositionPreset` VARCHAR(50) NULL AFTER `backPreviewUrl`,
  ADD COLUMN `backPositionPreset` VARCHAR(50) NULL AFTER `frontPositionPreset`,
  ADD COLUMN `printType` VARCHAR(50) NULL AFTER `backPositionPreset`,
  ADD COLUMN `frontElements` JSON NULL AFTER `printType`,
  ADD COLUMN `backElements` JSON NULL AFTER `frontElements`,
  ADD COLUMN `customizationData` JSON NULL AFTER `backElements`;

