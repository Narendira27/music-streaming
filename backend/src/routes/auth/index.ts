import express from "express";
import { PrismaClient } from "@prisma/client";

import { loginBodySchema, registerBodySchema } from "../../schemas/authSchema";
import validateSchema from "../../utils/validateSchema";
import { compareHash, hashPassword } from "../../utils/passwordHashing";
import createJwt from "../../utils/createJwt";

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
    const passVerify = compareHash(userData.password, req.body.password);
    console.log(passVerify);
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

export default authRoutes;
