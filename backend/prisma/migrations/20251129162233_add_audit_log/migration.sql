-- DropIndex
DROP INDEX `users_email_nim_idx` ON `users`;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entityType` ENUM('USER', 'REPORT') NOT NULL,
    `action` ENUM('SOFT_DELETE', 'RESTORE', 'HARD_DELETE', 'UPDATE_STATUS', 'VERIFY_MAHASISWA') NOT NULL,
    `entityId` INTEGER NOT NULL,
    `actorId` INTEGER NOT NULL,
    `actorRole` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `reports_status_idx` ON `reports`(`status`);

-- CreateIndex
CREATE INDEX `reports_status_categoryId_idx` ON `reports`(`status`, `categoryId`);
