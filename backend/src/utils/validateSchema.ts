import { ZodSchema, ZodError } from "zod";

const validateSchema = <T>(
  schema: ZodSchema<T>,
  data: unknown
): string | null => {
  if (!data || (typeof data === "object" && Object.keys(data).length === 0)) {
    return "Request body is required.";
  }
  try {
    schema.parse(data);
    return "ok";
  } catch (e) {
    if (e instanceof ZodError) {
      return e.issues.map((issue) => issue.message).join(", ");
    }
    throw e;
  }
};

export default validateSchema;
