/*
  Warnings:

  - You are about to drop the column `instrumentId` on the `Watchlist` table. All the data in the column will be lost.
  - You are about to drop the column `positionInList` on the `Watchlist` table. All the data in the column will be lost.
  - Added the required column `name` to the `Watchlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Watchlist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Watchlist" DROP COLUMN "instrumentId",
DROP COLUMN "positionInList",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
