import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/invitations`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];

  const dashboardRoutes = [
    "dashboard",
    "patients",
    "appointments",
    "consultations",
    "prescriptions",
    "billing",
    "lab-orders",
    "imaging-orders",
    "reports",
    "reports/patients",
    "reports/appointments",
    "reports/financial",
    "reports/medical",
    "settings",
    "settings/clinic",
    "settings/team",
    "settings/doctors",
    "settings/hours",
    "settings/audit",
    "help",
  ].map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const portalRoutes = [
    "patient-portal",
    "patient-portal/citas",
    "patient-portal/resultados",
    "patient-portal/recetas",
    "patient-portal/facturas",
    "patient-portal/historial",
    "patient-portal/perfil",
    "patient-portal/contacto",
  ].map((route) => ({
    url: `${baseUrl}/${route}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const apiRoutes = [
    {
      url: `${baseUrl}/api/docs`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  return [...publicRoutes, ...dashboardRoutes, ...portalRoutes, ...apiRoutes];
}
