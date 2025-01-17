const multer = require("multer");
const path = require("path");
const fileUploadController = require("../controllers/fileuploadController"); // Adjust the path if necessary

/**
 * Configures Multer for file uploads.
 * - Files are stored in the `./uploads/` directory with unique names.
 * - Enforces a file size limit of 50MB per file.
 * - Uses custom filters to validate file types and names.
 */
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

  // Sets the file size limit to 1GB.
  limits: { fileSize: 1000000000 },

  /**
   * Filters uploaded files based on their names and types.
   * @param {Object} req - The request object.
   * @param {Object} file - The uploaded file object.
   * @param {Function} cb - The callback to indicate success or failure.
   */
  fileFilter: function (req, file, cb) {
    // Convert filename to correct encoding to handle special characters.
    // See: https://github.com/expressjs/multer/issues/962#issuecomment-1283500468
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf-8",
    );

    // Validate the file name.
    fileUploadController.checkFileName(file);

    // Validate the file type.
    fileUploadController.checkFileType(file, cb);

    // Additional checks or scanning (commented out as an example).
    /*
    try {
      fileUploadController.scanFileWithAzure(file);
      cb(null, true);
    } catch (error) {
      cb(error);
    }
    */
  },
}).array("files", 10); // Allows uploading up to 10 files under the field name "files".

/**
 * Middleware function for handling file uploads.
 * - Handles errors related to Multer and unknown issues.
 * - Proceeds to the next middleware if uploads are successful.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
module.exports = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // Handle Multer-specific errors (e.g., file size exceeded).
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Handle unknown errors.
      return res
        .status(500)
        .json({ message: "An unknown error occurred during the upload." });
    }
    // Proceed to the next middleware if uploads are successful.
    next();
  });
};
