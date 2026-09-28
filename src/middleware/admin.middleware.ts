import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../config";
import { CustomException } from "../exception/custom.exception";
import { UnauthorizedException } from "../exception/unauthorized.exception";
import { db } from "../utils/kysely";

export const adminMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.authUser?.userId) {
      throw new UnauthorizedException({
        message: "Authentication error",
        description: "Provide a valid Bearer token.",
      });
    }
    const user = await db
      .selectFrom("User")
      .select(["role"])
      .where("id", "=", request.authUser.userId)
      .where("deletedAt", "is", null)
      .executeTakeFirst();
    if (user?.role !== "ADMIN") {
      throw new CustomException({
        status: 403,
        code: "E403",
        message: "Forbidden",
        description: "Admin access is required for this endpoint.",
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const formatted = fmt.formatError({
      status: error?.status || 403,
      message: error?.message || "Forbidden",
      code: error?.code || "E403",
      description: error?.description,
    });
    const { status, ...body } = formatted;
    reply.status(status).send(body);
  }
};
