import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
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
  ],
  callbacks: {
    async beforeRegister(user)
    {
      if (!user.clinicId)
      {
        throw new Error("Debe seleccionar una clínica para registrarse");
      }
      return user;
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },
});
export type AuthSession = typeof auth.$Infer.Session;