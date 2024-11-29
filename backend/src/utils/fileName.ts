const crypto = require("crypto");

const generateFileName = (url: string) => {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return `${hash}.mp3`;
};

export default generateFileName;
