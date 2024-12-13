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
    "songType" TEXT NOT NULL DEFAULT 'youtube',
    "userId" TEXT NOT NULL,
    CONSTRAINT "Song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Song" ("duration", "fileName", "filePath", "id", "title", "userId", "youtubeUrl") SELECT "duration", "fileName", "filePath", "id", "title", "userId", "youtubeUrl" FROM "Song";
DROP TABLE "Song";
ALTER TABLE "new_Song" RENAME TO "Song";
CREATE UNIQUE INDEX "Song_id_key" ON "Song"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
