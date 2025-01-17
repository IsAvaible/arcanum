const { Attachments } = require("../models");
const nextCloud = require("../controllers/nextCloudUploaderController.js");
const path = require("path");

/**
 * Uploads files to NextCloud and creates attachment records in the database.
 *
 * @param {Array<Object>} files - Array of file objects uploaded by the user.
 * Each file object contains properties such as `path`, `originalname`, `mimetype`, and `size`.
 * @returns {Promise<Array<Object>>} Array of created attachment instances.
 *
 * For each file:
 * - Validates the file path to ensure it's within the expected directory.
 * - Uploads the file to NextCloud.
 * - Checks if an attachment already exists in the database with the same file path.
 * - Creates a new attachment record if none exists and collects the attachment instance.
 * - Returns an array of all attachment instances created.
 *
 * @throws {Error} If any error occurs during file upload or attachment creation.
 */
exports.uploadFilesAndCreateAttachments = async (files) => {
  const attachmentInstances = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const localFilePath = path.resolve(file.path);
      const uploadsDir = path.resolve("./uploads");

      // Validate file path to prevent directory traversal or invalid paths
      if (!localFilePath.startsWith(uploadsDir)) {
        return res.status(400).json({ message: "Invalid file path" });
      }

      try {
        // Upload the file to NextCloud
        const remoteFilePath = await nextCloud.uploadFile(
          localFilePath,
          "/IP_WKS/",
          file.filename,
        );

        // Check if the attachment already exists in the database
        let attachment = await Attachments.findOne({
          where: { filepath: remoteFilePath },
        });

        if (!attachment) {
          // Create a new attachment record
          const attachmentData = {
            filename: file.originalname, // Original file name
            filepath: remoteFilePath, // Path in NextCloud
            mimetype: file.mimetype, // File MIME type (e.g., image/png)
            size: file.size, // File size in bytes
            uploadedAt: new Date(), // Timestamp of upload
            filehash: remoteFilePath.substring(
              remoteFilePath.lastIndexOf("/") + 1,
              remoteFilePath.lastIndexOf("."),
            ), // Extract hash from the file name
          };
          attachment = await Attachments.create(attachmentData);
        }

        // Collect the attachment instance
        attachmentInstances.push(attachment);
      } catch (error) {
        console.error("Error uploading file to NextCloud:", error);
        throw new Error("Error uploading files to NextCloud");
      }
    }
  }
  return attachmentInstances;
};

/**
 * Deletes an attachment from NextCloud and the database if it is not associated with any cases.
 *
 * @param {Object} attachment - The attachment instance to be checked and deleted.
 * @returns {Promise<void>} Resolves when the attachment is deleted, or does nothing if the attachment is still associated with cases.
 *
 * This function performs the following:
 * - Checks if the attachment is linked to any other cases.
 * - Deletes the file from NextCloud if it is not linked to any cases.
 * - Deletes the attachment record from the database.
 */
exports.deleteAttachmentIfOrphaned = async (attachment) => {
  // Check if the attachment is associated with any other cases
  const otherCases = await attachment.getCases();
  const id = attachment.id;

  if (otherCases.length === 0) {
    // Delete the file from NextCloud
    await nextCloud.deleteFile(attachment.filepath);

    // Delete the attachment record from the database
    await attachment.destroy();
    return id;
  }
};
