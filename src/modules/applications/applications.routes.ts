import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../middlewares/requireAdmin"
import {
  listApplicationsHandler,
  updateApplicationStatusHandler,
  type UpdateStatusParams,
  type UpdateStatusBody,
  getMetricsHandler,
} from "./applications.controller"

const applicationsRoutes: FastifyPluginAsync = async (fastify) => {
  // Listar todas las solicitudes
  fastify.get(
    "/applications",
    { preHandler: requireAdmin },
    listApplicationsHandler
  )

  // Actualizar estado de una solicitud (aprobar/rechazar/en revisión)
  fastify.patch<{ Params: UpdateStatusParams; Body: UpdateStatusBody }>(
    "/applications/:id/status",
    { preHandler: requireAdmin },
    updateApplicationStatusHandler
  )

  // Obtener métricas de solicitudes
  fastify.get(
    "/applications/metrics",
    { preHandler: requireAdmin },
    getMetricsHandler
  )
}

export default applicationsRoutes
