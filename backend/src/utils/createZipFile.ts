import fs from "fs";
import path from "path";
import archiver from "archiver";

const createZipFile = (
  folders: string[],
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on("close", () => {
      console.log(`Archive created with ${archive.pointer()} total bytes`);
      resolve(); // Resolve the promise when the archive is finalized
    });

    archive.on("error", (err: any) => {
      reject(err); // Reject the promise if an error occurs
    });

    archive.pipe(output);

    folders.forEach((folder) => {
      const folderName = path.basename(folder);
      archive.directory(folder, folderName);
    });

    archive.finalize().catch((err: any) => reject(err)); // Catch any errors during finalization
  });
};

export default createZipFile;
