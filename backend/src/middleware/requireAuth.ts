import type { RequestHandler } from "express";

import { authService } from "../modules/auth/auth.service.js";
import { unauthorized } from "../utils/httpError.js";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.header("authorization");
    const [scheme, token] = header?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw unauthorized("Missing bearer token.");
    }

    req.user = await authService.getUserFromToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

