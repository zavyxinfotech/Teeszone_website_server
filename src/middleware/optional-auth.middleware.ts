import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../utils/kysely";

export const optionalAuthMiddleware = async (request: FastifyRequest, _reply: FastifyReply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return;

    const decoded = await request.jwtVerify<{ user_id: string }>();
    if (!decoded?.user_id) return;

    const user = await db
      .selectFrom("User")
      .select(["id"])
      .where("id", "=", decoded.user_id)
      .where("deletedAt", "is", null)
      .executeTakeFirst();

    if (user) {
      request.authUser = { userId: decoded.user_id };
    }
  } catch {
    // Guest or expired token, proceed without authUser
  }
};
