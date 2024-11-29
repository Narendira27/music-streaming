import express from "express";
import path from "path";
import audioStreaming from "../../utils/audioStreaming";

const streamRoutes = express.Router();

streamRoutes.get("/song", (req, res) => {
  const { id } = req.query;
  if (!id || id === undefined) {
    res.status(400).json({ msg: "Id is required" });
  }
  const songId = String(id);
  const DOWNLOAD_DIR = path.resolve(__dirname, "../../../downloads");
  const filePath = path.join(DOWNLOAD_DIR, songId);
  audioStreaming(filePath, res);
});

export default streamRoutes;
