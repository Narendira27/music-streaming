import { z } from "zod";

const updateYoutubeUrlSchema = z.object({
  url: z.string().min(2, "url too short"),
});

export { updateYoutubeUrlSchema };
