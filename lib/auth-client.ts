import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./auth"
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    inferAdditionalFields<typeof auth>(),
  ],
})
// Exportar tipos
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user