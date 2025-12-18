/**
 * Validates conversion request parameters
 * @param {string} from - Source currency code
 * @param {string} to - Target currency code
 * @param {number|string} amount - Amount to convert
 * @returns {object} - { isValid: boolean, error: string|null }
 */
const validateConversionRequest = (from, to, amount) => {
    if (!from || typeof from !== 'string') {
        return { isValid: false, error: 'Missing or invalid "from" currency code' };
    }
    if (!to || typeof to !== 'string') {
        return { isValid: false, error: 'Missing or invalid "to" currency code' };
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
        return { isValid: false, error: 'Amount must be a positive number' };
    }
    return { isValid: true, error: null };
};

/**
 * Validates history request parameters
 * @param {string} coinId - Crypto coin ID
 * @param {string} vsCurrency - Target currency
 * @param {number|string} days - Number of days
 * @returns {object} - { isValid: boolean, error: string|null }
 */
const validateHistoryRequest = (coinId, vsCurrency, days) => {
    if (!coinId || typeof coinId !== 'string') {
        return { isValid: false, error: 'Missing or invalid "coinId" (from)' };
    }
    if (!vsCurrency || typeof vsCurrency !== 'string') {
        return { isValid: false, error: 'Missing or invalid "vsCurrency" (to)' };
    }
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays <= 0 || numDays > 365) {
        return { isValid: false, error: 'Days must be a number between 1 and 365' };
    }
    return { isValid: true, error: null };
};

module.exports = {
    validateConversionRequest,
    validateHistoryRequest
};
