'use client'
import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Plus, X, Save } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface HistoryPageProps {
  params: Promise<{ id: string }>
}

export default function PatientHistoryPage({ params }: HistoryPageProps) {
  const [patientId, setPatientId] = React.useState<string>('')

  React.useEffect(() => {
    params.then(p => setPatientId(p.id))
  }, [params])

  const queryClient = useQueryClient()

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}`).then(r => r.json()),
    enabled: !!patientId
  })

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}/history`).then(r => r.json()),
    enabled: !!patientId
  })

  const { data: contacts, isLoading: loadingContacts } = useQuery({
    queryKey: ['emergency-contacts', patientId],
    queryFn: () => fetch(`/api/patients/${patientId}/emergency-contacts`).then(r => r.json()),
    enabled: !!patientId
  })

  const updateHistoryMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/patients/${patientId}/history`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history'] })
      toast.success('Historial actualizado')
    },
    onError: () => toast.error('Error al actualizar historial')
  })

  const addContactMutation = useMutation({
    mutationFn: (data: any) => fetch(`/api/patients/${patientId}/emergency-contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-contacts'] })
      toast.success('Contacto agregado')
    },
    onError: () => toast.error('Error al agregar contacto')
  })

  const [newAllergy, setNewAllergy] = React.useState('')
  const [newMedication, setNewMedication] = React.useState('')
  const [newDisease, setNewDisease] = React.useState('')
  const [newSurgery, setNewSurgery] = React.useState('')

  const [newContact, setNewContact] = React.useState({ name: '', relation: '', phone: '', email: '', isPrimary: false })

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return
    const allergies = [...(history?.allergies || []), newAllergy.trim()]
    updateHistoryMutation.mutate({ allergies })
    setNewAllergy('')
  }

  const handleRemoveAllergy = (index: number) => {
    const allergies = (history?.allergies || []).filter((_: any, i: number) => i !== index)
    updateHistoryMutation.mutate({ allergies })
  }

  const handleAddMedication = () => {
    if (!newMedication.trim()) return
    const medications = [...(history?.currentMedications || []), newMedication.trim()]
    updateHistoryMutation.mutate({ currentMedications: medications })
    setNewMedication('')
  }

  const handleRemoveMedication = (index: number) => {
    const medications = (history?.currentMedications || []).filter((_: any, i: number) => i !== index)
    updateHistoryMutation.mutate({ currentMedications: medications })
  }

  const handleAddDisease = () => {
    if (!newDisease.trim()) return
    const diseases = [...(history?.chronicDiseases || []), newDisease.trim()]
    updateHistoryMutation.mutate({ chronicDiseases: diseases })
    setNewDisease('')
  }

  const handleRemoveDisease = (index: number) => {
    const diseases = (history?.chronicDiseases || []).filter((_: any, i: number) => i !== index)
    updateHistoryMutation.mutate({ chronicDiseases: diseases })
  }

  const handleAddSurgery = () => {
    if (!newSurgery.trim()) return
    const surgeries = [...(history?.surgeries || []), newSurgery.trim()]
    updateHistoryMutation.mutate({ surgeries })
    setNewSurgery('')
  }

  const handleRemoveSurgery = (index: number) => {
    const surgeries = (history?.surgeries || []).filter((_: any, i: number) => i !== index)
    updateHistoryMutation.mutate({ surgeries })
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.relation || !newContact.phone) {
      toast.error('Completa los campos requeridos')
      return
    }
    addContactMutation.mutate(newContact)
    setNewContact({ name: '', relation: '', phone: '', email: '', isPrimary: false })
  }

  const handleSaveField = (field: string, value: any) => {
    updateHistoryMutation.mutate({ [field]: value })
  }

  const isLoading = loadingPatient || loadingHistory || loadingContacts

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/patients/${patientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {patient?.lastName} {patient?.firstName} {patient?.middleName}
          </h1>
          <p className="text-muted-foreground">Historial Médico</p>
        </div>
      </div>

      <Tabs defaultValue="allergies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allergies">Alergias</TabsTrigger>
          <TabsTrigger value="medications">Medicamentos</TabsTrigger>
          <TabsTrigger value="antecedents">Antecedentes</TabsTrigger>
          <TabsTrigger value="habits">Hábitos</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>

        <TabsContent value="allergies">
          <Card>
            <CardHeader>
              <CardTitle>Alergias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nueva alergia..."
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
                />
                <Button onClick={handleAddAllergy}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(history?.allergies || []).map((allergy: string, index: number) => (
                  <div key={index} className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-1 rounded-full">
                    <span>{allergy}</span>
                    <button onClick={() => handleRemoveAllergy(index)} className="hover:text-red-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {(history?.allergies || []).length === 0 && (
                  <p className="text-muted-foreground">No hay alergias registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle>Medicamentos Actuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nuevo medicamento..."
                  value={newMedication}
                  onChange={(e) => setNewMedication(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMedication()}
                />
                <Button onClick={handleAddMedication}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(history?.currentMedications || []).map((med: string, index: number) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    <span>{med}</span>
                    <button onClick={() => handleRemoveMedication(index)} className="hover:text-blue-900">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {(history?.currentMedications || []).length === 0 && (
                  <p className="text-muted-foreground">No hay medicamentos registrados</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="antecedents">
          <Card>
            <CardHeader>
              <CardTitle>Antecedentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Enfermedades Crónicas</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva enfermedad..."
                    value={newDisease}
                    onChange={(e) => setNewDisease(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDisease()}
                  />
                  <Button onClick={handleAddDisease}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(history?.chronicDiseases || []).map((disease: string, index: number) => (
                    <div key={index} className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                      <span>{disease}</span>
                      <button onClick={() => handleRemoveDisease(index)} className="hover:text-yellow-900">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Cirugías</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva cirugía..."
                    value={newSurgery}
                    onChange={(e) => setNewSurgery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSurgery()}
                  />
                  <Button onClick={handleAddSurgery}><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(history?.surgeries || []).map((surgery: string, index: number) => (
                    <div key={index} className="flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                      <span>{surgery}</span>
                      <button onClick={() => handleRemoveSurgery(index)} className="hover:text-purple-900">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Antecedentes Familiares</h3>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-md"
                  placeholder="Describe los antecedentes familiares..."
                  defaultValue={history?.familyHistory || ''}
                  onBlur={(e) => handleSaveField('familyHistory', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits">
          <Card>
            <CardHeader>
              <CardTitle>Hábitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="smoking"
                  checked={history?.smoking || false}
                  onCheckedChange={(checked) => handleSaveField('smoking', checked)}
                />
                <Label htmlFor="smoking">Tabaquismo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="alcohol"
                  checked={history?.alcohol || false}
                  onCheckedChange={(checked) => handleSaveField('alcohol', checked)}
                />
                <Label htmlFor="alcohol">Consumo de alcohol</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="drugs"
                  checked={history?.drugs || false}
                  onCheckedChange={(checked) => handleSaveField('drugs', checked)}
                />
                <Label htmlFor="drugs">Uso de drogas</Label>
              </div>
              <div className="space-y-2">
                <Label>Ejercicio</Label>
                <Input
                  placeholder="Frecuencia de ejercicio..."
                  defaultValue={history?.exercise || ''}
                  onBlur={(e) => handleSaveField('exercise', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Dieta</Label>
                <Input
                  placeholder="Tipo de dieta..."
                  defaultValue={history?.diet || ''}
                  onBlur={(e) => handleSaveField('diet', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Contactos de Emergencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input placeholder="Nombre *" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                <Input placeholder="Parentesco *" value={newContact.relation} onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })} />
                <Input placeholder="Teléfono *" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                <Input placeholder="Email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
                <Button onClick={handleAddContact}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {(contacts || []).map((contact: any) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contact.name} {contact.isPrimary && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Primary</span>}</p>
                      <p className="text-sm text-muted-foreground">{contact.relation} - {contact.phone}</p>
                    </div>
                  </div>
                ))}
                {(contacts || []).length === 0 && (
                  <p className="text-muted-foreground">No hay contactos de emergencia</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
