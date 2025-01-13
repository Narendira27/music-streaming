import axios from "axios";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import FormData from "form-data";
import { PrismaClient } from "@prisma/client";
import qs from "qs"

const prisma = new PrismaClient();

const getDbURL = async ()=> {
  try {
    const res = await prisma.ytUrl.findFirst({ where: { id: "1" } });
    if (res === undefined || res === null) {
      throw new Error("Error");
    }
    return res.url;
  } catch {
    throw new Error("Cannot get url");
  }
};

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

const getKey =  async () => {
  
  let config = {
    method: 'get',
    maxBodyLength: Infinity, 
    url: 'https://api.mp3youtube.cc/v2/sanity/key',
    headers: { 
      'accept': '*/*', 
      'accept-language': 'en-US,en;q=0.9', 
      'content-type': 'application/json', 
      'if-none-match': 'W/"7e-KvPCs739rtXJfVSWGh9Q6jNmq7E-gzip"', 
      'origin': 'https://iframe.y2meta-uk.com', 
      'priority': 'u=1, i', 
      'referer': 'https://iframe.y2meta-uk.com/', 
      'sec-ch-ua': '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"Linux"', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'cross-site', 
      'sec-gpc': '1', 
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    }
  };
  try{
    const response = await axios.request(config)
    const parsedValue = JSON.parse(JSON.stringify(response.data)) 
    return parsedValue.key
  }
  catch(e){
    throw new Error ("Error while Fetching Key")
  }

}

const getDownloadURL = async (dbYtURL: string, link: string,key:string) => {
  let data = qs.stringify({
    'link': link,
    'format': 'mp3',
    'audioBitrate': '320',
    'videoQuality': '720',
    'vCodec': 'h264' 
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: dbYtURL,
    headers: { 
      'accept': '*/*', 
      'accept-language': 'en-US,en;q=0.9', 
      'content-type': 'application/x-www-form-urlencoded', 
      'key': key, 
      'origin': 'https://iframe.y2meta-uk.com', 
      'priority': 'u=1, i', 
      'referer': 'https://iframe.y2meta-uk.com/', 
      'sec-ch-ua': '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"', 
      'sec-ch-ua-mobile': '?0', 
      'sec-ch-ua-platform': '"Linux"', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'cross-site', 
      'sec-gpc': '1', 
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    },
    data : data
  };

  try {
    const response = await axios.request(config);
    return response.data.url;
  } catch (error) {
    console.error(error);
    return "Error : File Not Found";
  }
};

function downloadAudioFile(
  url: string,
  filePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: url, 
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        priority: "u=0, i",
        referer: `https://iframe.y2meta-uk.com/`, // Provided referer
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
    const dbYtURL = await getDbURL();
    const key = await getKey()

    if (key === undefined   ||  null) {
      throw new Error("Key is undefined");
    }
    let downloadUrl = await getDownloadURL(dbYtURL,link,key);
    if (downloadUrl === undefined) {
      let RETRY_COUNT = 0;
      const MAX_RETRY = 5;
      while (RETRY_COUNT < MAX_RETRY && downloadUrl === undefined) {
        RETRY_COUNT++;
        console.log(`Retrying... Attempt ${RETRY_COUNT}`);

        await new Promise((resolve) => setTimeout(resolve, 200));

        downloadUrl = await getDownloadURL(dbYtURL,link,key);

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







// function extractYouTubeID(url: string) {
//   const regex =
//     /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
//   const match = url.match(regex);
//   return match ? match[1] : "UnSupported YT URL";
// }