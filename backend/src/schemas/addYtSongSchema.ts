import { z } from "zod";

const AddYtSongSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  duration: z.string(),
  filePath: z.string(),
  fileName: z.string(),
});

export { AddYtSongSchema };
