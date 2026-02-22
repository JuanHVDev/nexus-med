import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/register",
          "/api/docs",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/patients/",
          "/appointments/",
          "/consultations/",
          "/prescriptions/",
          "/billing/",
          "/lab-orders/",
          "/imaging-orders/",
          "/reports/",
          "/settings/",
          "/patient-portal/",
          "/invitations/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/login", "/register"],
        disallow: ["/api/", "/dashboard/", "/patient-portal/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
