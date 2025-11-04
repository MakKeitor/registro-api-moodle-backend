import type { FastifyReply, FastifyRequest } from "fastify"
import { prisma } from "../../db"
import type { $Enums } from "../../generated/prisma"

type ApplicationStatus = "pending" | "in_review" | "approved" | "rejected"

const statusMap: Record<$Enums.SolicitudStatus, ApplicationStatus> = {
  PENDIENTE: "pending",
  EN_REVISION: "in_review",
  APROBADA: "approved",
  RECHAZADA: "rejected",
  REVALIDACION_PENDIENTE: "in_review",
}

const renglonMap: Record<$Enums.Renglon, string> = {
  PERSONAL_PERMANENTE_011: "PERSONAL PERMANENTE 011",
  GRUPO_029: "GRUPO 029",
  SUBGRUPO_18_Y_022: "SUBGRUPO 18 Y 022",
  NO_APLICA: "NO APLICA",
  RENGLON_021: "RENGLÓN 021",
}

interface FileInfo {
  id: string
  path: string
  mimeType: string
  sizeBytes: number
}

interface ApplicationListItem {
  id: string
  email: string
  primerNombre: string
  segundoNombre?: string
  primerApellido: string
  segundoApellido?: string
  dpi: string
  entidad: string
  institucion: string
  renglon: string
  status: ApplicationStatus
  submittedAt: string
  etnia?: string
  dependencia?: string
  colegio?: string
  telefono?: string
  direccion?: string
  files?: FileInfo[]
}

// Tipos para los requests
interface UpdateStatusParams {
  id: string
}

interface UpdateStatusBody {
  status: "approved" | "rejected" | "in_review"
  note?: string
}

// Handler para aprobar/rechazar/cambiar estado
export async function updateApplicationStatusHandler(
  req: FastifyRequest<{ Params: UpdateStatusParams; Body: UpdateStatusBody }>,
  reply: FastifyReply
) {
  const { id } = req.params
  const { status, note } = req.body

  // Validar que el status sea válido
  if (!["approved", "rejected", "in_review"].includes(status)) {
    return reply.code(400).send({
      ok: false,
      error: "Invalid status. Must be 'approved', 'rejected', or 'in_review'",
    })
  }

  // Mapear status del frontend al backend
  const statusBackendMap: Record<string, $Enums.SolicitudStatus> = {
    approved: "APROBADA",
    rejected: "RECHAZADA",
    in_review: "EN_REVISION",
  }

  const newStatus = statusBackendMap[status]

  try {
    // Verificar que la solicitud existe
    const existingSolicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!existingSolicitud) {
      return reply.code(404).send({
        ok: false,
        error: "Solicitud no encontrada",
      })
    }

    // Actualizar la solicitud
    const updateData: any = {
      status: newStatus,
    }

    // Agregar fecha según el estado
    if (newStatus === "APROBADA") {
      updateData.approvedAt = new Date()
    } else if (newStatus === "RECHAZADA") {
      updateData.rejectedAt = new Date()
    }

    const solicitud = await prisma.solicitud.update({
      where: { id },
      data: updateData,
    })

    // Si hay nota, crear ReviewNote
    if (note && note.trim().length > 0) {
      await prisma.reviewNote.create({
        data: {
          solicitudId: id,
          message: note.trim(),
        },
      })
    }

    return reply.send({
      ok: true,
      data: {
        id: solicitud.id,
        status: statusMap[solicitud.status],
        message: `Solicitud ${status === "approved" ? "aprobada" : status === "rejected" ? "rechazada" : "actualizada"} exitosamente`,
      },
    })
  } catch (error) {
    req.log.error({ err: error }, "Error updating application status")
    return reply.code(500).send({
      ok: false,
      error: "Error al actualizar el estado de la solicitud",
    })
  }
}

export async function listApplicationsHandler(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  const solicitudes = await prisma.solicitud.findMany({
    orderBy: [
      { submittedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      applicant: { select: { email: true } },
      Entidad: { select: { name: true } },
      Institucion: { select: { name: true } },
      Dependencia: { select: { name: true } },
      files: {
        select: {
          id: true,
          path: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  })

  const data: ApplicationListItem[] = solicitudes.map((solicitud) => {
    const email =
      solicitud.correoInstitucional ??
      solicitud.correoPersonal ??
      solicitud.applicant?.email ??
      ""

    const entidad =
      solicitud.entidadName ??
      solicitud.Entidad?.name ??
      "SOCIEDAD CIVIL"

    const institucion =
      solicitud.institucionName ??
      solicitud.Institucion?.name ??
      "NO APLICA"

    const dependencia =
      solicitud.dependenciaName ?? solicitud.Dependencia?.name ?? undefined

    const submittedAt =
      solicitud.submittedAt?.toISOString() ?? solicitud.createdAt.toISOString()

    const direccionParts = [
      solicitud.municipioName,
      solicitud.departamentoName,
    ].filter(Boolean)

    return {
      id: solicitud.id,
      email,
      primerNombre: solicitud.primerNombre,
      segundoNombre: solicitud.segundoNombre ?? undefined,
      primerApellido: solicitud.primerApellido,
      segundoApellido: solicitud.segundoApellido ?? undefined,
      dpi: solicitud.dpi,
      entidad,
      institucion,
      renglon: renglonMap[solicitud.renglon] ?? "NO APLICA",
      status: statusMap[solicitud.status] ?? "pending",
      submittedAt,
      etnia: solicitud.etnia ?? undefined,
      dependencia,
      colegio: solicitud.colegio ?? undefined,
      telefono: solicitud.telefono ?? undefined,
      direccion:
        direccionParts.length > 0 ? direccionParts.join(", ") : undefined,
      files: solicitud.files?.map((file) => ({
        id: file.id,
        path: file.path,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })) ?? [],
    }
  })

  return reply.send({ ok: true, data })
}
