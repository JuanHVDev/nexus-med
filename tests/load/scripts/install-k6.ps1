# Script para instalar k6 en Windows

# Verificar si ya está instalado
if (Get-Command k6 -ErrorAction SilentlyContinue) {
    Write-Host "k6 ya está instalado" -ForegroundColor Green
    k6 version
    exit 0
}

Write-Host "Instalando k6..." -ForegroundColor Yellow

# Opción 1: Chocolatey
if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "Instalando con Chocolatey..." -ForegroundColor Cyan
    choco install k6 -y
} 
# Opción 2: Descargar binario directamente
else {
    Write-Host "Descargando binario de k6..." -ForegroundColor Cyan
    
    $version = "0.55.0"
    $url = "https://github.com/grafana/k6/releases/download/v$version/k6-$version-windows-amd64.zip"
    $tempFile = "$env:TEMP\k6.zip"
    
    Invoke-WebRequest -Uri $url -OutFile $tempFile -UseBasicParsing
    
    # Extraer
    Expand-Archive -Path $tempFile -DestinationPath "$env:PROGRAMFILES\k6" -Force
    
    # Agregar al PATH
    $path = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($path -notlike "*k6*") {
        [Environment]::SetEnvironmentVariable(
            "PATH", 
            "$path;$env:PROGRAMFILES\k6", 
            "Machine"
        )
    }
    
    Remove-Item $tempFile -Force
}

Write-Host "Instalación completada!" -ForegroundColor Green
k6 version
