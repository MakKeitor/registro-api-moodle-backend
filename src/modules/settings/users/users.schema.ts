import { z } from "zod"

export const UsersBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER", "MODERATOR"]),
})
