import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const jwtPass = process.env.JWT_PASS;
if (!jwtPass) {
  throw console.error("JWT PASSWORD NOT FOUND");
}

interface payloadType {
  id: string;
  name: string;
}

const createJwt = (payload: payloadType) => {
  return jwt.sign({ ...payload }, jwtPass);
};

export default createJwt;
