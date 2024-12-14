import { z } from "zod";

const promoteAdminSchema = z.object({
  email: z.string().email("Invalid Email"),
  auth: z.string().min(8, "Min 8 character is required"),
});

export { promoteAdminSchema };
