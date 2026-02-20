import * as XLSX from 'xlsx'

interface SheetData {
  [key: string]: string | number | boolean | null | undefined
}

export function exportToExcel(data: SheetData[], filename: string) {
  // Crear libro de trabajo
  const wb = XLSX.utils.book_new()
  
  // Crear hoja de trabajo
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Ajustar anchos de columna automáticamente
  const colWidths = data.length > 0 
    ? Object.keys(data[0]).map((key) => ({
        wch: Math.max(
          key.length,
          ...data.map((row) => String(row[key as keyof typeof row] || '').length)
        ) + 2
      }))
    : []
  
  ws['!cols'] = colWidths
  
  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
  
  // Generar archivo
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportMultipleSheets(
  sheets: { name: string; data: SheetData[] }[],
  filename: string
) {
  const wb = XLSX.utils.book_new()
  
  sheets.forEach((sheet) => {
    const ws = XLSX.utils.json_to_sheet(sheet.data)
    
    // Ajustar anchos de columna
    const colWidths = sheet.data.length > 0
      ? Object.keys(sheet.data[0]).map((key) => ({
          wch: Math.max(
            key.length,
            ...sheet.data.map((row) => String(row[key as keyof typeof row] || '').length)
          ) + 2
        }))
      : []
    
    ws['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(wb, ws, sheet.name)
  })
  
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
