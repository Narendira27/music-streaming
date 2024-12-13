import path from "path";
import fs from "fs";

import validateSchema from "../utils/validateSchema";
import { AddSongYtBodySchema } from "../schemas/addSongYTSchema";
import { generateFileName } from "../utils/commonUtils";
import downloadYoutubeAudio, {
  getAudioDuration,
} from "../utils/downloadAudioV1";
import getSongDetails from "../utils/getSongDetails";
import { AddSongAudioSchema } from "../schemas/addSongAudioSchema";
import downloadFileFromSite from "../utils/downloadAudioFromSite";

interface responseType {
  duration: number;
  fileName: string;
  filePath: string;
  url: string;
  title: string;
}

const AddSongLogic = (body: any, type: string): Promise<responseType> => {
  return new Promise(async (resolve, reject) => {
    const DOWNLOAD_DIR = path.resolve(__dirname, "../../downloads");

    let fileName = "";

    let filePath = "";

    if (
      type === undefined ||
      type === null ||
      (type !== "youtube" && type !== "audio")
    ) {
      reject("invalid type");
    }

    if (type === "youtube") {
      const validateResult = validateSchema(AddSongYtBodySchema, body);

      if (validateResult !== "ok") {
        reject(validateResult);
        return;
      }

      fileName = generateFileName(body.youtubeUrl);
      filePath = path.join(DOWNLOAD_DIR, fileName);
    }

    if (type === "audio") {
      const validateResult = validateSchema(AddSongAudioSchema, body);

      if (validateResult !== "ok") {
        reject(validateResult);
        return;
      }

      fileName = generateFileName(String(body.id));
      filePath = path.join(DOWNLOAD_DIR, fileName);
    }

    const getTitle = type === "youtube" ? body.title : body.title;
    const getURLValue =
      type === "youtube"
        ? body.youtubeUrl
        : "https://masstamilan.one" + body.url;

    if (fs.existsSync(filePath)) {
      try {
        const duration = await getAudioDuration(filePath);
        resolve({
          duration,
          filePath,
          fileName,
          title: getTitle,
          url: getURLValue,
        });
      } catch (err) {
        reject("Failed to get audio duration");
      }
    }

    if (fs.existsSync(filePath) === false && type === "youtube") {
      const downloadResult = await downloadYoutubeAudio(
        body.youtubeUrl,
        filePath
      );
      if (downloadResult.success === false) {
        reject(downloadResult.error);
      }

      if (downloadResult.duration === undefined) {
        reject("cannot determine the duration of the song");
      }
      resolve({
        duration: downloadResult.duration || 0,
        fileName,
        filePath,
        title: body.title,
        url: body.youtubeUrl,
      });
    }

    if (fs.existsSync(filePath) === false && type === "audio") {
      try {
        const details = await getSongDetails(body.id);
        const siteUrl = "https://masstamilan.one" + details.download_link;
        await downloadFileFromSite(siteUrl, filePath, fileName);
        resolve({
          duration: details.duration,
          filePath,
          fileName,
          title: body.title,
          url: siteUrl,
        });
      } catch (e: any) {
        reject(e.message);
      }
    }
  });
};

export default AddSongLogic;
