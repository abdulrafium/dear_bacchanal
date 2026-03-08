import { z } from "zod";

// Sign up validation schema
export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Sign in validation schema (password OR oneTimeToken for post-payment login)
export const signInSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase(),
  password: z.string().optional(),
  oneTimeToken: z.string().optional(),
}).refine((data) => data.password !== undefined || data.oneTimeToken !== undefined, {
  message: "Password or one-time token is required",
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;