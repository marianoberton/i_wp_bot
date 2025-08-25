# Manual de Usuario - Bot de WhatsApp para Inted

## Descripción General

Este bot de WhatsApp está diseñado para automatizar las consultas iniciales de clientes potenciales de Inted, capturando información de contacto y derivando conversaciones a representantes humanos cuando sea necesario.

## Funcionalidades del Bot

### 1. Menú Principal
El bot presenta tres opciones principales a los usuarios:
- **Opción 1**: Licitaciones
- **Opción 2**: Proyectos Constructivos  
- **Opción 3**: Hablar con un representante

### 2. Flujos de Conversación

#### Flujo de Licitaciones
1. El bot presenta información sobre consultoría en licitaciones
2. Incluye enlace: https://www.inted.com.ar/consultoria-licitaciones
3. Pregunta si desea hablar con un representante
4. Si acepta, captura: nombre, email y consulta
5. Confirma recepción y pasa a modo humano

#### Flujo de Proyectos Constructivos
1. El bot presenta información sobre proyectos constructivos
2. Incluye enlace: https://www.inted.com.ar/proyectos-constructivos
3. Pregunta si desea hablar con un representante
4. Si acepta, captura: nombre, email y consulta
5. Confirma recepción y pasa a modo humano

#### Flujo de Representante Directo
1. Verifica horario de atención (Lunes a Viernes, 09:00 a 18:00)
2. Informa si está dentro o fuera del horario
3. Captura: nombre, email y consulta breve
4. Confirma recepción y pasa a modo humano

### 3. Modo Humano
Cuando un usuario completa cualquier flujo, el bot:
- Deja de responder automáticamente
- Permite que un representante humano tome control de la conversación
- Mantiene el historial de la información capturada

## Características de Seguridad

### Validación de Datos
- **Emails**: Validación de formato correcto
- **Nombres**: Entre 2 y 50 caracteres
- **Consultas**: Mínimo 5-10 caracteres según el flujo
- **Sanitización**: Limpieza automática de caracteres especiales

### Rate Limiting
- Máximo 10 mensajes por usuario cada 15 minutos
- Previene spam y uso abusivo

### Logging Estructurado
- Registro detallado de todas las interacciones
- Logs almacenados en la carpeta `/logs`
- Información de errores y actividad del sistema

## Comandos de Administrador

### Números Autorizados
Solo los números definidos en `ADMIN_NUMBERS` pueden usar estos comandos:

### Comandos Disponibles
- `/reset` - Reinicia tu propio estado de conversación
- `/reset <número>` - Reinicia el estado de otro usuario
- `/stats` - Muestra estadísticas del bot

## Configuración de Horarios

### Horario de Atención
- **Días**: Lunes a Viernes
- **Horario**: 09:00 a 18:00
- **Zona horaria**: America/Argentina/Buenos_Aires
- **Feriados**: Configurables en el código

## Manejo de Errores

### Recuperación Automática
- Try-catch en todas las funciones críticas
- Mensajes de error informativos para usuarios
- Logging detallado para diagnóstico

### Validación Robusta
- Verificación de horarios de negocio
- Validación de entrada de datos
- Manejo de errores de conexión

## Archivos de Log

### Ubicación
- Carpeta: `/logs`
- `combined.log` - Todos los eventos
- `error.log` - Solo errores

### Información Registrada
- Mensajes recibidos y enviados
- Validaciones de datos
- Errores del sistema
- Cambios de estado de usuarios

## Mantenimiento

### Inicio del Bot
```bash
node index.js
```

### Con PM2 (Producción)
```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
```

### Verificación de Estado
- El bot genera un código QR al iniciar
- Debe escanearse con WhatsApp Web
- Logs confirman conexión exitosa

## Consideraciones Importantes

### Para Representantes Humanos
1. Cuando un usuario está en "modo humano", el bot NO responde
2. El representante debe tomar control manual de la conversación
3. La información capturada está disponible en los logs

### Reinicio de Usuarios
- Use `/reset <número>` si un usuario queda "atascado"
- Esto permite que vuelva a interactuar con el bot

### Monitoreo
- Revise logs regularmente para detectar problemas
- Use `/stats` para ver actividad general
- Verifique que el bot responda al código QR

## Soporte Técnico

Para problemas técnicos:
1. Revise los logs de error
2. Verifique la conexión a internet
3. Reinicie el bot si es necesario
4. Contacte al desarrollador con información de logs específicos

---

**Nota**: Este manual está diseñado para el personal de Inted que administrará y monitoreará el bot de WhatsApp.