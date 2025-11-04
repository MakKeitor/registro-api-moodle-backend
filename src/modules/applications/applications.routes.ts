import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"
import {
  listApplicationsHandler,
  updateApplicationStatusHandler
} from "./applications.controller"

const applicationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Listar todas las solicitudes
  fastify.get(
    "/applications",
    { preHandler: requireAdmin },
    listApplicationsHandler
  )

  // Actualizar estado de una solicitud (aprobar/rechazar/en revisión)
  fastify.patch(
    "/applications/:id/status",
    { preHandler: requireAdmin },
    updateApplicationStatusHandler
  )
}

export default applicationsRoutes
