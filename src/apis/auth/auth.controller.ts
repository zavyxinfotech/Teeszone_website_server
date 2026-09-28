import { FastifyReply, FastifyRequest } from "fastify";
import { OAuth2Client } from "google-auth-library";
import type { User } from "@prisma/client";
import { config, fmt } from "../../config";
import { BadRequestException } from "../../exception/badrequest.exception";
import { CustomException } from "../../exception/custom.exception";
import { UnauthorizedException } from "../../exception/unauthorized.exception";
import { sendPasswordResetMail } from "../../services/email.service";
import {
  generateResetToken,
  hashPassword,
  hashResetToken,
  verifyPassword,
} from "../../services/password.service";
import { captureRequestError } from "../../utils/error-tracking";
import client from "../../utils/prisma";
import redisClient, { isRedisReady } from "../../utils/redis";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sendError = (reply: FastifyReply, error: any) => {
  const formatted = fmt.formatError(error);
  const { status, ...body } = formatted;
  reply.status(status).send(body);
};

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_SECONDS = 45;
const JWT_EXPIRY = "7d";

const googleClient = new OAuth2Client();

const serializeUser = (user: User) => ({
  id: user.id,
  email: user.email ?? "",
  name: user.name ?? "",
  phone: user.phone ?? "",
  role: user.role,
  hasPassword: !!user.passwordHash,
  googleLinked: !!user.googleId,
});

const roleFor = (email: string, current?: User["role"]): User["role"] =>
  current === "ADMIN" || config.admin_emails.includes(email) ? "ADMIN" : "CUSTOMER";

class AuthController {
  private async issueSession(reply: FastifyReply, user: User, message: string, status = 200) {
    const token = await reply.jwtSign({ user_id: user.id }, { expiresIn: JWT_EXPIRY });
    reply.status(status).send(fmt.formatResponse({ token, user: serializeUser(user) }, message));
  }

