const { z } = require("zod");

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const passwordMessage =
  "Password must be at least 8 characters and include: 1 uppercase, 1 lowercase, 1 number, and 1 special character";

const signupSchema = z
  .object({
    first_name: z
      .string()
      .min(2, {
        error: (issue) =>
          issue.code === "too_small"
            ? "First name must be at least 2 characters"
            : "First name is required",
      })
      .max(50, {
        error: () => "First name must be under 50 characters",
      }),

    last_name: z
      .string()
      .max(100, {
        error: () => "Last name must be under 100 characters",
      })
      .optional(),

    username: z
      .string()
      .min(3, {
        error: (issue) =>
          issue.code === "too_small"
            ? "Username must be at least 3 characters"
            : "Username is required",
      })
      .max(30, {
        error: () => "Username must be under 30 characters",
      }),

    email: z
      .string()
      .email({
        error: () => "Must be a valid email",
      }),

    password: z
      .string()
      .regex(passwordRegex, {
        error: () => passwordMessage,
      }),

    confirm_password: z
      .string()
      .min(1, {
        error: () => "Confirm password is required",
      }),

    otp: z
      .string()
      .length(6, {
        error: () => "OTP must be 6 digits",
      }),
  })
  .refine((data) => data.password === data.confirm_password, {
    error: () => "Passwords do not match",
    path: ["confirm_password"],
  });

const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, {
      error: (issue) =>
        issue.code === "too_small"
          ? "Must be at least 3 characters"
          : "Username or email is required",
    }),

  password: z
    .string()
    .regex(passwordRegex, {
      error: () => passwordMessage,
    }),
});

const verify2FALoginSchema = z.object({
   email: z
   .string()
   .email({
     error: () => "Must be a valid email",
   }),
    
  otp: z
    .string()
    .length(6, {
      error: () => "OTP must be 6 digits",
    }),
});

module.exports = {
  signupSchema,
  loginSchema,
  verify2FALoginSchema,
};
