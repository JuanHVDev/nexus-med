import { OpenAPIV3 } from "openapi-types"
import { openApiDocument } from "./schemas"
import { authPaths, patientPaths, appointmentPaths, medicalNotePaths, prescriptionPaths, labOrderPaths, imagingOrderPaths, billingPaths, dashboardPaths, settingsPaths } from "./paths"

const allPaths: OpenAPIV3.PathsObject = {
  ...authPaths,
  ...patientPaths,
  ...appointmentPaths,
  ...medicalNotePaths,
  ...prescriptionPaths,
  ...labOrderPaths,
  ...imagingOrderPaths,
  ...billingPaths,
  ...dashboardPaths,
  ...settingsPaths,
}

openApiDocument.paths = allPaths

export { openApiDocument }
export * from "./index"
export * from "./schemas"
export * from "./paths"
