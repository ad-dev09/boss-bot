import { Router } from "express";

import { requireAuth } from "../middleware/requireAuth.js";
import { authService } from "../modules/auth/auth.service.js";
import { loginSchema } from "../modules/auth/auth.validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { unauthorized } from "../utils/httpError.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);

    res.json(result);
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw unauthorized();
    }

    res.json({ user: req.user });
  }),
);

