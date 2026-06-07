const { chatError } = require('../utils/chatErrors');

function parsePositiveInt(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw chatError('INVALID_PAYLOAD', 400);
  }
  return n;
}

function parseBoolean(value) {
  if (typeof value !== 'boolean') {
    throw chatError('INVALID_PAYLOAD', 400);
  }
  return value;
}

module.exports = { parsePositiveInt, parseBoolean };
