/**
 * Utility class for formatting API responses consistently.
 * All methods return a plain object — the caller is responsible for
 * sending the response via `res.status(code).json(...)`.
 *
 * @example
 * // Error response
 * return res.status(403).json(ResponseFormatter.error('Access denied', 403));
 *
 * // Success response
 * return res.status(200).json(ResponseFormatter.success(data, 'OK'));
 *
 * // Validation error response
 * return res.status(400).json(ResponseFormatter.validation(errors));
 */
class ResponseFormatter {
  /**
   * Format a success response object.
   * @param {*} data - The response payload.
   * @param {string} [message='Success'] - Human-readable success message.
   * @param {number} [statusCode=200] - HTTP status code.
   * @returns {{ status: 'success', statusCode: number, message: string, data: *, timestamp: string }}
   */
  static success(data, message = 'Success', statusCode = 200) {
    return {
      status: 'success',
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format an error response object.
   * @param {string} [message='Internal Server Error'] - Human-readable error message.
   * @param {number} [statusCode=500] - HTTP status code.
   * @param {object|null} [errors=null] - Optional detailed error information.
   * @returns {{ status: 'error', statusCode: number, message: string, errors: object|null, timestamp: string }}
   */
  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
      status: 'error',
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format a validation error response object (always 400).
   * @param {object} errors - Validation error details (field-level errors).
   * @param {string} [message='Validation Error'] - Human-readable validation message.
   * @returns {{ status: 'error', statusCode: 400, message: string, errors: object, timestamp: string }}
   */
  static validation(errors, message = 'Validation Error') {
    return {
      status: 'error',
      statusCode: 400,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ResponseFormatter;
