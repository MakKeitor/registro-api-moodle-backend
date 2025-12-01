// src/middlewares/requireAdmin.ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../db"

const IS_HTTPS = process.env.USE_HTTPS === "true"
const COOKIE_NAME = IS_HTTPS ? "__Host-sid" : "sid"

export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const sid = req.cookies?.[COOKIE_NAME] ?? req.cookies?.sid ?? req.cookies?.["__Host-sid"]

  if (!sid) return reply.code(401).send({ error: "UNAUTHORIZED" })
  const session = await prisma.session.findUnique({
    where: { token: sid },
    include: { user: true },
  })

  const user = session?.user
  const expired = !!session && session.expiresAt < new Date()
  if (!user || user.role !== "ADMIN" || expired || session.revokedAt) {
    return reply.code(401).send({ error: "UNAUTHORIZED" })
  }

  req.currentUser = { id: user.id, role: user.role }
}
