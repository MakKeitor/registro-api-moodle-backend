import type { FastifyInstance } from "fastify"
import usersRoutes from "../modules/settings/users/users.routes"

export default async function (app: FastifyInstance) {
  await app.register(usersRoutes, { prefix: "/api/v1" })
}
