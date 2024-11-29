import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const jwtPass = process.env.JWT_PASS;
if (!jwtPass) {
  throw console.error("JWT PASSWORD NOT FOUND");
}

interface CustomRequest extends Request {
  id?: string;
}

const authMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const headers = req.headers.authorization;
  if (!headers) {
    res
      .status(401)
      .json({ msg: "Authentication credentials were missing or invalid." });
    return;
  }
  const authToken = headers.split(" ")[1];
  if (!authToken) {
    res.status(400).json({ msg: "Invalid Token " });
    return;
  }
  try {
    const verify = (await jwt.verify(authToken, jwtPass)) as JwtPayload;
    req.id = verify.id;
    next();
  } catch (err) {
    res.status(400).json({ msg: "JWT expired or invalid" });
  }
};

export default authMiddleware;
