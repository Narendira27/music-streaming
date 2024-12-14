import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const streamRoutes = express.Router();

streamRoutes.get("/song", (req: Request, res: Response): void => {
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ msg: "Id is required" });
    return;
  }

  const songId = String(id);
  const DOWNLOAD_DIR = path.resolve(__dirname, "../../../downloads");
  const filePath = path.join(DOWNLOAD_DIR, songId);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ msg: "File not found" });
    return;
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse the range header
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).send(`Requested range not satisfiable\n${start}-${end}`);
      return;
    }

    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    });

    fileStream.pipe(res);
  } else {
    // Stream the entire file
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
});

export default streamRoutes;
