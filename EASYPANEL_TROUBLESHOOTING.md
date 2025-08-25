# Solución de Problemas en EasyPanel - INTED WhatsApp Bot

## 🚨 Errores Comunes y Soluciones

### Error: "Port is already allocated"

**Problema:** El puerto 3000 ya está siendo usado por otro servicio.

**Solución:**
1. En EasyPanel, ve a la configuración de variables de entorno
2. Agrega estas variables:
   ```
   EXTERNAL_PORT=3001
   PORT=3000
   ```
3. Esto hará que el contenedor use el puerto 3000 internamente pero se exponga en el puerto 3001

### Warning: "version is obsolete"

**Problema:** Docker Compose muestra advertencia sobre versión obsoleta.

**Solución:** ✅ **Ya solucionado** - Se removió la línea `version: '3.8'` de todos los archivos de configuración.

## 📋 Configuración Recomendada para EasyPanel

### Variables de Entorno
```bash
# Puerto (usar puerto diferente si 3000 está ocupado)
EXTERNAL_PORT=3001
PORT=3000

# Entorno
NODE_ENV=production

# Credenciales del panel (CAMBIAR por seguridad)
WEB_USERNAME=admin
WEB_PASSWORD=tu-password-muy-segura

# Opcional: Configuración de WhatsApp
WHATSAPP_SESSION_NAME=inted-session

# Opcional: Logs
LOG_LEVEL=info
LOG_FILE=combined.log
```

### Configuración de Puertos
- **Puerto interno del contenedor:** 3000 (no cambiar)
- **Puerto externo (EasyPanel):** 3001 (o cualquier puerto disponible)
- **URL de acceso:** `https://tu-dominio.com:3001` o el puerto que configures

## 🔧 Pasos de Deployment en EasyPanel

1. **Crear nueva aplicación:**
   - Tipo: Docker Compose
   - Repositorio: `https://github.com/marianoberton/i_wp_bot.git`

2. **Configurar variables de entorno:**
   ```
   EXTERNAL_PORT=3001
   PORT=3000
   NODE_ENV=production
   WEB_USERNAME=admin
   WEB_PASSWORD=tu-password-segura
   ```

3. **Configurar volúmenes persistentes:**
   - `/app/data` → Para datos de conversaciones
   - `/app/logs` → Para archivos de log
   - `/app/.wwebjs_auth` → Para sesión de WhatsApp

4. **Deploy:**
   - EasyPanel usará automáticamente el `docker-compose.yml`
   - El puerto se configurará automáticamente según `EXTERNAL_PORT`

## 🐛 Debugging

### Ver logs del contenedor
```bash
docker logs inted-whatsapp-bot
```

### Verificar puertos en uso
```bash
netstat -tulpn | grep :3000
```

### Acceder al contenedor
```bash
docker exec -it inted-whatsapp-bot /bin/sh
```

## 📞 URLs de Acceso

- **Panel de Control:** `http://tu-servidor:EXTERNAL_PORT`
- **Health Check:** `http://tu-servidor:EXTERNAL_PORT/health`
- **API Status:** `http://tu-servidor:EXTERNAL_PORT/api/status`

## 🔒 Seguridad

1. **Cambiar credenciales por defecto:**
   ```
   WEB_USERNAME=tu-usuario-personalizado
   WEB_PASSWORD=password-muy-segura-123!
   ```

2. **Usar HTTPS en producción:**
   - Configurar SSL/TLS en EasyPanel
   - Usar certificados Let's Encrypt

3. **Restringir acceso por IP (opcional):**
   - Configurar firewall en EasyPanel
   - Limitar acceso solo a IPs autorizadas

## 📊 Monitoreo

### Health Check
El contenedor incluye un health check automático que verifica:
- Que el servidor web responda en el puerto configurado
- Que la aplicación esté funcionando correctamente

### Logs
- Los logs se guardan en `/app/logs/combined.log`
- Errores en `/app/logs/error.log`
- Accesibles desde EasyPanel o mediante volúmenes

## 🆘 Soporte

Si continúas teniendo problemas:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs del contenedor
3. Asegúrate de que el puerto externo esté disponible
4. Verifica que los volúmenes estén correctamente montados