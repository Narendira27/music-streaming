import express from "express";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

import searchSongs from "../../utils/getSearchResults";
import AddSongLogic from "../../route-logic/addSongLogic";
import validateSchema from "../../utils/validateSchema";
import { UpdateSongAudioSchema } from "../../schemas/updateSongAudioSchema";

const prisma = new PrismaClient();

const userRoutes = express.Router();

interface CustomRequest extends Request {
  id?: string;
}

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
      throw new Error("The search query must be longer than 4 characters.");
    }
    const songListResponse = await searchSongs(value);

    res.json(songListResponse);
  } catch (e) {
    res.status(400).json({ msg: e });
    console.log(e);
  }
});

export default userRoutes;
