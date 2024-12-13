import { z } from "zod";

const AddSongAudioSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
});

export { AddSongAudioSchema };
