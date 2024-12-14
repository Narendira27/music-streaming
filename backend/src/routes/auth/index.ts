import express from "express";
import { PrismaClient } from "@prisma/client";

import { loginBodySchema, registerBodySchema } from "../../schemas/authSchema";
import validateSchema from "../../utils/validateSchema";
import { compareHash, hashPassword, decodeJwt } from "../../utils/commonUtils";
import createJwt from "../../utils/createJwt";
import { sendEmail, verifyEmail } from "../../utils/emailUtils";
import { JwtPayload } from "jsonwebtoken";
import { promoteAdminSchema } from "../../schemas/promoteAdminSchema";

const masterPass = process.env.MASTER_PASS;

if (!masterPass) {
  throw console.error("MASTER PASSWORD NOT FOUND");
}

const prisma = new PrismaClient();

const authRoutes = express.Router();

authRoutes.post("/register", async (req, res) => {
  const validateResult = validateSchema(registerBodySchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }
  const passwordHash = hashPassword(req.body.password);
  try {
    await prisma.user.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        password: passwordHash,
      },
    });
    const emailStatus = await sendEmail(req.body.email);
    if (emailStatus !== "ok") {
      res
        .status(400)
        .json({ msg: "error while sending email, try resend email" });
      return;
    }
    res.status(200).json({ msg: "success" });
  } catch (e: any) {
    if (e.meta.target[0] === "email") {
      res.status(400).json({ msg: "Email already Exists" });
      return;
    }
    res.status(400).json({ msg: e });
  }
});

authRoutes.post("/login", async (req, res) => {
  const validateResult = validateSchema(loginBodySchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }
  try {
    const userData = await prisma.user.findFirst({
      where: { email: req.body.email },
    });
    if (!userData) {
      res.status(400).json({ msg: "User Not Found" });
      return;
    }
    if (!userData.verified) {
      res.status(400).json({ msg: "Email not verified" });
      return;
    }
    const passVerify = compareHash(userData.password, req.body.password);
    if (!passVerify) {
      res.status(400).json({ msg: "Incorrect Password" });
      return;
    }
    const jwt = createJwt({ id: userData.id, name: userData.name });
    res.status(200).json({ token: jwt });
  } catch (e) {
    res.status(400).json({ msg: e });
  }
});

authRoutes.get("/verify", async (req, res) => {
  const { Code } = req.query;
  if (!Code || Code === undefined) {
    res.status(400).json({ msg: "Required Parameters not found" });
    return;
  }
  const code = String(Code);
  const verifyResponse = await verifyEmail(code);
  if (verifyResponse !== "ok") {
    res.status(400).json({ msg: "Incorrect Token / Expired" });
    return;
  }
  try {
    const info = decodeJwt(code);
    if (!info) {
      throw new Error("info not found");
    }
    const { email } = info as JwtPayload;
    await prisma.user.update({ where: { email }, data: { verified: true } });
    res.redirect("https://notify.narendira.in");
  } catch {
    res.status(400).json({ msg: "Email Verification Failed, Try again Later" });
  }
});

authRoutes.post("/resend", async (req, res) => {
  const { email } = req.query;
  if (!email || email === undefined) {
    res.status(400).json({ msg: "Required Parameters not found" });
    return;
  }
  const Email = String(email);
  const emailStatus = await sendEmail(Email);
  if (emailStatus !== "ok") {
    res
      .status(400)
      .json({ msg: "error while sending email, try resend email" });
    return;
  }
  res.status(200).json({ msg: "success" });
});

authRoutes.post("/promoteAdmin", async (req, res) => {
  const validateResult = validateSchema(promoteAdminSchema, req.body);
  if (validateResult !== "ok") {
    res.status(400).json({ msg: validateResult });
    return;
  }
  if (req.body.auth !== masterPass) {
    res.status(400).json({ msg: "You are not authorized" });
    return;
  }

  try {
    await prisma.user.update({
      where: { email: req.body.email },
      data: { isAdmin: true },
    });
    res.status(200).json({ msg: "User Promoted to Admin" });
  } catch (e: any) {
    if (e.meta.cause === "Record to update not found.") {
      res.status(400).json({ msg: "User not Found" });
      return;
    }
    res.status(400).json({ msg: e.message });
  }
});

export default authRoutes;
