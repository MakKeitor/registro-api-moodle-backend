import type { FastifyPluginAsync } from "fastify"
import { requireAdmin } from "../../../middlewares/requireAdmin"
import { getUsers } from "./users.controller"

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  // Obtener todos los usuarios
  fastify.get("/users", { preHandler: requireAdmin }, getUsers)
}

export default usersRoutes