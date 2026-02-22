import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "HC Gestor - Sistema de Historia Clínica Electrónica",
    template: "%s | HC Gestor",
  },
  description:
    "Sistema completo de gestión de historias clínicas electrónicas para clínicas medianas. Expedientes digitales, citas, recetas, facturación y más. Cumplimiento NOM-024-SSA3.",
  keywords: [
    "historia clínica electrónica",
    "software médico",
    "gestión clínica",
    "expediente digital",
    "NOM-024-SSA3",
    "sistema hospitalario",
    "gestión de pacientes",
    "citas médicas",
    "recetas electrónicas",
    "facturación médica",
  ],
  authors: [{ name: "HC Gestor" }],
  creator: "HC Gestor",
  publisher: "HC Gestor",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: baseUrl,
    siteName: "HC Gestor",
    title: "HC Gestor - Sistema de Historia Clínica Electrónica",
    description:
      "Sistema completo de gestión de historias clínicas electrónicas. Expedientes digitales, citas, recetas y facturación.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "HC Gestor - Sistema de Historia Clínica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HC Gestor - Sistema de Historia Clínica Electrónica",
    description:
      "Sistema completo de gestión de historias clínicas electrónicas para clínicas medianas.",
    images: [`${baseUrl}/og-image.png`],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
{
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
          </QueryProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
