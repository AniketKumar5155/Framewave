const validateZod = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const formattedErrors = error?.errors?.map((err) => ({
        field: err.path?.[0] || "unknown",
        message: err.message || "Invalid input",
      }));

      console.error("Zod validation error:", error); // 🔍 DEBUG LINE

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors || [{ field: "unknown", message: error.message }],
      });
    }
  };
};

module.exports = validateZod;