const express = require('express');
const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const env = require('dotenv').config();
const router = express.Router();

const uploadToNextcloud = async (file) => {
    
    const client = new nextcloudClient.Client({
        url: process.env.NEXTCLOUD_URL,
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD,
    });

    const remotePath = `/nextcloud/uploads/${file.originalname}`;
    await client.put(remotePath, file.buffer);
};

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

// Function to scan file with Microsoft Azure
async function scanFileWithAzure(filePath) {
    console.log(process.env.AZURE_API_KEY);
    const apiKey = process.env.AZURE_API_KEY;
    const endpoint = process.env.AZURE_URL;
    
    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

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

module.exports = { checkFileType, uploadToNextcloud, scanFileWithAzure, router };


