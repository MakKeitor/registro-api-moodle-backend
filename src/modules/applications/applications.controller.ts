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
