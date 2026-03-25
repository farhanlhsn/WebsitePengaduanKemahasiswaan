const jwt = require('jsonwebtoken');
const multer = require('multer');
const ResponseFormatter = require('../utils/responseFormatter');
const { getLogger } = require('../utils/logger');

const log = getLogger('app:error');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  try {
    let statusCode = err.statusCode || err.status || 500;
    let message = err.message || 'Internal Server Error';
    let details = undefined;

    // Known JWT errors
    if (err instanceof jwt.TokenExpiredError) {
      statusCode = 401;
      message = 'Token expired';
    } else if (err instanceof jwt.JsonWebTokenError) {
      statusCode = 401;
      message = 'Invalid token';
    }

    // Multer upload errors
    if (err instanceof multer.MulterError) {
      statusCode = 400;
      message = err.message;
      details = [{ field: err.field, message: err.message, code: err.code }];
    }

    // Prisma known errors
    if (err && err.name === 'PrismaClientKnownRequestError') {
      switch (err.code) {
        case 'P2002': // Unique constraint failed
          statusCode = 409;
          message = 'Duplicate value violates unique constraint';
          details = [{ target: err.meta?.target }];
          break;
        case 'P2025': // Record not found
          statusCode = 404;
          message = 'Resource not found';
          break;
        default:
          statusCode = statusCode || 500;
      }
    }

    // express-validator style
    if (Array.isArray(err?.errors)) {
      log.warn('Validation error', {
        path: req.originalUrl,
        method: req.method,
        count: err.errors.length,
      });
      return res.status(400).json(ResponseFormatter.validation(err.errors));
    }

    // Log the error
    log.error('Unhandled error', {
      statusCode,
      message,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });

    return res
      .status(statusCode)
      .json(ResponseFormatter.error(message, statusCode, details));
  } catch (handlerError) {
    // Fallback to plain response if handler itself fails
    try {
      log.error('Error in errorHandler', { message: handlerError.message, stack: handlerError.stack });
    } catch (_) {}
    return res.status(500).json({ status: 'error', statusCode: 500, message: 'Internal Server Error' });
  }
}

module.exports = errorHandler;


