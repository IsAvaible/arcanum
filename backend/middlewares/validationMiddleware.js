const { Request, Response, NextFunction } = require("express");
const { z, ZodError } = require("zod");
const { StatusCodes } = require("http-status-codes");
const { body, validationResult } = require("express-validator");

/**
 * Middleware to validate request data using a Zod schema.
 *
 * @param {z.ZodType} schema - A Zod schema to validate the request body.
 * @returns {function} An Express middleware function that validates the request body against the schema.
 *
 * If the validation succeeds, the middleware calls `next()` to proceed to the next middleware.
 * If the validation fails, it sends a `400 Bad Request` response with details of the validation errors.
 * For any other unexpected error, it sends a `500 Internal Server Error` response.
 */
function validateData(schema) {
  return (req, res, next) => {
    try {
      // Validate the request body against the provided schema.
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors from Zod.
        const errorMessages = error.errors.map((issue) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid data", details: errorMessages });
      } else {
        // Handle unexpected errors.
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: "Internal Server Error" });
      }
    }
  };
}

/**
 * Middleware to sanitize and validate specified fields in the request body.
 *
 * @param {string[]} fields - An array of field names to be escaped and validated.
 * @returns {Array<function>} An array of Express middleware functions:
 *   1. Middleware that sanitizes the specified fields by escaping harmful characters.
 *   2. Middleware that validates the request and checks for validation errors.
 *
 * If the fields pass validation, the middleware calls `next()` to proceed.
 * If validation fails, it sends a `400 Bad Request` response with the validation errors.
 */
function escapeData(fields) {
  return [
    // Escape harmful characters in the specified fields.
    fields.map((field) => body(field).escape()),

    // Middleware to validate the request and handle errors.
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: errors.array() });
      }
      next();
    },
  ];
}

module.exports = { validateData, escapeData };
