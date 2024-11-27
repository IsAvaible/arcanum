const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const env = require('dotenv').config();
const router = express.Router();

function checkFileName(file) {
    const fileName = path.basename(file.originalname);
    if (file.originalname !== fileName) {
        throw new Error('File name should not contain a complete path');
    }
    return fileName;
}

// Check file type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|txt|pdf|mp3|wav|doc/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    const mimetypes = /image\/jpeg|image\/jpg|image\/png|image\/gif|text\/plain|application\/pdf/; 
    // Check mime
    const mimetype = mimetypes.test(file.mimetype);

    if (mimetype && extname) {
        console.log("File type check succsessfull")
        return cb(null, true), extname;
    } else {
        cb('Error: Images/Text Only!');
    }
}

// Function to scan file with Microsoft Azure
async function scanFileWithAzure(file) {
    console.log(process.env.AZURE_API_KEY);
    const apiKey = process.env.AZURE_API_KEY;
    const endpoint = process.env.AZURE_URL;
    
    const fileStream = fs.createReadStream(file);
    const fileName = path.basename(file);

    try {
        const response = await axios.post(endpoint, fileStream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Disposition': `attachment; filename=${fileName}`
            }
        });

        if (response.status !== 200) {
            throw new Error(`Error scanning file with Azure: ${response.statusText}`);
        }

        return response.data;
    } catch (error) {
        console.error('Error scanning file with Azure:', error);
        throw error;
    }
};

module.exports = { checkFileType, scanFileWithAzure, router, checkFileName };


