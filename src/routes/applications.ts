import type { FastifyInstance } from "fastify"
import applicationsRoutes from "../modules/applications/applications.routes"

export default async function (app: FastifyInstance) {
  await app.register(applicationsRoutes, { prefix: "/api/v1" })
}
