# 🚀 Deployment en EasyPanel - Bot WhatsApp INTED

## ⚡ Configuración Rápida

### 1. Usar Configuración Específica para EasyPanel

Este proyecto incluye una configuración optimizada para EasyPanel que evita conflictos comunes:

```bash
# Usar el archivo específico para EasyPanel
docker-compose -f docker-compose.easypanel.yml up -d
```

### 2. Variables de Entorno Requeridas

Configura estas variables en el panel de EasyPanel:

```env
# Credenciales del panel web (CAMBIAR por seguridad)
WEB_USERNAME=admin
WEB_PASSWORD=tu-password-muy-segura

# Configuración de WhatsApp
WHATSAPP_SESSION_NAME=inted-session
LOG_LEVEL=info
```

## 🔧 Diferencias con Docker Compose Estándar

| Característica | Docker Compose Estándar | EasyPanel Optimizado |
|---|---|---|
| **Container Name** | `inted-whatsapp-bot` | Sin nombre (auto-generado) |
| **Puertos** | `ports: 3000:3000` | `expose: 3000` (EasyPanel asigna) |
| **Volúmenes** | Bind mounts | Named volumes |
| **Recursos** | Sin límites | Límites configurados |

## 📁 Archivos de Configuración Disponibles

1. **`docker-compose.easypanel.yml`** ✅ **RECOMENDADO para EasyPanel**
   - Sin `container_name`
   - Sin `ports` (usa `expose`)
   - Volúmenes nombrados
   - Límites de recursos

2. **`easypanel-config.yml`** ✅ **Alternativa compatible**
   - Configuración similar optimizada
   - Incluye comentarios explicativos

3. **`docker-compose.yml`** ⚠️ **Para desarrollo local**
   - Puede causar conflictos en EasyPanel
   - Usa bind mounts y puertos fijos

## 🚀 Pasos de Deployment

### Paso 1: Clonar Repositorio
```bash
git clone https://github.com/marianoberton/i_wp_bot.git
cd i_wp_bot
```

### Paso 2: Configurar Variables
En el panel de EasyPanel, configura las variables de entorno mencionadas arriba.

### Paso 3: Deploy
```bash
# Usar configuración específica para EasyPanel
docker-compose -f docker-compose.easypanel.yml up -d
```

### Paso 4: Verificar
- EasyPanel asignará automáticamente una URL
- Accede a la aplicación usando la URL proporcionada
- Verifica los logs en el panel de EasyPanel

## 🔍 Troubleshooting

Si encuentras problemas, consulta el archivo `EASYPANEL_TROUBLESHOOTING.md` para soluciones detalladas.

### Problemas Comunes Resueltos

✅ **Puerto 3000 ya asignado** → Solucionado con `expose` en lugar de `ports`

✅ **Conflictos de container_name** → Eliminado el nombre fijo

✅ **Problemas de persistencia** → Volúmenes nombrados

✅ **Versión obsoleta de Docker Compose** → Eliminado `version`

## 📞 Soporte

Para problemas específicos de EasyPanel, revisa:
1. `EASYPANEL_TROUBLESHOOTING.md`
2. Logs en el panel de EasyPanel
3. Documentación oficial de EasyPanel

---

**¡Listo para usar en EasyPanel! 🎉**