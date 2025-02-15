import express from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";

import searchSongs from "../../utils/getSearchResults";
import AddSongLogic from "../../route-logic/addSongLogic";
import validateSchema from "../../utils/validateSchema";
import { UpdateSongAudioSchema } from "../../schemas/updateSongAudioSchema";
import { getAudioDuration, ytDownloadURL } from "../../utils/downloadAudioV1";
import { generateFileName } from "../../utils/commonUtils";
import { AddYtSongSchema } from "../../schemas/addYtSongSchema";

const prisma = new PrismaClient();

const userRoutes = express.Router();
interface CustomRequest extends Request {
  id?: string;
  fileName?: string;
}

const downloadDir = path.resolve(__dirname, "../../../downloads");

userRoutes.get("/me", (req, res) => {
  res.json({ msg: "ok" });
});

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
        songType: true,
      },
    });
    res.json({ data: [...result] });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

userRoutes.post("/song", async (req: CustomRequest, res: Response) => {
  const { type } = req.query;

  // check query params
  if (type === undefined || type === null) {
    res.status(400).json({ msg: "type required" });
    return;
  }

  const userType = String(type);

  // check req.id
  if (req.id === undefined || !req.id) {
    res.status(400).json({ msg: "authorization failed" });
    return;
  }

  try {
    const { duration, filePath, fileName, title, url } = await AddSongLogic(
      req.body,
      userType
    );

    await prisma.song.create({
      data: {
        title: title,
        youtubeUrl: url,
        duration: duration.toString(),
        filePath: filePath,
        fileName: fileName,
        songType: userType,
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

  // check query params
  if (!id || id === undefined) {
    res.status(400).json({ msg: "required query parameter not found" });
    return;
  }
  // check req.id
  if (req.id === undefined || !req.id) {
    res.status(400).json({ msg: "authorization failed" });
    return;
  }

  const UpdateId = String(id);

  const validateResult = validateSchema(UpdateSongAudioSchema, req.body);

  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }

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
});

userRoutes.delete("/song", async (req: CustomRequest, res: Response) => {
  const { id } = req.query;
  if (!id || id === undefined) {
    res.status(400).json({ msg: "id is required" });
    return;
  }
  const DeleteId = String(id);
  try {
    await prisma.song.delete({
      where: { userId: req.id, id: DeleteId },
    });
    res.json({ msg: "deleted successfully" });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

userRoutes.get("/search-song", async (req: CustomRequest, res: Response) => {
  const { name } = req.query;
  if (!name || name === undefined) {
    res.status(400).json({ msg: "id is required" });
    return;
  }
  const value = String(name);

  try {
    if (value.length <= 2) {
      throw new Error("The search query must be longer than 2 characters.");
    }
    const songListResponse = await searchSongs(value);

    res.json(songListResponse);
  } catch (e) {
    res.status(400).json({ msg: e });
    console.log(e);
  }
});

userRoutes.get(
  "/yt-download-link",
  async (req: CustomRequest, res: Response) => {
    const YtURL = req.query.url as string;

    if (!YtURL?.trim()) {
      res.status(400).json({ msg: "url is required" });
      return;
    }

    const checkFileName = generateFileName(YtURL);
    const checkPath = path.join(downloadDir, checkFileName);

    if (fs.existsSync(checkPath) === true) {
      try {
        const duration = await getAudioDuration(checkPath);
        res.json({
          fileAvailable: true,
          fileName: checkFileName,
          filePath: checkPath,
          duration,
        });
        return;
      } catch (e) {
        res.status(400).json({ success: false, msg: "something went wrong" });
        return;
      }
    }

    try {
      new URL(YtURL);
    } catch (error) {
      res.status(400).json({ msg: "Invalid URL format" });
      return;
    }

    const getDownloadableLink = await ytDownloadURL(YtURL);
    if (getDownloadableLink.success === true) {
      res.json({ fileAvailable: false, url: getDownloadableLink.link });
      return;
    }
    res.status(400).json({ msg: "cannot fetch yt download link" });
  }
);

const storage = multer.diskStorage({
  destination: (req: CustomRequest, file: unknown, cb: any) => {
    cb(null, downloadDir);
  },
  filename: (req: CustomRequest, file: unknown, cb: any) => {
    const urlParam = req.query.url as string;
    if (!urlParam) {
      throw new Error("url not found");
    }
    const newFileName = generateFileName(urlParam);
    req.fileName = newFileName;
    cb(null, newFileName);
  },
});

const upload = multer({ storage });

userRoutes.post(
  "/upload-yt-audio",
  upload.single("file"),
  async (req: CustomRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    try {
      let filePath = "";
      if (req.fileName) {
        filePath = path.join(downloadDir, req.fileName);
      }
      const duration = await getAudioDuration(filePath);
      res.json({
        msg: "File uploaded successfully",
        fileName: req.fileName,
        duration,
        filePath,
      });
    } catch (e) {
      res.status(400).json({ success: false, msg: "something went wrong" });
    }
  }
);

userRoutes.post("/yt-song-add", async (req: CustomRequest, res: Response) => {
  const validateResult = validateSchema(AddYtSongSchema, req.body);

  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }

  if (req.id === undefined) {
    res.status(400).json({ msg: "something went wrong" });
    return;
  }

  try {
    const { title, duration, filePath, fileName, url } = req.body;

    await prisma.song.create({
      data: {
        title,
        youtubeUrl: url,
        duration,
        filePath,
        fileName,
        songType: "youtube",
        userId: req.id,
      },
    });
    res.json({ msg: "Song added Successfully" });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

export default userRoutes;
