import { NextResponse } from "next/server"
import { openApiDocument } from "@/lib/openapi/document"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(openApiDocument, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
