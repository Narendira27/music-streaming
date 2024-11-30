import { spawn } from "child_process";
import path from "path";

const downloadAudio = (
  videoUrl: string,
  filePath: string
): Promise<{ success: boolean; duration?: number; error?: string }> => {
  return new Promise((resolve, reject) => {
    const ytDlpCommand = [
      "yt-dlp",
      videoUrl,
      "--extract-audio",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      "-o",
      filePath,
    ];

    const ytDlpProcess = spawn(ytDlpCommand[0], ytDlpCommand.slice(1));

    ytDlpProcess.stdout.on("data", (data: Buffer) => {
      console.log(`yt-dlp stdout: ${data.toString()}`);
    });

    ytDlpProcess.stderr.on("data", (data: Buffer) => {
      console.error(`yt-dlp stderr: ${data.toString()}`);
    });

    ytDlpProcess.on("close", (code: number) => {
      if (code === 0) {
        getAudioDuration(filePath)
          .then((duration) => {
            console.log(duration);
            resolve({
              success: true,
              duration: duration,
            });
          })
          .catch((error) => {
            resolve({
              success: false,
              error: `Failed to extract duration: ${error}`,
            });
          });
      } else {
        resolve({
          success: false,
          error: "Failed to download the audio",
        });
      }
    });

    ytDlpProcess.on("error", (err: Error) => {
      resolve({
        success: false,
        error: "Failed to download the audio",
      });
    });
  });
};

const getAudioDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const ffprobeCommand = [
      "ffprobe",
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ];

    const ffprobeProcess = spawn(ffprobeCommand[0], ffprobeCommand.slice(1));

    let duration = "";

    ffprobeProcess.stdout.on("data", (data: Buffer) => {
      duration += data.toString().trim();
    });

    ffprobeProcess.stderr.on("data", (data: Buffer) => {
      console.error(`ffprobe stderr: ${data.toString()}`);
    });

    ffprobeProcess.on("close", (code: number) => {
      if (code === 0 && duration) {
        const durationInSeconds = parseFloat(duration); // Convert string to number
        if (isNaN(durationInSeconds)) {
          reject("Invalid duration extracted");
        } else {
          resolve(durationInSeconds); // Return duration as a number in seconds
        }
      } else {
        reject("Failed to extract audio duration");
      }
    });

    ffprobeProcess.on("error", (err: Error) => {
      reject("Failed to run ffprobe");
    });
  });
};

export default downloadAudio;

export { getAudioDuration };
