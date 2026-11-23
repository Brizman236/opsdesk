class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

function getErrorCodes(error) {
  const codes = [];
  const seen = new Set();
  let current = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if (typeof current.code === "string") {
      codes.push(current.code);
    }
    current = current.cause;
  }

  return codes;
}

function isPostgresError(error) {
  return getErrorCodes(error).some((code) => /^\d{5}$/.test(code));
}

function isTemporaryDatabaseError(error) {
  const temporaryCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "EPIPE",
    "57P01",
    "57P02",
    "57P03",
    "53300"
  ]);
  return getErrorCodes(error).some(
    (code) => temporaryCodes.has(code) || code.startsWith("08")
  );
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof ValidationError) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
        details: error.details
      }
    });
  }

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON."
      }
    });
  }

  const databaseError = isPostgresError(error) || isTemporaryDatabaseError(error);
  // Log only error class and code; driver messages can contain SQL or submitted values.
  console.error(databaseError ? "PostgreSQL operation failed" : "Unhandled request error", {
    name: error.name,
    code: getErrorCodes(error)[0]
  });

  if (isTemporaryDatabaseError(error)) {
    return res.status(503).json({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "A required service is temporarily unavailable."
      }
    });
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred."
    }
  });
}

module.exports = errorHandler;
module.exports.ValidationError = ValidationError;
