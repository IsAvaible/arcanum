/**
 * @file generateJWT.ts
 * @description This file contains a function to generate a JSON Web Token (JWT) using a random 32-byte hex string as the payload and a secret key from environment variables.
 */
/* require('dotenv').config();
const jwt = require('jsonwebtoken'); 
const crypto = require('crypto'); */
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import env from 'dotenv'
env.config()

/**
 * Generates a JSON Web Token (JWT).
 *
 * @function generateJWT
 * @returns {string} A signed JWT with a random 32-byte hex string as the payload, valid for 1 hour.
 */
export function generateJWT(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables')
  }
  try {
    return jwt.sign(crypto.randomBytes(32).toString('hex'), secret, {
      expiresIn: '1h',
    })
  } catch (error) {
    console.error(error)
    throw error
  }
}
