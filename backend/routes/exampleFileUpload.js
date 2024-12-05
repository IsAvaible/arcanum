// Controller importieren
const exampleController = require('../controllers/exampleController');
const fileUploadController = require('../controllers/fileuploadController');
const nextCloudUploader = require('../controllers/nextCloudUploaderController');
const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const env = require('dotenv').config();


const upload = multer({
    storage: multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    size: 1000000,
    limits: { fileSize: 1000000 },
    fileFilter: function (req, file, cb) {
        fileUploadController.checkFileName(file);
        fileUploadController.checkFileType(file, cb);
       /*  try {
            fileUploadController.scanFileWithAzure(file);
            cb(null, true);
        } catch (error) {
            cb(error);
        } */

        
    }
}).single('file');

router.post('/upload', (req, res) => {
    upload(req, res, async(err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }
        
        try {
            console.log('File path: ' + req.file.path); 
            const remoteFilePath = "/IP_WKS/";
            const result = await nextCloudUploader.uploadFile(req.file.path, remoteFilePath, req.file.filename);
            console.log('File uploaded to Nextcloud:', result);
            res.status(200).json({ message: 'File uploaded to Nextcloud and scanned successfully!' });
         } catch (error) {
            console.log('Error uploading file:', error); 
            res.status(500).json({ message: 'Error uploading file to Nextcloud or scanning for malware.', error });
           
         } 
    });

});

router.get('/upload', (req, res) => {
    res.render('./frontend/fileUpload');    
});


module.exports = router;