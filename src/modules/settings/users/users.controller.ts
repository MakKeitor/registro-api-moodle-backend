import type { FastifyRequest, FastifyReply } from "fastify"
import type { z } from "zod"
import { prisma } from "../../../db"

export async function getUsers(req: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
  })
  return reply.send({ok: true, users})
}
