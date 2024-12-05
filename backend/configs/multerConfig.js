const multer = require("multer");
const path = require("path");
const fileUploadController = require("../controllers/fileuploadController");

const upload = multer({
  storage: multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
      cb(
        null,
        file.fieldname + "-" + Date.now() + path.extname(file.originalname),
      );
    },
  }),
  limits: { fileSize: 52428800 }, // Dateigrößenbeschränkung pro Datei
  fileFilter: function (req, file, cb) {
    fileUploadController.checkFileName(file);
    fileUploadController.checkFileType(file, cb);
    //try {
    //    fileUploadController.scanFileWithAzure(file);
    //    cb(null, true);
    //} catch (error) {
    //    cb(error);
    //}
  },
}).array("files", 10); // 'files' ist der Feldname, bis zu 10 Dateien

module.exports = upload;
