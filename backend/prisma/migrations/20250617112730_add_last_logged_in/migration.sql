/*
  Warnings:

  - You are about to drop the column `isLogIn` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `isLogIn`,
    ADD COLUMN `lastLoggedIn` DATETIME(3) NULL,
    ADD COLUMN `loggedIn` BOOLEAN NOT NULL DEFAULT false;
