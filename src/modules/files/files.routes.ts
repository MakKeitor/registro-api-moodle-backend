import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"
import { serveFileHandler } from "./files.controller"

const filesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { fileId: string } }>(
    "/files/:fileId",
    { preHandler: requireAdmin },
    serveFileHandler
  )
}

export default filesRoutes
