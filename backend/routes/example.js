const express = require('express');
const multer = require('multer');
const router = express.Router();
const upload = multer({
    storage: multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('file');

// Controller importieren
const exampleController = require('../controllers/exampleController');
const fileUploadController = require('../controllers/fileuploadController');


router.get('/upload', (req, res) => {
    res.render('./frontend/fileupload');
});

router.post('/upload', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err });
        }

        if (req.file == undefined) {
            return res.status(400).json({ message: 'No file selected!' });
        }

        try {
            const scanResult = await scanFileWithVirusTotal(req.file.path);
            if (scanResult.positives > 0) {
                return res.status(400).json({ message: 'File is infected with malware!' });
            }
            res.status(200).json({ message: 'File uploaded and scanned successfully!', scanResult });
        } catch (error) {
            res.status(500).json({ message: 'Error scanning file for malware.', error });
        }
    });
});

module.exports = router;