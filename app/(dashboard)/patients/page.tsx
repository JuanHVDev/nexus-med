import { PatientList } from '@/components/patients/patient-list'
export default function PatientsPage()
{
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pacientes</h1>
        <p className="text-muted-foreground">Gestiona los pacientes de tu clínica</p>
      </div>
      <PatientList />
    </div>
  )
}