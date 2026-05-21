import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { HttpError } from "../utils/httpError.js";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed.",
      issues: error.issues,
    });
    return;
  }

  if (isPrismaConstraintError(error)) {
    res.status(400).json({
      message: "Database request failed.",
      code: error.code,
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error.",
  });
};

const isPrismaConstraintError = (
  error: unknown,
): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof error.code === "string" &&
  error.code.startsWith("P");
