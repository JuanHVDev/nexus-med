import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sendVerificationEmail } from "./email/send-verification";
import { redis, isRedisConfigured } from "./redis";

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
  secondaryStorage: isRedisConfigured()
    ? {
        get: async (key) => {
          const value = await redis.get<string>(key);
          return value ?? null;
        },
        set: async (key, value, ttl) => {
          if (ttl) {
            await redis.set(key, value, { ex: ttl });
          } else {
            await redis.set(key, value);
          }
        },
        delete: async (key) => {
          await redis.del(key);
        },
      }
    : undefined,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl: url,
      });
    },
    sendOnSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    storage: isRedisConfigured() ? "secondary-storage" : "database",
  },
});

export type SessionWithFields = typeof auth.$Infer.Session.session & {
  user: typeof auth.$Infer.Session.user;
};
