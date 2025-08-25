const validator = require('validator');

/**
 * Valida si un email es válido
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return validator.isEmail(email) && email.length <= 254;
}

/**
 * Valida texto con longitud mínima y máxima
 * @param {string} text - Texto a validar
 * @param {number} minLength - Longitud mínima
 * @param {number} maxLength - Longitud máxima
 * @returns {boolean} - True si es válido
 */
function isValidText(text, minLength = 2, maxLength = 500) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    const trimmedText = text.trim();
    return trimmedText.length >= minLength && trimmedText.length <= maxLength;
}

/**
 * Sanitiza texto removiendo caracteres peligrosos
 * @param {string} text - Texto a sanitizar
 * @returns {string} - Texto sanitizado
 */
function sanitizeText(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    return text.trim()
        .replace(/[<>"'&]/g, '')
        .substring(0, 500);
}

module.exports = {
    isValidEmail,
    isValidText,
    sanitizeText
};