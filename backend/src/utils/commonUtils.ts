import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const generateFileName = (url: string) => {
  const hash = crypto.createHash("md5").update(url).digest("hex");
  return `${hash}.mp3`;
};

const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

const compareHash = (hash: string, pass: string) => {
  return bcrypt.compareSync(pass, hash);
};

const decodeJwt = (token: string) => {
  return jwt.decode(token);
};

export { hashPassword, compareHash, generateFileName, decodeJwt };
