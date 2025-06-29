class ResponseFormatter {
  static success(data, message = 'Success', statusCode = 200) {
    return {
      status: 'success',
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(message = 'Internal Server Error', statusCode = 500, errors = null) {
    return {
      status: 'error',
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString()
    };
  }

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