import { z } from "zod";

export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  tenantName: z.string().min(1, "Business name is required"),
  locationName: z.string().optional(),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const selectLocationSchema = z.object({
  locationId: z.string().uuid(),
});
export type SelectLocationInput = z.infer<typeof selectLocationSchema>;