import fs from "fs";
import { Response } from "express";

function audioStreaming(filePath: string, res: Response) {
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Disposition", 'inline; filename="audio.mp3"');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  fileStream.on("error", (err: any) => {
    console.error("Error during streaming:", err);
    res.status(500).send({ error: "Error streaming the file" });
  });
}

export default audioStreaming;
