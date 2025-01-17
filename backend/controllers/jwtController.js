/**
 * @file generateJWT.ss
 * @description This file contains a function to generate a JSON Web Token (JWT) using a random 32-byte hex string as the payload and a secret key from environment variables.
 */
require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); 



/**
 * Generates a JSON Web Token (JWT).
 *
 * @function generateJWT
 * @returns {string} A signed JWT with a random 32-byte hex string as the payload, valid for 1 hour.
 */
exports.generateJWT = (req, res)=> {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  try {
    return res.send({'token' : jwt.sign(crypto.randomBytes(32).toString('hex'), secret)});
  } catch (error) {
    console.error(error)
    throw error
  }
}

