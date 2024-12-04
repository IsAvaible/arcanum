const multer = require('multer');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController'); // Passen Sie den Pfad an, falls nötig

const upload = multer({
    storage: multer.diskStorage({
        destination: './uploads/',
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 52428800 }, // Dateigrößenbeschränkung pro Datei
    fileFilter: function (req, file, cb) {
        fileUploadController.checkFileName(file);
        fileUploadController.checkFileType(file, cb);
        // Weitere Prüfungen oder Scans können hier hinzugefügt werden
        //try {
        //    fileUploadController.scanFileWithAzure(file);
        //    cb(null, true);
        //} catch (error) {
        //    cb(error);
        //}
    }
}).array('files', 10); // 'files' ist der Feldname, bis zu 10 Dateien

// Middleware-Funktion exportieren
module.exports = (req, res, next) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Multer-spezifischer Fehler
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // Unbekannter Fehler
            return res.status(500).json({ message: 'Ein unbekannter Fehler ist aufgetreten.' });
        }
        // Erfolgreich hochgeladen, weiter zur nächsten Middleware
        next();
    });
};
