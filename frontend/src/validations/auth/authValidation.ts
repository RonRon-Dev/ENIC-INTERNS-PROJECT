import * as z from "zod";

// Validation schemas for authentication-related forms

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullname: z.string().min(1, "Full name is required"),
    username: z.string().min(1, "Username is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .refine(
        (val) =>
          /[A-Z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*]/.test(val),
        {
          message:
            "Password must contain at least one uppercase letter, one number, and one special character",
        },
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // ⭐ Important for UI error mapping
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof registerSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>;
