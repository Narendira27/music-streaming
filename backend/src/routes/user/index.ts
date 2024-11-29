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

userRoutes.get("/song", async (req: CustomRequest, res: Response) => {
  try {
    const result = await prisma.song.findMany({
      where: { userId: req.id },
      select: {
        id: true,
        title: true,
        youtubeUrl: true,
        duration: true,
        filePath: false,
        userId: false,
        fileName: true,
      },
    });
    res.json({ data: [...result] });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
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
        fileName: fileName,
        userId: req.id,
      },
    });
    res.json({ msg: "Song added Successfully" });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

userRoutes.put("/song", async (req: CustomRequest, res: Response) => {
  const { id } = req.query;

  const validateResult = validateSchema(songBodySchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }

  if (!id || id === undefined) {
    res.status(400).json({ msg: "id is required" });
    return;
  }

  const UpdateId = String(id);

  let getSongDetails;

  try {
    getSongDetails = await prisma.song.findFirst({
      where: { id: UpdateId, userId: req.id },
    });
    if (!getSongDetails) {
      throw console.error("song not found");
    }
  } catch (e) {
    res.status(400).json({ msg: e });
    return;
  }

  const fileName = generateFileName(req.body.youtubeUrl);
  const DOWNLOAD_DIR = path.resolve(__dirname, "../../../downloads");
  const filePath = path.join(DOWNLOAD_DIR, fileName);

  if (getSongDetails.youtubeUrl === req.body.youtubeUrl) {
    try {
      await prisma.song.update({
        where: { userId: req.id, id: UpdateId },
        data: { title: req.body.title },
      });
      res.json({ msg: "updated successfully" });
      return;
    } catch (e) {
      res.json({ msg: e });
      return;
    }
  } else {
    fs.unlink(getSongDetails.filePath, (err) => {
      if (err) {
        res.status(400).json({ msg: "something went wrong" });
        return;
      }
    });
    const downloadResult = await downloadAudio(req.body.youtubeUrl, filePath);

    if (downloadResult.success === false) {
      res.status(400).json({ msg: downloadResult.error });
      return;
    }

    if (downloadResult.duration === undefined) {
      res
        .status(400)
        .json({ msg: "cannot determine the duration of the song" });
      return;
    }
    try {
      await prisma.song.update({
        where: { id: UpdateId, userId: req.id },
        data: {
          title: req.body.title,
          youtubeUrl: req.body.youtubeUrl,
          duration: downloadResult.duration.toString(),
          filePath: filePath,
          fileName: fileName,
          userId: req.id,
        },
      });
      res.json({ msg: "Song Updated Successfully" });
    } catch (e) {
      res.status(400).json({ msg: e });
    }
  }
});

userRoutes.delete("/song", async (req: CustomRequest, res: Response) => {
  const { id } = req.query;
  if (!id || id === undefined) {
    res.status(400).json({ msg: "id is required" });
    return;
  }
  const DeleteId = String(id);

  try {
    const getSongDetails = await prisma.song.findFirst({
      where: { id: DeleteId, userId: req.id },
    });
    if (!getSongDetails) {
      res.status(400).json({ msg: "song not found" });
      return;
    }
    fs.unlink(getSongDetails.filePath, (err) => {
      if (err) {
        res.status(400).json({ msg: "something went wrong" });
        return;
      }
    });
    await prisma.song.delete({
      where: { userId: req.id, id: DeleteId },
    });
    res.json({ msg: "deleted successfully" });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

export default userRoutes;
