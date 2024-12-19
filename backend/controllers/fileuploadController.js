const express = require("express");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const env = require("dotenv").config();
const router = express.Router();

/**
 * Validates the filename to ensure it does not contain a complete path.
 *
 * @param {Object} file - File object provided by Multer.
 * @returns {string} The base filename if valid.
 * @throws {Error} If the filename contains a full path.
 */
function checkFileName(file) {
  const fileName = path.basename(file.originalname);
  if (file.originalname !== fileName) {
    throw new Error("File name should not contain a complete path");
  }
  return fileName;
}

/**
 * Validates the file type based on its extension and MIME type.
 *
 * @param {Object} file - File object provided by Multer.
 * @param {function} cb - Callback function to signal success or failure.
 * @returns {boolean|undefined} Returns `true` if file type is valid, otherwise calls the callback with an error message.
 */
function checkFileType(file, cb) {
  // Allowed file extensions
  const filetypes = /jpeg|jpg|png|gif|txt|pdf|mp3|mp4|wav|doc/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Allowed MIME types
  const mimetypes =
    /image\/jpeg|image\/jpg|image\/png|image\/gif|text\/plain|application\/pdf|audio\/mpeg|audio\/wav|application\/msword/;
  const mimetype = mimetypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log("File type check successful");
    return cb(null, true), extname;
  } else {
    cb("Error: Images/Text Only!"); // Callback with an error for invalid types.
  }
}

/**
 * Scans a file using Microsoft Azure Content Moderator.
 *
 * @param {string} file - The path to the file to be scanned.
 * @returns {Promise<Object>} The response data from the Azure API.
 * @throws {Error} If the scan fails or the API returns a non-200 status.
 */
async function scanFileWithAzure(file) {
  console.log(process.env.AZURE_API_KEY);
  const apiKey = process.env.AZURE_API_KEY;
  const endpoint = process.env.AZURE_URL;

  const fileStream = fs.createReadStream(file);
  const fileName = path.basename(file);

  try {
    // Send the file to the Azure Content Moderator API.
    const response = await axios.post(endpoint, fileStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Disposition": `attachment; filename=${fileName}`,
      },
    });

    // Validate the response status.
    if (response.status !== 200) {
      throw new Error(`Error scanning file with Azure: ${response.statusText}`);
    }

    return response.data; // Return the scan results.
  } catch (error) {
    console.error("Error scanning file with Azure:", error);
    throw error; // Re-throw the error for the caller to handle.
  }
}

module.exports = { checkFileType, scanFileWithAzure, router, checkFileName };
