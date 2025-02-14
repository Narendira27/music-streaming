import path from "path";
import GenerateZipFileName from "../utils/generateZipFileName";
import createZipFile from "../utils/createZipFile";
import uploadFileToS3 from "../utils/uploadZipToS3";
import fs from "fx";

const DbBackupLogic = (): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const cronDb = path.join(__dirname, "../../cron/db");
      const mainDb = path.join(__dirname, "../../db");
      const folderPath = [cronDb, mainDb];
      const fileName = GenerateZipFileName();
      const zipOutputPath = path.join(__dirname, `../../temp/${fileName}.zip`);
      await createZipFile(folderPath, zipOutputPath);
      await uploadFileToS3(zipOutputPath, fileName);
      fs.unlink(zipOutputPath, (err: any) => {
        if (err) {
          console.error("Error deleting file:", err);
        } else {
          console.log("File deleted successfully");
        }
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};

export default DbBackupLogic;
