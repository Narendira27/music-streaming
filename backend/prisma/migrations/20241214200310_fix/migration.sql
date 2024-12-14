-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_YtUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL
);
INSERT INTO "new_YtUrl" ("id", "url") SELECT "id", "url" FROM "YtUrl";
DROP TABLE "YtUrl";
ALTER TABLE "new_YtUrl" RENAME TO "YtUrl";
CREATE UNIQUE INDEX "YtUrl_id_key" ON "YtUrl"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
