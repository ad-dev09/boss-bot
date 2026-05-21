import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";
import { unauthorized } from "../../utils/httpError.js";
import type { AuthUser } from "./auth.types.js";
import type { LoginInput } from "./auth.validation.js";

type AuthTokenPayload = JwtPayload & {
  sub: string;
};

type UserForAuth = {
  id: string;
  email: string | null;
  name: string;
  role: AuthUser["role"];
};

const toAuthUser = (user: UserForAuth): AuthUser => {
  if (!user.email) {
    throw unauthorized("User account is missing an email address.");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

const signToken = (user: AuthUser) =>
  jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: "8h",
    },
  );

export const authService = {
  async login({ email, password }: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user?.passwordHash) {
      throw unauthorized("Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw unauthorized("Invalid email or password.");
    }

    const authUser = toAuthUser(user);

    return {
      token: signToken(authUser),
      user: authUser,
    };
  },

  async getUserFromToken(token: string) {
    let payload: string | JwtPayload;

    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw unauthorized("Invalid or expired token.");
    }

    if (typeof payload === "string" || !isAuthTokenPayload(payload)) {
      throw unauthorized("Invalid token.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw unauthorized("Invalid token.");
    }

    return toAuthUser(user);
  },
};

const isAuthTokenPayload = (payload: JwtPayload): payload is AuthTokenPayload =>
  typeof payload.sub === "string" && payload.sub.length > 0;
