const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const HUMAN_MODE = 999;
const DATA_FILE = path.join(__dirname, '..', 'data', 'conversation-state.json');
const HISTORY_FILE = path.join(__dirname, '..', 'data', 'conversation-history.json');

// Asegurar que el directorio data existe
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let conversationState = {};
let conversationHistory = [];

/**
 * Carga los datos desde archivos JSON
 */
function loadData() {
    try {
        // Cargar estado actual
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            conversationState = JSON.parse(data);
            logger.info(`Estados de conversación cargados: ${Object.keys(conversationState).length} usuarios`);
        }
        
        // Cargar historial
        if (fs.existsSync(HISTORY_FILE)) {
            const historyData = fs.readFileSync(HISTORY_FILE, 'utf8');
            conversationHistory = JSON.parse(historyData);
            logger.info(`Historial cargado: ${conversationHistory.length} registros`);
        }
    } catch (error) {
        logger.error('Error al cargar datos:', error.message);
        conversationState = {};
        conversationHistory = [];
    }
}

/**
 * Guarda los datos en archivos JSON
 */
function saveData() {
    try {
        // Guardar estado actual
        fs.writeFileSync(DATA_FILE, JSON.stringify(conversationState, null, 2));
        
        // Guardar historial (mantener solo los últimos 1000 registros)
        if (conversationHistory.length > 1000) {
            conversationHistory = conversationHistory.slice(-1000);
        }
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(conversationHistory, null, 2));
        
        logger.info('Datos guardados correctamente');
    } catch (error) {
        logger.error('Error al guardar datos:', error.message);
    }
}

// Cargar datos al inicializar
loadData();

/**
 * Resetea el estado de un usuario específico
 * @param {string} chatId - ID del chat a resetear
 * @returns {boolean} - True si se reseteo correctamente
 */
function resetUserState(chatId) {
    console.log(`[DEBUG] resetUserState llamado para chatId: ${chatId}`);
    console.log(`[DEBUG] conversationState antes del reset:`, conversationState);
    
    try {
        if (conversationState[chatId]) {
            console.log(`[DEBUG] Usuario ${chatId} encontrado, guardando en historial y eliminando estado`);
            
            // Guardar en historial antes de eliminar
            const userRecord = {
                chatId: chatId,
                resetDate: new Date().toISOString(),
                lastState: { ...conversationState[chatId] }
            };
            conversationHistory.push(userRecord);
            
            // Eliminar del estado actual
            delete conversationState[chatId];
            
            // Guardar datos
            saveData();
            
            console.log(`[DEBUG] conversationState después del reset:`, conversationState);
            logger.info(`Estado del usuario ${chatId} reseteado y guardado en historial`);
            return true;
        } else {
            console.log(`[DEBUG] Usuario ${chatId} no encontrado en conversationState`);
            logger.warn(`Intento de resetear usuario inexistente: ${chatId}`);
            return false;
        }
    } catch (error) {
        console.error(`[DEBUG] Error en resetUserState:`, error);
        logger.error('Error al resetear estado del usuario', { chatId, error: error.message });
        return false;
    }
}

/**
 * Obtiene el estado de un usuario
 * @param {string} chatId - ID del chat
 * @returns {object|null} - Estado del usuario o null
 */
function getUserState(chatId) {
    return conversationState[chatId] || null;
}

/**
 * Establece el estado de un usuario
 * @param {string} chatId - ID del chat
 * @param {object} state - Estado a establecer
 */
function setUserState(chatId, state) {
    conversationState[chatId] = {
        ...state,
        lastUpdated: new Date().toISOString()
    };
    
    // Guardar datos automáticamente
    saveData();
    
    logger.info(`Estado actualizado para usuario ${chatId}`);
}

/**
 * Obtiene todos los estados de conversación
 * @returns {object} - Todos los estados
 */
function getAllStates() {
    return conversationState;
}

/**
 * Obtiene estadísticas de los usuarios
 * @returns {object} - Estadísticas
 */
function getStats() {
    const totalUsers = Object.keys(conversationState).length;
    const humanModeUsers = Object.values(conversationState)
        .filter(state => state.step === HUMAN_MODE).length;
    const activeUsers = Object.values(conversationState)
        .filter(state => state.step !== HUMAN_MODE).length;
    
    return {
        totalUsers,
        humanModeUsers,
        activeUsers,
        totalHistoryRecords: conversationHistory.length,
        lastUpdate: new Date().toISOString()
    };
}

/**
 * Obtiene el historial de conversaciones
 * @param {number} limit - Límite de registros a devolver
 * @returns {array} - Historial de conversaciones
 */
function getHistory(limit = 50) {
    return conversationHistory.slice(-limit).reverse();
}

/**
 * Resetea todos los estados (mantiene historial)
 * @returns {number} - Número de usuarios reseteados
 */
function resetAllStates() {
    const userCount = Object.keys(conversationState).length;
    
    // Guardar todos en historial
    Object.keys(conversationState).forEach(chatId => {
        const userRecord = {
            chatId: chatId,
            resetDate: new Date().toISOString(),
            lastState: { ...conversationState[chatId] },
            resetType: 'bulk'
        };
        conversationHistory.push(userRecord);
    });
    
    // Limpiar estado actual
    Object.keys(conversationState).forEach(chatId => {
        delete conversationState[chatId];
    });
    
    // Guardar datos
    saveData();
    
    logger.info(`Todos los estados reseteados: ${userCount} usuarios`);
    return userCount;
}

module.exports = {
    HUMAN_MODE,
    conversationState,
    resetUserState,
    getUserState,
    setUserState,
    getAllStates,
    getStats,
    getHistory,
    resetAllStates,
    loadData,
    saveData
};