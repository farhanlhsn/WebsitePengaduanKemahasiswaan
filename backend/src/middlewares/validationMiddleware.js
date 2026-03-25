const { validationResult } = require('express-validator');
const ResponseFormatter = require('../utils/responseFormatter');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((err) => ({
    field: err.path,
    message: err.msg,
    location: err.location,
    value: err.value,
  }));

  return res.status(400).json(ResponseFormatter.validation(formattedErrors));
};


