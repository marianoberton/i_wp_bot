const express = require('express');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { resetUserState, getAllStates, getStats, getHistory, resetAllStates, HUMAN_MODE } = require('../bot/conversation-state');

class WebServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || process.env.WEB_PORT || 3000;
        this.username = options.username || process.env.WEB_USERNAME || 'admin';
        this.password = options.password || process.env.WEB_PASSWORD || 'inted2025';
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        // Configuración de seguridad
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net"],
                    scriptSrcAttr: ["'unsafe-inline'"],
                    fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
                }
            }
        }));
        
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Autenticación básica
        this.app.use(basicAuth({
            users: { [this.username]: this.password },
            challenge: true,
            realm: 'Panel de Control WhatsApp Bot'
        }));
    }
    
    setupRoutes() {
        // Ruta principal - Panel de control
        this.app.get('/', (req, res) => {
            try {
                const templatePath = path.join(__dirname, 'panel-template.html');
                let html = fs.readFileSync(templatePath, 'utf8');
                
                const conversationState = getAllStates();
                const stats = getStats();
                
                // Generar lista de usuarios
                const usersList = Object.entries(conversationState).map(([chatId, state]) => {
                    const estadoTexto = state.step === HUMAN_MODE ? 'Modo Humano' : 'Paso ' + state.step;
                    const temaTexto = state.topic ? '| Tema: ' + state.topic : '';
                    const nombreTexto = state.nombre ? '| Nombre: ' + state.nombre : '';
                    
                    return `
                        <div class="user-item p-3 mb-2 bg-white rounded shadow-sm ${state.step === HUMAN_MODE ? 'human-mode' : ''}">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${chatId}</strong>
                                    <br>
                                    <small class="text-muted">
                                        Estado: ${estadoTexto}
                                        ${temaTexto}
                                        ${nombreTexto}
                                    </small>
                                </div>
                                <button class="btn btn-sm btn-outline-danger btn-reset-user" data-chat-id="${chatId}">
                                    <i class="bi bi-arrow-clockwise"></i> Reset
                                </button>
                            </div>
                        </div>`;
                }).join('');
                
                // Reemplazar placeholders
                html = html.replace('{{totalUsers}}', stats.totalUsers);
                html = html.replace('{{humanModeUsers}}', stats.humanModeUsers);
                html = html.replace('{{activeUsers}}', stats.activeUsers);
                html = html.replace('{{usersList}}', usersList || '<p class="text-muted text-center">No hay usuarios registrados</p>');
                
                res.send(html);
            } catch (error) {
                logger.error('Error al cargar panel de control', { error: error.message });
                res.status(500).send('Error interno del servidor');
            }
        });
        
        // API - Obtener estadísticas
        this.app.get('/api/stats', (req, res) => {
            console.log('[DEBUG] GET /api/stats - Solicitud recibida');
            
            try {
                const stats = getStats();
                console.log('[DEBUG] Estadísticas obtenidas:', stats);
                res.json(stats);
            } catch (error) {
                console.error('[DEBUG] Error en /api/stats:', error);
                logger.error('Error al obtener estadísticas', { error: error.message });
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
        
        // API - Reset usuario individual
        this.app.post('/api/reset-user', (req, res) => {
            console.log('[DEBUG] POST /api/reset-user - Solicitud recibida');
            console.log('[DEBUG] Body recibido:', req.body);
            
            try {
                const { chatId } = req.body;
                console.log('[DEBUG] ChatId extraído:', chatId);
                
                if (!chatId) {
                    console.log('[DEBUG] ChatId no proporcionado');
                    return res.status(400).json({ error: 'ChatId es requerido' });
                }
                
                console.log('[DEBUG] Llamando a resetUserState');
                const result = resetUserState(chatId);
                console.log('[DEBUG] Resultado de resetUserState:', result);
                
                if (result) {
                    console.log('[DEBUG] Reset exitoso, enviando respuesta');
                    res.json({ success: true, message: 'Usuario reseteado correctamente' });
                } else {
                    console.log('[DEBUG] Reset falló, usuario no encontrado');
                    res.status(404).json({ error: 'Usuario no encontrado' });
                }
            } catch (error) {
                console.error('[DEBUG] Error en /api/reset-user:', error);
                logger.error('Error al resetear usuario', { error: error.message });
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
        
        // API - Reset todos los usuarios
        this.app.post('/api/reset-all', (req, res) => {
            console.log('[DEBUG] POST /api/reset-all - Solicitud recibida');
            
            try {
                const resetCount = resetAllStates();
                console.log('[DEBUG] Usuarios reseteados exitosamente:', resetCount);
                
                res.json({ 
                    success: true, 
                    message: `Todos los usuarios han sido reseteados (${resetCount} usuarios guardados en historial)`, 
                    resetCount 
                });
            } catch (error) {
                console.error('[DEBUG] Error en /api/reset-all:', error);
                logger.error('Error al resetear todos los usuarios', { error: error.message });
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
        
        // API - Obtener historial
        this.app.get('/api/history', (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 50;
                const history = getHistory(limit);
                res.json({ success: true, history });
            } catch (error) {
                logger.error('Error al obtener historial', { error: error.message });
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
        
        // API - Ver logs
        this.app.get('/api/logs', (req, res) => {
            try {
                const logPath = './logs/combined.log';
                if (fs.existsSync(logPath)) {
                    const logs = fs.readFileSync(logPath, 'utf8');
                    res.type('text/plain').send(logs);
                } else {
                    res.status(404).send('Archivo de logs no encontrado');
                }
            } catch (error) {
                logger.error('Error al leer logs', { error: error.message });
                res.status(500).send('Error al leer logs');
            }
        });
    }
    
    start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, () => {
                    logger.info(`Panel web iniciado en puerto ${this.port}`);
                    console.log(`\n🌐 Panel de Control disponible en: http://localhost:${this.port}`);
                    console.log(`👤 Usuario: ${this.username}`);
                    console.log(`🔑 Contraseña: ${this.password}\n`);
                    resolve(this.server);
                });
            } catch (error) {
                logger.error('Error al iniciar servidor web', { error: error.message });
                reject(error);
            }
        });
    }
    
    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger.info('Servidor web detenido');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = WebServer;