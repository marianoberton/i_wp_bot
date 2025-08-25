const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const { isValidEmail, isValidText, sanitizeText } = require('../utils/validators');
const { HUMAN_MODE, getUserState, setUserState, resetUserState } = require('./conversation-state');

// Configuración de rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 300000; // 5 minutos
const RATE_LIMIT_MAX = 20;

// Configuración de horarios de negocio
const BUSINESS_HOURS = {
  timezone: 'America/Argentina/Buenos_Aires',
  weekdays: [1, 2, 3, 4, 5], // Lunes a Viernes
  startHour: 9,
  endHour: 18,
  holidays: []
};

// Números de administrador
const ADMIN_NUMBERS = [
  '5491132766709@c.us'
];

/**
 * Verifica si un usuario es administrador
 * @param {string} chatId - ID del chat
 * @returns {boolean} - True si es admin
 */
function isAdmin(chatId) {
  return ADMIN_NUMBERS.includes(chatId);
}

/**
 * Verifica rate limiting
 * @param {string} chatId - ID del chat
 * @returns {boolean} - True si está dentro del límite
 */
function checkRateLimit(chatId) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(chatId) || [];
    
    const validRequests = userRequests.filter(timestamp => 
        now - timestamp < RATE_LIMIT_WINDOW
    );
    
    if (validRequests.length >= RATE_LIMIT_MAX) {
        return false;
    }
    
    validRequests.push(now);
    rateLimitMap.set(chatId, validRequests);
    return true;
}

/**
 * Verifica si está dentro del horario de negocio
 * @returns {boolean} - True si está dentro del horario
 */
function isWithinBusinessHours() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    if (!BUSINESS_HOURS.weekdays.includes(day)) {
        return false;
    }
    
    if (hour < BUSINESS_HOURS.startHour || hour >= BUSINESS_HOURS.endHour) {
        return false;
    }
    
    const today = now.toISOString().split('T')[0];
    if (BUSINESS_HOURS.holidays.includes(today)) {
        return false;
    }
    
    return true;
}

/**
 * Envía el menú principal
 * @param {object} message - Mensaje de WhatsApp
 */
async function enviarMenu(message) {
    const menuText = `¡Hola! Bienvenido(a) a Inted.\n` +
        `Por favor, elige una de las siguientes opciones (escribe el número):\n\n` +
        `1) Licitaciones\n` +
        `2) Proyectos Constructivos\n` +
        `3) Hablar con un representante\n\n` +
        `Si en cualquier momento deseas volver al menú, escribe "menu".`;
    
    const chat = await message.getChat();
    await chat.sendMessage(menuText);
}

/**
 * Crea y configura el cliente de WhatsApp
 * @returns {Client} - Cliente configurado
 */
