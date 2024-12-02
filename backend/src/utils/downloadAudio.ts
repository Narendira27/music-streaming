import axios from "axios";

import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import * as cheerio from "cheerio";

const getHTMLFile = async (ytUrl: string) => {
  const myHeaders = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "max-age=0",
    "content-type": "application/x-www-form-urlencoded",
    cookie: "pll_language=en",
    origin: "https://ssyoutube.online",
    priority: "u=0, i",
    referer: "https://ssyoutube.online/",
    "sec-ch-ua": '"Brave";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  };

  const urlencoded = new URLSearchParams();
  urlencoded.append("videoURL", ytUrl);

  const requestOptions = {
    method: "POST",
    url: "https://ssyoutube.online/yt-video-detail/",
    headers: myHeaders,
    data: urlencoded.toString(),
  };

  try {
    const response = await axios(requestOptions);
    return response.data;
  } catch {
    return "Error Occurred While Fetching the HTML";
  }
};

const ExactLinkFromHTML = (htmlText: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const $ = cheerio.load(htmlText);

    const table = $("table.list");
    if (!table.length) {
      return reject("Table with class 'list' not found.");
    }

    const secondRow = table.find("tr").eq(1);
    if (!secondRow.length) {
      return reject("Second row not found in the table.");
    }

    const button = secondRow.find('button[type="button"][value="Download"]');
    if (!button.length) {
      return reject(
        "Button with type='button' and value='Download' not found."
      );
    }

    const onClickValue = button.attr("onclick");
    if (!onClickValue) {
      return reject("onClick attribute not found on the button.");
    }

    const urlRegex = /'(https:\/\/redirector\.googlevideo\.com[^\']+)'/;
    const urlMatch = onClickValue.match(urlRegex);

    if (urlMatch) {
      const downloadLink = urlMatch[1];
      return resolve(downloadLink);
    } else {
      return reject("Download link not found in onClick attribute.");
    }
  });
};

const downloadAudio = (link: string, path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const filePath = path.slice(0, path.length - 4) + ".m4a";

    axios({
      method: "GET",
      url: link,
      responseType: "stream",
    })
      .then((response) => {
        const writer = fs.createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on("finish", () => {
          resolve(filePath);
        });

        writer.on("error", (err) => {
          console.error("Error writing audio file:", err);
          reject("Error writing audio file: " + err.message);
        });
      })
      .catch((err) => {
        console.error("Error downloading audio:", err);
        reject("Error downloading audio: " + err.message);
      });
  });
};

function convertM4AToMP3(inputFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const mp3FilePath =
      inputFilePath.slice(0, inputFilePath.length - 4) + ".mp3";
    ffmpeg(inputFilePath)
      .output(mp3FilePath)
      .on("end", () => {
        fs.unlink(inputFilePath, (err) => {
          if (err) {
            console.error("Error deleting M4A file:", err);
          } else {
            console.log("M4A file deleted.");
          }
        });
        console.log("Conversion complete. MP3 file saved to:", mp3FilePath);
        resolve(mp3FilePath);
      })
      .on("error", (err) => {
        console.error("Error during conversion:", err);
        reject(err);
      })
      .run();
  });
}

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

const downloadYoutubeAudio = async (link: string, filepath: string) => {
  try {
    const HTMLText = await getHTMLFile(link);
    if (HTMLText === "Error Occurred While Fetching the HTML") {
      throw new Error("Failed to fetch HTML from the link.");
    }
    const getLink = await ExactLinkFromHTML(HTMLText);
    const downloadedPath = await downloadAudio(getLink, filepath);
    const convertedPath = await convertM4AToMP3(downloadedPath);
    const duration = await getAudioDuration(convertedPath);
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
