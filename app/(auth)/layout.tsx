import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autenticación",
  description: "Inicia sesión o regístrate en HC Gestor",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode })
{
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </div>
  )
}