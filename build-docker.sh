#!/bin/bash

# Script para construir y desplegar el bot de WhatsApp INTED

echo "🐳 Construyendo imagen Docker para INTED WhatsApp Bot..."

# Verificar que Docker esté ejecutándose
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker no está ejecutándose"
    echo "Por favor, inicia Docker Desktop y vuelve a intentar"
    exit 1
fi

# Construir la imagen
echo "📦 Construyendo imagen..."
docker build -t inted-whatsapp-bot:latest .

if [ $? -eq 0 ]; then
    echo "✅ Imagen construida exitosamente"
    echo "📋 Información de la imagen:"
    docker images inted-whatsapp-bot:latest
    
    echo ""
    echo "🚀 Para ejecutar el contenedor:"
    echo "   docker-compose up -d"
    echo ""
    echo "🌐 Para acceder al panel:"
    echo "   http://localhost:3000"
    echo "   Usuario: admin"
    echo "   Contraseña: inted2025"
else
    echo "❌ Error al construir la imagen"
    exit 1
fi