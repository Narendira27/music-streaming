import axios from "axios";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";

function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath).ffprobe((err, metadata) => {
      if (err) {
        reject(`Error fetching audio metadata: ${err.message}`);
      } else {
        const duration = metadata.format.duration;
        if (!duration) return reject("Error");
        resolve(duration);
      }
    });
  });
}

function extractYouTubeID(url: string) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "UnSupported YT URL";
}

const getDownloadURL = async (ytid: string) => {
  const data = new FormData();
  data.append("videoid", ytid);
  data.append("downtype", "mp3");
  data.append("vquality", "320");

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://hbhbj.store/oajax.php", // Updated URL   /  hbhbj.store
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://hbhbj.store", // Updated Origin
      pragma: "no-cache",
      priority: "u=1, i",
      referer: `https://hbhbj.store/?videoId=${ytid}`, // Updated Referer
      "sec-ch-ua": '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Linux"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    },
    data: data, // FormData is directly passed as data
  };

  try {
    const response = await axios.request(config);
    return response.data.url;
  } catch (error) {
    console.error(error);
    return "Error : File Not Found";
  }
};

function downloadAudioFile(url: string, filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: url, // Provided URL
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=0, i",
        referer: "https://hbhbj.store/", // Provided referer
        "sec-ch-ua":
          '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "iframe",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "cross-site",
        "sec-gpc": "1",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
      timeout: 10000, // Timeout in milliseconds
      responseType: "stream", // Required for downloading large files
    };

    axios
      // @ts-ignore
      .request(config)
      .then((response) => {
        const fileStream = fs.createWriteStream(filePath);

        response.data.pipe(fileStream);

        fileStream.on("finish", () => {
          resolve(`Audio file downloaded successfully to ${filePath}`);
        });

        fileStream.on("error", (err) => {
          reject(`Error writing to file: ${err.message}`);
        });
      })
      .catch((error) => {
        reject(`Error downloading the file: ${error.message}`);
      });
  });
}

const downloadYoutubeAudio = async (link: string, filepath: string) => {
  try {
    const ytId = extractYouTubeID(link);
    if (ytId === "UnSupported YT URL") {
      throw new Error("UnSupported YT URL");
    }
    let downloadUrl = await getDownloadURL(ytId);
    if (downloadUrl === undefined) {
      let RETRY_COUNT = 0;
      const MAX_RETRY = 5;
      while (RETRY_COUNT < MAX_RETRY && downloadUrl === undefined) {
        RETRY_COUNT++;
        console.log(`Retrying... Attempt ${RETRY_COUNT}`);

        await new Promise((resolve) => setTimeout(resolve, 200));

        downloadUrl = await getDownloadURL(ytId);

        if (downloadUrl !== undefined) {
          console.log("Download URL retrieved successfully");
          break;
        }

        if (RETRY_COUNT === MAX_RETRY) {
          throw new Error(
            "Max retries reached. Could not retrieve the download URL."
          );
        }
      }
    }
    await downloadAudioFile(downloadUrl, filepath);
    const duration = await getAudioDuration(filepath);
    return {
      success: true,
      duration,
    };
  } catch (error: any) {
    if (error.message) {
      console.error("Error occurred:", error.message);
    }
    console.error(error);
    return {
      success: false,
      error: "Failed to download the audio",
    };
  }
};

export default downloadYoutubeAudio;

export { getAudioDuration };
