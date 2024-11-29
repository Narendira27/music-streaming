/*
  Warnings:

  - Added the required column `fileName` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Song" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Song" ("duration", "filePath", "id", "title", "userId", "youtubeUrl") SELECT "duration", "filePath", "id", "title", "userId", "youtubeUrl" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE UNIQUE INDEX "Song_id_key" ON "Song"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
