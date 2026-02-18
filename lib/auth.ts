import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
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

const statement = {
  user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password"],
  session: ["list", "revoke", "delete"],
} as const;

const ac = createAccessControl(statement);

const adminRole = ac.newRole({
  user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password"],
  session: ["list", "revoke", "delete"],
});

const doctorRole = ac.newRole({
  user: ["list"],
  session: ["list"],
});

const nurseRole = ac.newRole({
  user: ["list"],
  session: ["list"],
});

const receptionistRole = ac.newRole({
  user: ["list", "create"],
  session: ["list"],
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
      ac,
      roles: {
        admin: adminRole,
        doctor: doctorRole,
        nurse: nurseRole,
        receptionist: receptionistRole,
      },
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
    async beforeRegister(user: User & { clinicId?: string }) {
      if (!user.clinicId) {
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
  user: typeof auth.$Infer.Session.user;
};
