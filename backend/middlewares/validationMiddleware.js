const { Request, Response, NextFunction } = require('express');
const { z, ZodError } = require('zod');
const { StatusCodes } = require('http-status-codes');
const { body, validationResult } = require('express-validator');


function validateData(schema) {
  return (req, res, next) => {
      try {
          schema.parse(req.body);
          next();
      } catch (error) {
          if (error instanceof ZodError) {
              const errorMessages = error.errors.map((issue) => ({
                  message: `${issue.path.join('.')} is ${issue.message}`,
              }));
              res.status(StatusCodes.BAD_REQUEST).json({ error: 'Invalid data', details: errorMessages });
          } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
          }
      }
  };
}

function escapeData(fields) {
  return [
    fields.map(field => body(field).escape()),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json({ errors: errors.array() });
      }
      next();
    }
  ];
}

module.exports = { validateData, escapeData };
