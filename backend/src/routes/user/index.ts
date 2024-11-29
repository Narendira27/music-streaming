import express from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

import validateSchema from "../../utils/validateSchema";
import { songBodySchema } from "../../schemas/userSchema";
import generateFileName from "../../utils/fileName";
import downloadAudio from "../../utils/downloadAudio";

const prisma = new PrismaClient();

const userRoutes = express.Router();

interface CustomRequest extends Request {
  id?: string;
}

userRoutes.get("/song", (req: CustomRequest, res: Response) => {
  res.send("get songs");
});

userRoutes.post("/song", async (req: CustomRequest, res: Response) => {
  const validateResult = validateSchema(songBodySchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }

  if (req.id === undefined || !req.id) {
    res.status(400).json({ msg: "authorization failed" });
    return;
  }

  const fileName = generateFileName(req.body.youtubeUrl);
  const DOWNLOAD_DIR = path.resolve(__dirname, "../../../downloads");
  const filePath = path.join(DOWNLOAD_DIR, fileName);

  if (fs.existsSync(filePath)) {
    res.status(400).json({ msg: "Song already exits" });
    return;
  }

  const downloadResult = await downloadAudio(req.body.youtubeUrl, filePath);

  if (downloadResult.success === false) {
    res.status(400).json({ msg: downloadResult.error });
    return;
  }

  if (downloadResult.duration === undefined) {
    res.status(400).json({ msg: "cannot determine the duration of the song" });
    return;
  }

  try {
    await prisma.song.create({
      data: {
        title: req.body.title,
        youtubeUrl: req.body.youtubeUrl,
        duration: downloadResult.duration.toString(),
        filePath: filePath,
        userId: req.id,
      },
    });
    res.json({ msg: "Song added Successfully" });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

userRoutes.put("/song", (req: CustomRequest, res: Response) => {
  res.send("update song");
});

userRoutes.delete("/song", (req: CustomRequest, res: Response) => {
  res.send("delete song");
});

export default userRoutes;
