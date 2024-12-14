-- CreateTable
CREATE TABLE "YtUrl" (
    "id" TEXT NOT NULL DEFAULT '1',
    "url" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "YtUrl_id_key" ON "YtUrl"("id");
