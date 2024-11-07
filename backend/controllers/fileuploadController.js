const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const router = express.Router();




// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images/Text Only!');
    }
}

    // Function to scan file with VirusTotal
async function scanFileWithVirusTotal(filePath) {
    const apiKey = 'bd1595dd3b63031e3a0817a29bc1cad14b75f8f09a06aaeda23c5b47ab39fbb3';
    const url = 'https://www.virustotal.com/vtapi/v2/file/scan';

    const formData = new FormData();
    formData.append('apikey', apiKey);
    console.log("Datei Pfad:"+  filePath);
    formData.append('file', fs.createReadStream(filePath));

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders()
        });
        if (response.data.response_code !== 200) {
            return response.data.verbose_msg;
        }
        return response.data;
    } catch (error) {
        console.error('Error scanning file with VirusTotal:', error);
        throw error;
    }};

module.exports = { checkFileType, scanFileWithVirusTotal };


