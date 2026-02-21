import { NextResponse } from "next/server"
import swaggerUi from "swagger-ui-express"
import { openApiDocument } from "@/lib/openapi/document"

export const dynamic = "force-dynamic"

export async function GET() {
  const swaggerHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HC Gestor API - Documentación</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      display: none;
    }
    .swagger-ui .info {
      margin: 30px 0;
    }
    .swagger-ui .info .title {
      font-size: 2.5em;
      font-weight: bold;
      color: #2563eb;
    }
    .swagger-ui .info .description {
      font-size: 1.1em;
      line-height: 1.6;
    }
    .api-logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .api-logo h1 {
      color: #2563eb;
      margin: 0;
    }
    .api-logo p {
      color: #6b7280;
      margin: 5px 0 0 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const swaggerDoc = ${JSON.stringify(openApiDocument)};
      
      SwaggerUI({
        dom_id: "#swagger-ui",
        spec: swaggerDoc,
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true,
        persistAuthorization: true,
        syntaxHighlight: {
          activate: true,
          theme: "agate"
        },
        tryItOutEnabled: false,
        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
        presets: [
          SwaggerUI.presets.apis,
          SwaggerStandalonePresets
        ],
        layout: "StandaloneLayout",
        docExpansion: "list",
        filter: true,
        operationsSorter: "alpha",
        tagsSorter: "alpha",
      });
    };
  </script>
</body>
</html>
  `

  return new NextResponse(swaggerHtml, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
