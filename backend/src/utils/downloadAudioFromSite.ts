import axios from "axios";
import fs from "fs";

const downloadFileFromSite = async (
  url: string,
  outputPath: string,
  filename: string
): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
        responseType: "arraybuffer",
      });

      fs.writeFileSync(outputPath, response.data);
      console.log(filename);

      console.log(`File downloaded successfully to: ${outputPath}`);
      resolve();
    } catch (error: any) {
      console.log(error);
      reject(new Error(`Error downloading the file`));
    }
  });
};

export default downloadFileFromSite;
