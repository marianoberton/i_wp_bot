/**
 * WhatsApp Bot INTED - Punto de entrada principal
 * Nueva arquitectura modular
 */

const logger = require('./utils/logger');
const WebServer = require('./web/server');
const { createWhatsAppClient } = require('./bot/whatsapp-client');

// Configuración
const config = {
    web: {
        port: process.env.WEB_PORT || 3000,
        username: process.env.WEB_USERNAME || 'admin',
        password: process.env.WEB_PASSWORD || 'inted2025'
    }
};

/**
 * Función principal para inicializar la aplicación
 */
async function main() {
    try {
        logger.info('Iniciando WhatsApp Bot INTED...');
        
        // Inicializar servidor web
        logger.info('Iniciando servidor web...');
        const webServer = new WebServer(config.web);
        await webServer.start();
        
        // Inicializar cliente de WhatsApp
        logger.info('Iniciando cliente de WhatsApp...');
        const whatsappClient = createWhatsAppClient();
        whatsappClient.initialize();
        
        // Manejo de señales para cierre limpio
        process.on('SIGINT', async () => {
            logger.info('Recibida señal SIGINT, cerrando aplicación...');
            
            try {
                await webServer.stop();
                await whatsappClient.destroy();
                logger.info('Aplicación cerrada correctamente');
                process.exit(0);
            } catch (error) {
                logger.error('Error al cerrar aplicación', { error: error.message });
                process.exit(1);
            }
        });
        
        process.on('SIGTERM', async () => {
            logger.info('Recibida señal SIGTERM, cerrando aplicación...');
            
            try {
                await webServer.stop();
                await whatsappClient.destroy();
                logger.info('Aplicación cerrada correctamente');
                process.exit(0);
            } catch (error) {
                logger.error('Error al cerrar aplicación', { error: error.message });
                process.exit(1);
            }
        });
        
        logger.info('WhatsApp Bot INTED iniciado correctamente');
        
    } catch (error) {
        logger.error('Error fatal al inicializar aplicación', { error: error.message });
        process.exit(1);
    }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    logger.error('Excepción no capturada', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Promesa rechazada no manejada', { reason, promise });
    process.exit(1);
});

// Iniciar aplicación
if (require.main === module) {
    main();
}

module.exports = { main };
