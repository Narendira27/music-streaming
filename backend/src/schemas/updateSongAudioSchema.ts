import { z } from "zod";

const UpdateSongAudioSchema = z.object({
  title: z.string().min(2, "Song Name must have at least 2 characters"),
});

export { UpdateSongAudioSchema };
