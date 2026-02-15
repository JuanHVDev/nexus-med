import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { User } from "better-auth";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({
  adapter,
});
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "DOCTOR",
        input: true,
      },
      clinicId: {
        type: "number",
        required: true,
        input: true,
      },
      licenseNumber: {
        type: "string",
        required: false,
        input: true,
      },
      specialty: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      isActive: {
        type: "boolean",
        defaultValue: true,
      },
    },
  },
  plugins: [
    admin({
      adminRole: "ADMIN",
      defaultRole: "DOCTOR",
    }),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        clinicId: { type: "number" },
        licenseNumber: { type: "string" },
        specialty: { type: "string" },
        phone: { type: "string" },
        isActive: { type: "boolean" },
      },
    }),
  ],
  callbacks: {
    async beforeRegister(user: User & { clinicId?: string })
    {
      if (!user.clinicId)
      {
        throw new Error("Debe seleccionar una clínica para registrarse");
      }
      return user;
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
});
export type SessionWithFields = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user
}