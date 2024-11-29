import { z } from "zod";

const loginBodySchema = z.object({
  email: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const registerBodySchema = z.object({
  name: z.string().min(2, "Name must be more than 2 characters"),
  email: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export { loginBodySchema, registerBodySchema };
