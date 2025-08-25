# Script de PowerShell para construir y desplegar el bot de WhatsApp INTED

Write-Host "🐳 Construyendo imagen Docker para INTED WhatsApp Bot..." -ForegroundColor Cyan

# Verificar que Docker esté ejecutándose
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Error: Docker no está ejecutándose" -ForegroundColor Red
    Write-Host "Por favor, inicia Docker Desktop y vuelve a intentar" -ForegroundColor Yellow
    exit 1
}

# Construir la imagen
Write-Host "📦 Construyendo imagen..." -ForegroundColor Yellow
docker build -t inted-whatsapp-bot:latest .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imagen construida exitosamente" -ForegroundColor Green
    Write-Host "📋 Información de la imagen:" -ForegroundColor Cyan
    docker images inted-whatsapp-bot:latest
    
    Write-Host ""
    Write-Host "🚀 Para ejecutar el contenedor:" -ForegroundColor Green
    Write-Host "   docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Para acceder al panel:" -ForegroundColor Green
    Write-Host "   http://localhost:3000" -ForegroundColor White
    Write-Host "   Usuario: admin" -ForegroundColor White
    Write-Host "   Contraseña: inted2025" -ForegroundColor White
} else {
    Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
    exit 1
}