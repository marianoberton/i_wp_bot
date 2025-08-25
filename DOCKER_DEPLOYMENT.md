# 🐳 Despliegue con Docker - WhatsApp Bot INTED

## 📋 Requisitos Previos

- Docker y Docker Compose instalados
- Puerto 3000 disponible
- Al menos 1GB de RAM disponible
- Conexión a internet estable

## 🚀 Despliegue Local con Docker

### 1. Preparar el entorno

```bash
# Clonar o copiar el proyecto
cd whatsapp-bot

# Copiar variables de entorno (opcional)
cp .env.example .env

# Editar variables si es necesario
nano .env
```

### 2. Construir y ejecutar

```bash
# Construir y ejecutar en segundo plano
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### 3. Acceder al panel

- **URL**: http://localhost:3000
- **Usuario**: admin (o el configurado en .env)
- **Contraseña**: inted2025 (o la configurada en .env)

## 🌐 Despliegue en EasyPanel

### Método 1: Usando Docker Compose

1. **Crear nueva aplicación en EasyPanel**
   - Tipo: Docker Compose
   - Nombre: `inted-whatsapp-bot`

2. **Configurar docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     whatsapp-bot:
       image: tu-usuario/inted-whatsapp-bot:latest
       restart: unless-stopped
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - WEB_USERNAME=admin
         - WEB_PASSWORD=tu-password-segura
       volumes:
         - whatsapp_data:/app/data
         - whatsapp_logs:/app/logs
         - whatsapp_session:/app/.wwebjs_auth
   
   volumes:
     whatsapp_data:
     whatsapp_logs:
     whatsapp_session:
   ```

3. **Variables de entorno en EasyPanel**
   ```
   NODE_ENV=production
   PORT=3000
   WEB_USERNAME=admin
   WEB_PASSWORD=tu-password-muy-segura
   ```

### Método 2: Usando Dockerfile

1. **Subir código a repositorio Git**
   ```bash
   git add .
   git commit -m "Preparar para despliegue Docker"
   git push origin main
   ```

2. **Crear aplicación en EasyPanel**
   - Tipo: Git Repository
   - URL del repositorio
   - Branch: main
   - Build Command: `docker build -t whatsapp-bot .`
   - Start Command: `docker run -p 3000:3000 whatsapp-bot`

## 🔧 Configuración Avanzada

### Variables de Entorno Importantes

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor web | `3000` |
| `WEB_USERNAME` | Usuario del panel | `admin` |
| `WEB_PASSWORD` | Contraseña del panel | `inted2025` |
| `NODE_ENV` | Entorno de ejecución | `production` |

### Volúmenes Persistentes

- `/app/data` - Estados de conversación y historial
- `/app/logs` - Archivos de log
- `/app/.wwebjs_auth` - Sesión de WhatsApp

### Puertos

- `3000` - Panel de control web

## 🛠️ Comandos Útiles

```bash
# Ver logs
docker-compose logs -f whatsapp-bot

# Reiniciar servicio
docker-compose restart whatsapp-bot

# Actualizar imagen
docker-compose pull
docker-compose up -d

# Acceder al contenedor
docker-compose exec whatsapp-bot sh

# Ver estado de salud
docker-compose ps
```

## 🔍 Solución de Problemas

### El bot no se conecta a WhatsApp

1. Verificar logs: `docker-compose logs whatsapp-bot`
2. Asegurar que el contenedor tenga acceso a internet
3. Verificar que los volúmenes estén montados correctamente

### Panel web no accesible

1. Verificar que el puerto 3000 esté expuesto
2. Comprobar firewall y configuración de red
3. Verificar variables de entorno `WEB_USERNAME` y `WEB_PASSWORD`

### Datos se pierden al reiniciar

1. Verificar que los volúmenes estén configurados
2. Comprobar permisos de escritura en directorios
3. Verificar que `/app/data` esté montado correctamente

## 📊 Monitoreo

### Health Check

El contenedor incluye un health check que verifica:
- Disponibilidad del servidor web en puerto 3000
- Respuesta HTTP correcta
- Intervalo de verificación: 30 segundos

### Logs

Todos los logs se guardan en:
- Contenedor: `/app/logs/`
- Host: `./logs/` (si está montado)

## 🔒 Seguridad

### Recomendaciones

1. **Cambiar credenciales por defecto**
   ```bash
   WEB_USERNAME=tu-usuario
   WEB_PASSWORD=password-muy-segura-123
   ```

2. **Usar HTTPS en producción**
   - Configurar proxy reverso (nginx, traefik)
   - Certificado SSL/TLS

3. **Restringir acceso por IP**
   - Configurar firewall
   - Usar VPN si es necesario

4. **Backup regular**
   ```bash
   # Backup de datos
   docker cp inted-whatsapp-bot:/app/data ./backup-data-$(date +%Y%m%d)
   ```

## 📞 Soporte

Si tienes problemas con el despliegue:

1. Revisar logs detalladamente
2. Verificar configuración de red y puertos
3. Comprobar recursos disponibles (RAM, CPU)
4. Verificar conectividad a internet

---

**¡El bot está listo para producción! 🚀**