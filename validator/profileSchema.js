const z = require('zod')

const updateProfileSchema = z
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
      })
      .optional(),

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
      })
      .optional(),

      bio: z
      .string()
      .optional()
  })

  module.exports = {
    updateProfileSchema
  }

