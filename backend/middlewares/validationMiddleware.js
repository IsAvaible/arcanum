
const { Request, Response, NextFunction } = require("express");
const { z, ZodError } = require("zod");
const { StatusCodes } = require("http-status-codes");
const { body, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");



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
          .json({ error: "Invalid data", details: errorMessages });
      } else {
        // Handle unexpected errors.
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ error: "Internal Server Error" });
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
          .json({ errors: errors.array() });
      }
      next();
    },
  ];
}

/**
 * Middleware to authenticate a JSON Web Token (JWT).
 *
 * This middleware checks for the presence of a JWT in the "x-auth-token" header of the request.
 * If the token is not provided, it sends a `401 Unauthorized` response.
 * If the token is provided, it verifies the token using the secret key from the environment variables.
 * If the token is valid, it attaches the decoded token to the `req.user` property and calls `next()` to proceed.
 * If the token is invalid, it sends a `400 Bad Request` response.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
const authenticateJWT = (req, res, next) => {
  const token = req.cookies["x-auth-token"];
  console.log(token);
  
  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (ex) {
    res.status(401).send("Invalid token.");
  }
};

module.exports = { validateData, escapeData, authenticateJWT };