function createWhatsAppClient() {
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './session'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
            browserWSEndpoint: null
        },
        webVersionCache: {
            type: 'none'
        }
    });

    // Event listeners
    client.on('qr', (qr) => {
        console.log('\n=== CÓDIGO QR PARA WHATSAPP ===');
        console.log('Escanea este código con tu teléfono:');
        console.log('WhatsApp > Configuración > Dispositivos vinculados > Vincular dispositivo\n');
        
        // Usar qrcode con opciones más compactas
        QRCode.toString(qr, {
            type: 'terminal',
            small: true,
            errorCorrectionLevel: 'L',
            width: 40  // Ancho más pequeño
        }, (err, qrString) => {
            if (err) {
                console.error('Error generando QR:', err);
                // Fallback a qrcode-terminal
                qrcode.setErrorLevel('L');
                qrcode.generate(qr, { small: true });
            } else {
                console.log(qrString);
            }
        });
        
        console.log('\n=== ESCANEA CON TU TELÉFONO ===\n');
        logger.info('Código QR generado para autenticación');
    });

    client.on('ready', () => {
        logger.info('Cliente de WhatsApp conectado y listo');
        console.log('¡El cliente de WhatsApp está listo!');
        
        // Agregar usuario de prueba automáticamente
        const testUserId = '5491132766709@c.us';
        setUserState(testUserId, { step: HUMAN_MODE, topic: null, nombre: null });
        logger.info(`Usuario de prueba ${testUserId} agregado en modo humano automáticamente`);
        console.log(`📱 Usuario de prueba ${testUserId} en modo humano para testing`);
    });

    client.on('auth_failure', (msg) => {
        logger.error('Fallo de autenticación', { message: msg });
    });

    client.on('disconnected', (reason) => {
        logger.warn('Cliente desconectado', { reason });
    });

    client.on('error', (error) => {
        logger.error('Error en el cliente de WhatsApp', { error: error.message });
    });

    // Manejo de mensajes
    client.on('message', async (message) => {
        try {
            const chatId = message.from;
            const messageBody = message.body.trim();
            
            // Ignorar mensajes de grupos y estados
            if (message.from.includes('@g.us') || message.from.includes('@broadcast')) {
                return;
            }
            
            // Verificar rate limiting
            if (!checkRateLimit(chatId)) {
                await message.reply('⚠️ Has enviado demasiados mensajes. Por favor, espera unos minutos antes de continuar.');
                return;
            }
            
            // Obtener o crear estado del usuario
            let userState = getUserState(chatId);
            if (!userState) {
                userState = { step: 0, topic: null, nombre: null };
                setUserState(chatId, userState);
            }
            
            logger.info('Mensaje recibido', { 
                chatId, 
                message: messageBody, 
                step: userState.step 
            });
            
            // Si está en modo humano, no procesar automáticamente
            if (userState.step === HUMAN_MODE) {
                logger.info(`Usuario ${chatId} en modo humano, mensaje no procesado automáticamente`);
                return;
            }
            
            // Verificar horario de negocio (excepto admins)
            if (!isAdmin(chatId) && !isWithinBusinessHours()) {
                await message.reply(
                    '🕐 *Horario de Atención*\n\n' +
                    'Nuestro horario de atención es:\n' +
                    '📅 Lunes a Viernes\n' +
                    '🕘 9:00 AM - 6:00 PM\n\n' +
                    'Tu mensaje ha sido registrado y te responderemos en el próximo horario hábil.'
                );
                return;
            }
            
            // Procesar según el paso actual
            switch (userState.step) {
                case 0:
                    await enviarMenu(message);
                    userState.step = 1;
                    setUserState(chatId, userState);
                    break;
                    
                case 1:
                    // Procesar selección del menú
                    const chat = await message.getChat();
                    
                    if (messageBody === '1') {
                        await chat.sendMessage(
                            `*Consultoría en Licitaciones Públicas y/o Privadas*\n` +
                            `Brindamos asesoramiento en todas las etapas: desde la documentación licitatoria hasta la ejecución del proyecto adjudicado.\n\n` +
                            `Para más información: https://www.inted.com.ar/consultoria-licitaciones\n\n` +
                            `¿Te gustaría hablar con un representante? Escribe "SI" o "NO".`
                        );
                        userState.topic = 'licitaciones';
                        userState.step = 10;
                        setUserState(chatId, userState);
                    } else if (messageBody === '2') {
                        await chat.sendMessage(
                            `*Consultoría en Desarrollo de Proyectos Constructivos*\n` +
                            `Nuestro asesoramiento integral en la gestoría de trámites requeridos para la realización de proyectos constructivos.\n\n` +
                            `Para más información: https://www.inted.com.ar/proyectos-constructivos\n\n` +
                            `¿Te gustaría hablar con un representante? Escribe "SI" o "NO".`
                        );
                        userState.topic = 'proyectos';
                        userState.step = 20;
                        setUserState(chatId, userState);
                    } else if (messageBody === '3') {
                        // Verificar horario de atención
                        if (isWithinBusinessHours()) {
                            await chat.sendMessage(`Estamos *dentro* de nuestro horario de atención (Lunes a Viernes, 09:00 a 18:00).`);
                        } else {
                            await chat.sendMessage(`Estamos *fuera* de nuestro horario de atención (Lunes a Viernes, 09:00 a 18:00).`);
                        }
                        
                        await chat.sendMessage('Por favor, indícanos tu nombre completo:');
                        userState.topic = 'representante';
                        userState.step = 40;
                        setUserState(chatId, userState);
                    } else {
                        await chat.sendMessage(
                            `Lo siento, no reconozco esa opción.\n` +
                            `Si deseas volver al menú, escribe "menu".`
                        );
                    }
                    break;
                    
                // Manejo de respuestas SI/NO para licitaciones y proyectos
                case 10:
                case 20:
                    const chat2 = await message.getChat();
                    if (messageBody.toLowerCase() === 'si' || messageBody.toLowerCase() === 'sí') {
                        await chat2.sendMessage('¡Excelente! Primero, ¿podrías indicar tu nombre completo?');
                        userState.step = userState.step + 1; // 11 para licitaciones, 21 para proyectos
                        setUserState(chatId, userState);
                    } else if (messageBody.toLowerCase() === 'no') {
                        await chat2.sendMessage('Entendido. Volvamos al menú principal.');
                        await enviarMenu(message);
                        userState.step = 1;
                        userState.topic = null;
                        setUserState(chatId, userState);
                    } else {
                        await chat2.sendMessage('Por favor responde "SI" o "NO".');
                    }
                    break;
                    
                // Flujo de licitaciones: recopilar nombre
                case 11:
                    const chat3 = await message.getChat();
                    const nombre1 = sanitizeText(messageBody);
                    if (!isValidText(nombre1, 2, 50)) {
                        await chat3.sendMessage('❌ Por favor ingresa un nombre válido (entre 2 y 50 caracteres).');
                        return;
                    }
                    userState.nombre = nombre1;
                    userState.step = 12;
                    setUserState(chatId, userState);
                    await chat3.sendMessage('Gracias. Ahora, ¿podrías compartir tu dirección de email?');
                    break;
                    
                // Flujo de licitaciones: recopilar email
                case 12:
                    const chat4 = await message.getChat();
                    const email1 = messageBody.trim();
                    if (!isValidEmail(email1)) {
                        await chat4.sendMessage('❌ Por favor ingresa un email válido (ejemplo: usuario@dominio.com).');
                        return;
                    }
                    userState.email = email1;
                    userState.step = 13;
                    setUserState(chatId, userState);
                    await chat4.sendMessage('Por favor, cuéntanos tu consulta completa:');
                    break;
                    
                // Flujo de licitaciones: recopilar consulta y finalizar
                case 13:
                    const chat5 = await message.getChat();
                    const consulta1 = sanitizeText(messageBody);
                    if (!isValidText(consulta1, 10, 1000)) {
                        await chat5.sendMessage('❌ Por favor describe tu consulta con más detalle (mínimo 10 caracteres).');
                        return;
                    }
                    userState.consulta = consulta1;
                    userState.step = HUMAN_MODE;
                    setUserState(chatId, userState);
                    
                    await chat5.sendMessage(
                        `¡Perfecto, ${userState.nombre}! Hemos recibido tu consulta:\n\n` +
                        `"${userState.consulta}"\n\n` +
                        `Te contactaremos pronto. Gracias por comunicarte con Inted.`
                    );
                    logger.info(`Usuario ${chatId} completó flujo de licitaciones y pasó a HUMAN_MODE`);
                    break;
                    
                // Flujo de proyectos: recopilar nombre
                case 21:
                    const chat6 = await message.getChat();
                    const nombre2 = sanitizeText(messageBody);
                    if (!isValidText(nombre2, 2, 50)) {
                        await chat6.sendMessage('❌ Por favor ingresa un nombre válido (entre 2 y 50 caracteres).');
                        return;
                    }
                    userState.nombre = nombre2;
                    userState.step = 22;
                    setUserState(chatId, userState);
                    await chat6.sendMessage('Gracias. ¿Podrías compartir tu dirección de email?');
                    break;
                    
                // Flujo de proyectos: recopilar email
                case 22:
                    const chat7 = await message.getChat();
                    const email2 = messageBody.trim();
                    if (!isValidEmail(email2)) {
                        await chat7.sendMessage('❌ Por favor ingresa un email válido (ejemplo: usuario@dominio.com).');
                        return;
                    }
                    userState.email = email2;
                    userState.step = 23;
                    setUserState(chatId, userState);
                    await chat7.sendMessage('Por favor, cuéntanos tu consulta completa:');
                    break;
                    
                // Flujo de proyectos: recopilar consulta y finalizar
                case 23:
                    const chat8 = await message.getChat();
                    const consulta2 = sanitizeText(messageBody);
                    if (!isValidText(consulta2, 10, 1000)) {
                        await chat8.sendMessage('❌ Por favor describe tu consulta con más detalle (mínimo 10 caracteres).');
                        return;
                    }
                    userState.consulta = consulta2;
                    userState.step = HUMAN_MODE;
                    setUserState(chatId, userState);
                    
                    await chat8.sendMessage(
                        `¡Perfecto, ${userState.nombre}! Hemos recibido tu consulta:\n\n` +
                        `"${userState.consulta}"\n\n` +
                        `Te contactaremos pronto. Gracias por comunicarte con Inted.`
                    );
                    logger.info(`Usuario ${chatId} completó flujo de proyectos y pasó a HUMAN_MODE`);
                    break;
                    
                // Flujo de representante: recopilar nombre
                case 40:
                    const chat9 = await message.getChat();
                    const nombre3 = sanitizeText(messageBody);
                    if (!isValidText(nombre3, 2, 50)) {
                        await chat9.sendMessage('❌ Por favor ingresa un nombre válido (entre 2 y 50 caracteres).');
                        return;
                    }
                    userState.nombre = nombre3;
                    userState.step = 41;
                    setUserState(chatId, userState);
                    await chat9.sendMessage('Gracias. ¿Podrías compartir tu dirección de email?');
                    break;
                    
                // Flujo de representante: recopilar email
                case 41:
                    const chat10 = await message.getChat();
                    const email3 = messageBody.trim();
                    if (!isValidEmail(email3)) {
                        await chat10.sendMessage('❌ Por favor ingresa un email válido (ejemplo: usuario@dominio.com).');
                        return;
                    }
                    userState.email = email3;
                    userState.step = 42;
                    setUserState(chatId, userState);
                    await chat10.sendMessage('Por favor, cuéntanos brevemente tu motivo de consulta:');
                    break;
                    
                // Flujo de representante: recopilar consulta y finalizar
                case 42:
                    const chat11 = await message.getChat();
                    const consulta3 = sanitizeText(messageBody);
                    if (!isValidText(consulta3, 2, 500)) {
                        await chat11.sendMessage('❌ Por favor describe brevemente tu consulta (mínimo 2 caracteres).');
                        return;
                    }
                    userState.consulta = consulta3;
                    userState.step = HUMAN_MODE;
                    setUserState(chatId, userState);
                    
                    // Mensaje según horario
                    if (isWithinBusinessHours()) {
                        await chat11.sendMessage(
                            `¡Perfecto, ${userState.nombre}!\n` +
                            `Hemos recibido tu información: "${userState.consulta}"\n\n` +
                            `En breve, un representante humano continuará la conversación contigo.`
                        );
                    } else {
                        await chat11.sendMessage(
                            `¡Perfecto, ${userState.nombre}!\n` +
                            `Hemos recibido tu información: "${userState.consulta}"\n\n` +
                            `En cuanto estemos en horario, un representante se comunicará contigo.`
                        );
                    }
                    logger.info(`Usuario ${chatId} completó flujo de representante y pasó a HUMAN_MODE`);
                    break;
                    
                default:
                    // Reset si hay un estado inválido
                    resetUserState(chatId);
                    await enviarMenu(message);
                    break;
            }
            
        } catch (error) {
            logger.error('Error procesando mensaje', { 
                error: error.message, 
                chatId: message.from 
            });
            
            await message.reply(
                '❌ Ha ocurrido un error procesando tu mensaje. Por favor, intenta nuevamente.'
            );
        }
    });

    return client;
}

module.exports = {
    createWhatsAppClient,
    isAdmin,
    checkRateLimit,
    isWithinBusinessHours,
    enviarMenu
};