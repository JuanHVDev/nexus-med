import { z } from "zod"
export const loginSchema = z.object({
  email: z
    .string({ error: "El correo electrónico es requerido" })
    .email("Correo electrónico inválido"),
  password: z
    .string({ error: "La contraseña es requerida" })
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
})
export const registerSchema = z.object({
  name: z
    .string({ error: "El nombre es requerido" })
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z
    .string({ error: "El correo electrónico es requerido" })
    .email("Correo electrónico inválido"),
  password: z
    .string({ error: "La contraseña es requerida" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número"
    ),
  confirmPassword: z.string({ error: "Confirma tu contraseña" }),
  role: z.enum(["DOCTOR", "NURSE", "RECEPTIONIST"] as const, {
    error: "Selecciona un rol válido",
  }),
  clinicId: z.string({ error: "Debes seleccionar una clínica" }),
  licenseNumber: z.string().optional(),
  specialty: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>