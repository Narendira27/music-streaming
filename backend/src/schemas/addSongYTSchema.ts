import { z } from "zod";

const AddSongYtBodySchema = z.object({
  title: z.string().min(2, "Song Name must have at least 2 characters"),
  youtubeUrl: z.string().url("Enter valid youtube url"),
});

export { AddSongYtBodySchema };
