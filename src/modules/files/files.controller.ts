import type { FastifyReply, FastifyRequest } from "fastify"
import { join } from "path"
import { createReadStream, existsSync, statSync } from "fs"
import { prisma } from "../../db"

const UPLOADS_BASE_DIR =
  process.env.UPLOADS_DIR || join(process.cwd(), "uploads")

interface FileParams {
  fileId: string
}

export async function serveFileHandler(
  req: FastifyRequest<{ Params: FileParams }>,
  reply: FastifyReply
) {
  const { fileId } = req.params

  // Buscar el archivo en la base de datos
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      solicitud: {
        select: {
          id: true,
          dpi: true,
        },
      },
    },
  })

  if (!file) {
    return reply.code(404).send({ ok: false, error: "File not found" })
  }

  // Construir la ruta completa al archivo
  // El file.path viene como "/uploads/dpi/kind/filename.pdf"
  // Necesitamos remover el prefijo "/uploads" para evitar duplicación
  const relativePath = file.path.startsWith("/uploads/")
    ? file.path.substring("/uploads/".length)
    : file.path.startsWith("/uploads")
    ? file.path.substring("/uploads".length)
    : file.path

  const filePath = join(UPLOADS_BASE_DIR, relativePath)

  // Verificar que el archivo existe físicamente
  if (!existsSync(filePath)) {
    console.error(`File not found on disk: ${filePath}`)
    console.error(`Original path from DB: ${file.path}`)
    return reply
      .code(404)
      .send({ ok: false, error: "File not found on disk" })
  }

  // Obtener información del archivo
  const stat = statSync(filePath)

  // Configurar los headers apropiados
  reply.header("Content-Type", file.mimeType)
  reply.header("Content-Length", stat.size)
  reply.header(
    "Content-Disposition",
    `inline; filename="${file.path.split("/").pop()}"`
  )

  // Enviar el archivo como stream
  const stream = createReadStream(filePath)
  return reply.send(stream)
}
