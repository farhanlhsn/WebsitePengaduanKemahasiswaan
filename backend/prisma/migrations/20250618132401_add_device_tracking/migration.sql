/*
  Warnings:

  - A unique constraint covering the columns `[userId,deviceId]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deviceId` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deviceName` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userAgent` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `deviceId` VARCHAR(191) NOT NULL,
    ADD COLUMN `deviceName` VARCHAR(191) NOT NULL,
    ADD COLUMN `ipAddress` VARCHAR(191) NULL,
    ADD COLUMN `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `userAgent` TEXT NOT NULL;

-- CreateIndex
CREATE INDEX `refresh_tokens_userId_lastUsedAt_idx` ON `refresh_tokens`(`userId`, `lastUsedAt`);

-- CreateIndex
CREATE UNIQUE INDEX `refresh_tokens_userId_deviceId_key` ON `refresh_tokens`(`userId`, `deviceId`);
