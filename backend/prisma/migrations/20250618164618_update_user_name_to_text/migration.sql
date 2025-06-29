/*
  Warnings:

  - You are about to drop the column `lastLoggedIn` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `loggedIn` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `lastLoggedIn`,
    DROP COLUMN `loggedIn`,
    MODIFY `name` TEXT NOT NULL;
