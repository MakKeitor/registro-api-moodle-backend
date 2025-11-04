import type { FastifyInstance } from "fastify"
import filesRoutes from "../modules/files/files.routes"

export default async function (app: FastifyInstance) {
  await app.register(filesRoutes, { prefix: "/api/v1" })
}
