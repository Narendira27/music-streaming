/*
  Warnings:

  - A unique constraint covering the columns `[userId,fileName]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Song_userId_fileName_key" ON "Song"("userId", "fileName");
