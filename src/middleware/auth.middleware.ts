import { FastifyReply, FastifyRequest } from "fastify";
import { fmt } from "../config";
import { UnauthorizedException } from "../exception/unauthorized.exception";
import { db } from "../utils/kysely";

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const decoded = await request.jwtVerify<{ user_id: string }>();
    if (!decoded?.user_id) {
      throw new UnauthorizedException({
        message: "Authentication error",
        description: "The token payload is not valid.",
      });
    }
    const user = await db
      .selectFrom("User")
      .select(["id"])
      .where("id", "=", decoded.user_id)
      .where("deletedAt", "is", null)
      .executeTakeFirst();
    if (!user) {
      throw new UnauthorizedException({
        message: "Authentication error",
        description: "This account no longer exists.",
      });
    }
    request.authUser = { userId: decoded.user_id };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const formatted = fmt.formatError({
      status: error?.status || error?.statusCode || 401,
      message: error?.message || "Authentication error",
      code: error?.code === "string" ? error.code : "E401",
      description: error?.description || "Provide a valid Bearer token.",
    });
    const { status, ...body } = formatted;
    reply.status(status).send(body);
  }
};
