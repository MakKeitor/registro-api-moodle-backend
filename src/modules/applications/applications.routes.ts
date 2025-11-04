import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"
import { listApplicationsHandler } from "./applications.controller"

const applicationsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/applications",
    { preHandler: requireAdmin },
    listApplicationsHandler
  )
}

export default applicationsRoutes
