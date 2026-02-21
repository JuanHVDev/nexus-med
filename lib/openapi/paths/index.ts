import { OpenAPIV3 } from "openapi-types"

export const authPaths: OpenAPIV3.PathsObject = {
  "/api/auth/signin": {
    post: {
      tags: ["Auth"],
      summary: "Iniciar sesión",
      description: "Autentica al usuario con email y contraseña. Requiere verificación de correo electrónico.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", format: "password" },
              },
              required: ["email", "password"],
            },
            example: {
              email: "doctor@clinica.com",
              password: "password123",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login exitoso",
          content: {
            "application/json": {
              example: { user: { id: "user_123", name: "Dr. Juan", email: "doctor@clinica.com" }, session: { token: "..." } },
            },
          },
        },
        401: { description: "Credenciales inválidas" },
        403: { description: "Correo no verificado" },
        429: { description: "Too many requests - Rate limit excedido" },
      },
    },
  },
  "/api/auth/signout": {
    post: {
      tags: ["Auth"],
      summary: "Cerrar sesión",
      description: "Cierra la sesión actual del usuario",
      responses: {
        200: { description: "Logout exitoso" },
        401: { description: "No hay sesión activa" },
      },
    },
  },
  "/api/auth/get-session": {
    get: {
      tags: ["Auth"],
      summary: "Obtener sesión actual",
      description: "Retorna la sesión activa del usuario si existe",
      responses: {
        200: {
          description: "Sesión activa",
          content: { "application/json": { example: { user: { id: "user_123", name: "Dr. Juan" }, session: {} } } },
        },
        401: { description: "Sin sesión" },
      },
    },
  },
}

export const patientPaths: OpenAPIV3.PathsObject = {
  "/api/patients": {
    get: {
      tags: ["Patients"],
      summary: "Listar pacientes",
      description: "Retorna todos los pacientes de la clínica del usuario. Soporta paginación.",
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        { name: "search", in: "query", schema: { type: "string", description: "Buscar por nombre, CURP o email" } },
      ],
      responses: {
        200: {
          description: "Lista de pacientes",
          content: { "application/json": { example: { data: [], total: 100, page: 1, limit: 20 } } },
        },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Patients"],
      summary: "Crear paciente",
      description: "Registra un nuevo paciente en el sistema",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PatientInput" },
            example: {
              firstName: "Juan",
              lastName: "Pérez",
              curp: "XAXX010101HNEXXXA1",
              birthDate: "1990-01-01",
              gender: "MALE",
              email: "juan@email.com",
              phone: "5551234567",
            },
          },
        },
      },
      responses: {
        201: { description: "Paciente creado", content: { "application/json": { example: { id: "pat_123", firstName: "Juan", lastName: "Perez" } } } },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
        409: { description: "CURP o email ya existe" },
      },
    },
  },
  "/api/patients/{id}": {
    get: {
      tags: ["Patients"],
      summary: "Obtener paciente",
      description: "Retorna los datos de un paciente específico",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Datos del paciente", content: { "application/json": { example: { id: "pat_123", firstName: "Juan", lastName: "Perez" } } } },
        401: { description: "No autorizado" },
        404: { description: "Paciente no encontrado" },
      },
    },
    put: {
      tags: ["Patients"],
      summary: "Actualizar paciente",
      description: "Actualiza los datos de un paciente",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/PatientInput" } } },
      },
      responses: {
        200: { description: "Paciente actualizado" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
        404: { description: "Paciente no encontrado" },
      },
    },
    delete: {
      tags: ["Patients"],
      summary: "Eliminar paciente (soft delete)",
      description: "Desactiva un paciente (no lo elimina físicamente)",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Paciente desactivado" },
        401: { description: "No autorizado" },
        404: { description: "Paciente no encontrado" },
      },
    },
  },
}

