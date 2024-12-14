import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

const prisma = new PrismaClient();

interface CustomRequest extends Request {
  id?: string;
}

const adminAuthMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = req.id;
  if (id === undefined || null) {
    res.status(400).json({ msg: "auth failed" });
    return;
  }

  try {
    const dbResponse = await prisma.user.findFirst({ where: { id } });
    if (!dbResponse?.isAdmin) {
      res.status(400).json({ msg: "You are not authorized" });
      return;
    }
    next();
  } catch (e: any) {
    res.status(400).json({ msg: e.message });
  }
};

export default adminAuthMiddleware;
