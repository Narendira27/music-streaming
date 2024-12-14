import express from "express";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

import downloadYoutubeAudio from "../../utils/downloadAudioV1";
import validateSchema from "../../utils/validateSchema";
import { updateYoutubeUrlSchema } from "../../schemas/updateYtUrlSchema";
import { serviceEmail } from "../../utils/emailUtils";

const prisma = new PrismaClient();

const adminRoutes = express.Router();

adminRoutes.get("/me", async (req, res) => {
  res.json({ msg: "ok" });
});

adminRoutes.post("/createYtURL", async (req, res) => {
  const validateResult = validateSchema(updateYoutubeUrlSchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }
  try {
    await prisma.ytUrl.create({
      data: { id: "1", url: req.body.url },
    });
    res.json({ msg: "url updated !!!" });
  } catch (e: any) {
    res.status(400).json({ msg: e.message });
  }
});

adminRoutes.post("/updateYTURL", async (req, res) => {
  const validateResult = validateSchema(updateYoutubeUrlSchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }
  try {
    await prisma.ytUrl.update({
      where: { id: "1" },
      data: { url: req.body.url },
    });
    res.json({ msg: "url updated !!!" });
  } catch (e: any) {
    res.status(400).json({ msg: e.message });
  }
});

adminRoutes.get("/checkDownloadStatus", async (req, res) => {
  const TEMP_DIR = path.resolve(__dirname, "../../../temp");
  const fileName = "test.mp3";
  const filePath = path.join(TEMP_DIR, fileName);
  const { success } = await downloadYoutubeAudio(
    "https://www.youtube.com/watch?v=2PuFyjAs7JA",
    filePath
  );
  if (!success) {
    serviceEmail(req.body.email);
    res.status(400).json({ msg: "issue" });
    return;
  }
  fs.unlinkSync(filePath);
  res.json({ msg: "working fine !" });
});

export default adminRoutes;