export const appointmentPaths: OpenAPIV3.PathsObject = {
  "/api/appointments": {
    get: {
      tags: ["Appointments"],
      summary: "Listar citas",
      description: "Retorna las citas de la clínica. Filtros opcionales por doctor, paciente, status y fechas.",
      parameters: [
        { name: "doctorId", in: "query", schema: { type: "string" } },
        { name: "patientId", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string", enum: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] } },
        { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Lista de citas" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Appointments"],
      summary: "Crear cita",
      description: "Programa una nueva cita. Valida conflictos de horario automáticamente.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/AppointmentInput" },
            example: {
              patientId: "pat_123",
              doctorId: "user_456",
              startTime: "2024-01-15T09:00:00Z",
              endTime: "2024-01-15T09:30:00Z",
              status: "SCHEDULED",
              reason: "Consulta general",
            },
          },
        },
      },
      responses: {
        201: { description: "Cita creada" },
        400: { description: "Conflicto de horario o datos inválidos" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/appointments/{id}": {
    get: {
      tags: ["Appointments"],
      summary: "Obtener cita",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Datos de la cita" },
        401: { description: "No autorizado" },
        404: { description: "Cita no encontrada" },
      },
    },
    put: {
      tags: ["Appointments"],
      summary: "Actualizar cita",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/AppointmentUpdate" } } },
      },
      responses: {
        200: { description: "Cita actualizada" },
        400: { description: "Conflicto de horario" },
        401: { description: "No autorizado" },
      },
    },
    delete: {
      tags: ["Appointments"],
      summary: "Cancelar cita",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Cita cancelada" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const medicalNotePaths: OpenAPIV3.PathsObject = {
  "/api/patients/{patientId}/notes": {
    get: {
      tags: ["Medical Notes"],
      summary: "Listar notas médicas",
      description: "Retorna el historial de notas médicas de un paciente",
      parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Lista de notas médicas" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Medical Notes"],
      summary: "Crear nota médica",
      description: "Registra una nota médica usando formato SOAP",
      parameters: [{ name: "patientId", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/MedicalNoteInput" },
            example: {
              appointmentId: "app_123",
              patientId: "pat_123",
              doctorId: "user_456",
              subjective: "Paciente refiere dolor de cabeza",
              objective: "TA: 120/80, FC: 72 lpm",
              assessment: "Cefalea tensional",
              plan: "Analgesico y reposo",
              diagnosis: "Cefalea",
              icdCode: "R51",
            },
          },
        },
      },
      responses: {
        201: { description: "Nota creada" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/patients/{patientId}/notes/{noteId}": {
    get: {
      tags: ["Medical Notes"],
      summary: "Obtener nota médica",
      parameters: [
        { name: "patientId", in: "path", required: true, schema: { type: "string" } },
        { name: "noteId", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Nota médica" },
        401: { description: "No autorizado" },
        404: { description: "Nota no encontrada" },
      },
    },
    put: {
      tags: ["Medical Notes"],
      summary: "Actualizar nota médica",
      parameters: [
        { name: "patientId", in: "path", required: true, schema: { type: "string" } },
        { name: "noteId", in: "path", required: true, schema: { type: "string" } },
      ],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MedicalNoteInput" } } } },
      responses: {
        200: { description: "Nota actualizada" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const prescriptionPaths: OpenAPIV3.PathsObject = {
  "/api/prescriptions": {
    get: {
      tags: ["Prescriptions"],
      summary: "Listar recetas",
      parameters: [
        { name: "patientId", in: "query", schema: { type: "string" } },
        { name: "doctorId", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Lista de recetas" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Prescriptions"],
      summary: "Crear receta",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PrescriptionInput" },
            example: {
              patientId: "pat_123",
              doctorId: "user_456",
              appointmentId: "app_123",
              medications: [
                { name: "Paracetamol", dosage: "500mg", frequency: "Cada 6 horas", duration: "5 días", route: "ORAL" },
              ],
              instructions: "Tomar con alimentos",
              validDays: 30,
            },
          },
        },
      },
      responses: {
        201: { description: "Receta creada" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/prescriptions/{id}": {
    get: {
      tags: ["Prescriptions"],
      summary: "Obtener receta",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Datos de la receta" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const labOrderPaths: OpenAPIV3.PathsObject = {
  "/api/lab-orders": {
    get: {
      tags: ["Lab Orders"],
      summary: "Listar órdenes de laboratorio",
      parameters: [
        { name: "patientId", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Lista de órdenes" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Lab Orders"],
      summary: "Crear orden de laboratorio",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LabOrderInput" },
            example: {
              patientId: "pat_123",
              doctorId: "user_456",
              tests: ["Biometria hematica", "Quimica sanguinea"],
              priority: "ROUTINE",
              clinicalNotes: "Control rutinario",
            },
          },
        },
      },
      responses: {
        201: { description: "Orden creada" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/lab-orders/{id}": {
    get: {
      tags: ["Lab Orders"],
      summary: "Obtener orden de laboratorio",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Orden de laboratorio" },
        401: { description: "No autorizado" },
      },
    },
    put: {
      tags: ["Lab Orders"],
      summary: "Actualizar orden de laboratorio",
      description: "Actualiza status y resultados de la orden",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["PENDING", "COLLECTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
                results: { type: "object", description: "Resultados del laboratorio" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Orden actualizada" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const imagingOrderPaths: OpenAPIV3.PathsObject = {
  "/api/imaging-orders": {
    get: {
      tags: ["Imaging Orders"],
      summary: "Listar órdenes de imagenología",
      parameters: [
        { name: "patientId", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
      ],
      responses: {
        200: { description: "Lista de órdenes" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Imaging Orders"],
      summary: "Crear orden de imagenología",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ImagingOrderInput" },
            example: {
              patientId: "pat_123",
              doctorId: "user_456",
              studyType: "XRAY",
              description: "Radiografia de torax",
              priority: "ROUTINE",
            },
          },
        },
      },
      responses: {
        201: { description: "Orden creada" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/imaging-orders/{id}": {
    get: {
      tags: ["Imaging Orders"],
      summary: "Obtener orden de imagenología",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Orden de imagenología" },
        401: { description: "No autorizado" },
      },
    },
    put: {
      tags: ["Imaging Orders"],
      summary: "Actualizar orden de imagenología",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                status: { type: "string", enum: ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
                findings: { type: "string" },
                impression: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Orden actualizada" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const billingPaths: OpenAPIV3.PathsObject = {
  "/api/billing/invoices": {
    get: {
      tags: ["Billing"],
      summary: "Listar facturas",
      parameters: [
        { name: "patientId", in: "query", schema: { type: "string" } },
        { name: "status", in: "query", schema: { type: "string" } },
        { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
        { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
      ],
      responses: {
        200: { description: "Lista de facturas" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Billing"],
      summary: "Crear factura",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/InvoiceInput" },
            example: {
              patientId: "pat_123",
              items: [{ description: "Consulta medica", quantity: 1, unitPrice: 50000 }],
              issueDate: "2024-01-15",
            },
          },
        },
      },
      responses: {
        201: { description: "Factura creada" },
        400: { description: "Error de validación" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/billing/invoices/{id}": {
    get: {
      tags: ["Billing"],
      summary: "Obtener factura",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Factura" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/billing/invoices/{id}/pay": {
    post: {
      tags: ["Billing"],
      summary: "Registrar pago",
      description: "Registra un pago para una factura",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/PaymentInput" },
            example: { amount: 50000, method: "CARD", reference: "REF123" },
          },
        },
      },
      responses: {
        201: { description: "Pago registrado" },
        400: { description: "Monto mayor al saldo" },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const dashboardPaths: OpenAPIV3.PathsObject = {
  "/api/dashboard/stats": {
    get: {
      tags: ["Dashboard"],
      summary: "Estadísticas del dashboard",
      description: "Retorna KPIs y estadísticas de la clínica",
      responses: {
        200: {
          description: "Estadísticas",
          content: {
            "application/json": {
              example: {
                totalPatients: 150,
                appointmentsToday: 12,
                totalMedicalNotes: 450,
                monthlyRevenue: 15000000,
                pendingAppointments: 8,
              },
            },
          },
        },
        401: { description: "No autorizado" },
      },
    },
  },
}

export const settingsPaths: OpenAPIV3.PathsObject = {
  "/api/settings/clinic": {
    get: {
      tags: ["Settings"],
      summary: "Obtener datos de la clínica",
      responses: {
        200: { description: "Datos de la clínica", content: { "application/json": { example: { id: "clinic_1", name: "Clinica Medica", rfc: "XAXX010101000" } } } },
        401: { description: "No autorizado" },
      },
    },
    put: {
      tags: ["Settings"],
      summary: "Actualizar datos de la clínica",
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: "#/components/schemas/ClinicInput" } } },
      },
      responses: {
        200: { description: "Clínica actualizada" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/settings/doctors": {
    get: {
      tags: ["Settings"],
      summary: "Listar doctores de la clínica",
      responses: {
        200: { description: "Lista de doctores" },
        401: { description: "No autorizado" },
      },
    },
  },
  "/api/settings/team": {
    get: {
      tags: ["Settings"],
      summary: "Listar equipo de la clínica",
      description: "Retorna todos los usuarios de la clínica con sus roles",
      responses: {
        200: { description: "Equipo de la clínica" },
        401: { description: "No autorizado" },
      },
    },
    post: {
      tags: ["Settings"],
      summary: "Invitar usuario a la clínica",
      description: "Envía invitación por email para unirse a la clínica",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                email: { type: "string", format: "email" },
                role: { type: "string", enum: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"] },
              },
              required: ["email", "role"],
            },
          },
        },
      },
      responses: {
        201: { description: "Invitación enviada" },
        400: { description: "Email ya registrado" },
        401: { description: "No autorizado" },
      },
    },
  },
}