  register = async (
    req: FastifyRequest<{ Body: { name: string; email: string; password: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const name = req.body.name.trim();

      const existing = await client.user.findUnique({ where: { email } });
      if (existing && !existing.deletedAt) {
        if (existing.passwordHash) {
          throw new CustomException({
            status: 409,
            code: "E409",
            message: "An account already exists with this email.",
            description: "Sign in instead, or use “Forgot password” to recover it.",
          });
        }
        throw new CustomException({
          status: 409,
          code: "E409",
          message: "This email is registered via Google sign-in.",
          description:
            "Continue with Google, then set a password from your account page — or use “Forgot password” to set one now.",
        });
      }

      const passwordHash = await hashPassword(req.body.password);
      const user = existing
        ? await client.user.update({
            where: { id: existing.id },
            data: { name, passwordHash, role: roleFor(email), deletedAt: null },
          })
        : await client.user.create({
            data: { email, name, passwordHash, role: roleFor(email) },
          });

      await this.issueSession(reply, user, "Account created", 201);
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  login = async (
    req: FastifyRequest<{ Body: { email: string; password: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const email = req.body.email.trim().toLowerCase();
      const user = await client.user.findFirst({ where: { email, deletedAt: null } });
      if (!user) {
        throw new UnauthorizedException({
          message: "Incorrect email or password.",
          description: "Check the details and try again, or create an account.",
        });
      }
      if (!user.passwordHash) {
        throw new UnauthorizedException({
          message: "This account uses Google sign-in.",
          description:
            "Continue with Google, or use “Forgot password” to set a password for this email.",
        });
      }
      if (!(await verifyPassword(req.body.password, user.passwordHash))) {
        throw new UnauthorizedException({
          message: "Incorrect email or password.",
          description: "Check the details and try again, or use “Forgot password”.",
        });
      }

      const role = roleFor(email, user.role);
      const fresh =
        role === user.role
          ? user
          : await client.user.update({ where: { id: user.id }, data: { role } });
      await this.issueSession(reply, fresh, "Login successful");
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  google = async (
    req: FastifyRequest<{ Body: { credential: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      if (!config.google_client_id) {
        throw new CustomException({
          status: 503,
          code: "E503",
          message: "Google sign-in is not configured.",
          description: "Set GOOGLE_CLIENT_ID in the backend environment.",
        });
      }

      let payload;
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: req.body.credential,
          audience: config.google_client_id,
        });
        payload = ticket.getPayload();
      } catch {
        payload = undefined;
      }
      const email = payload?.email?.trim().toLowerCase();
      if (!payload?.sub || !email || payload.email_verified !== true) {
        throw new UnauthorizedException({
          message: "Google sign-in failed.",
          description: "The Google token is invalid or the email is unverified. Try again.",
        });
      }

      const existing =
        (await client.user.findUnique({ where: { googleId: payload.sub } })) ??
        (await client.user.findUnique({ where: { email } }));

      const user = existing
        ? await client.user.update({
            where: { id: existing.id },
            data: {
              googleId: payload.sub,
              email: existing.email ?? email,
              name: existing.name || payload.name || null,
              role: roleFor(email, existing.deletedAt ? undefined : existing.role),
              deletedAt: null,
            },
          })
        : await client.user.create({
            data: {
              email,
              googleId: payload.sub,
              name: payload.name || null,
              role: roleFor(email),
            },
          });

      await this.issueSession(reply, user, "Login successful");
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  forgotPassword = async (
    req: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const email = req.body.email.trim().toLowerCase();

      if (isRedisReady()) {
        const key = `pwreset-cooldown:${email}`;
        if (await redisClient.get(key)) {
          throw new CustomException({
            status: 429,
            code: "E429",
            message: "Please wait before requesting another reset link.",
            description: `Retry after ${RESET_COOLDOWN_SECONDS} seconds.`,
          });
        }
        await redisClient.setEx(key, RESET_COOLDOWN_SECONDS, "1");
      }

      const user = await client.user.findFirst({ where: { email, deletedAt: null } });
      if (user) {
        const { token, tokenHash } = generateResetToken();
        await client.$transaction([
          client.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: new Date() },
          }),
          client.passwordResetToken.create({
            data: {
              tokenHash,
              userId: user.id,
              expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            },
          }),
        ]);
        const link = `${config.frontend_url}/reset-password?token=${token}`;
        await sendPasswordResetMail(email, link);
      }

      reply
        .status(200)
        .send(fmt.formatResponse({ sent: true }, "If the email exists, a reset link was sent"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  resetPassword = async (
    req: FastifyRequest<{ Body: { token: string; password: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const record = await client.passwordResetToken.findFirst({
        where: {
          tokenHash: hashResetToken(req.body.token),
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });
      if (!record || record.user.deletedAt) {
        throw new BadRequestException({
          message: "This reset link is invalid or has expired.",
          description: "Request a new link from the “Forgot password” page.",
        });
      }

      const passwordHash = await hashPassword(req.body.password);
      await client.$transaction([
        client.user.update({ where: { id: record.userId }, data: { passwordHash } }),
        client.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        }),
      ]);

      reply
        .status(200)
        .send(fmt.formatResponse({ reset: true }, "Password updated — sign in with it now"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await client.user.findFirst({
        where: { id: req.authUser!.userId, deletedAt: null },
      });
      if (!user) {
        throw new UnauthorizedException({
          message: "Authentication error",
          description: "This account no longer exists.",
        });
      }
      reply.status(200).send(fmt.formatResponse(serializeUser(user), "Profile"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  updateMe = async (
    req: FastifyRequest<{ Body: { name?: string; phone?: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const data: { name?: string; phone?: string } = {};
      if (req.body.name !== undefined) data.name = req.body.name.trim();
      if (req.body.phone !== undefined) data.phone = req.body.phone.trim();
      const user = await client.user.update({
        where: { id: req.authUser!.userId },
        data,
      });
      reply.status(200).send(fmt.formatResponse(serializeUser(user), "Profile updated"));
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };

  changePassword = async (
    req: FastifyRequest<{ Body: { currentPassword?: string; newPassword: string } }>,
    reply: FastifyReply,
  ) => {
    try {
      const user = await client.user.findFirst({
        where: { id: req.authUser!.userId, deletedAt: null },
      });
      if (!user) {
        throw new UnauthorizedException({
          message: "Authentication error",
          description: "This account no longer exists.",
        });
      }
      if (user.passwordHash) {
        if (
          !req.body.currentPassword ||
          !(await verifyPassword(req.body.currentPassword, user.passwordHash))
        ) {
          throw new BadRequestException({
            message: "Current password is incorrect.",
            description: "Enter your existing password to set a new one.",
          });
        }
      }
      const updated = await client.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(req.body.newPassword) },
      });
      reply
        .status(200)
        .send(
          fmt.formatResponse(
            serializeUser(updated),
            user.passwordHash ? "Password changed" : "Password created",
          ),
        );
    } catch (error) {
      captureRequestError(error, req);
      sendError(reply, error);
    }
  };
}

export default new AuthController();
