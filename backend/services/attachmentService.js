const { Attachments } = require("../models");
const nextCloud = require("../controllers/nextCloudUploaderController.js");
const path = require("path");

exports.uploadFilesAndCreateAttachments = async (files) => {
  const attachmentInstances = [];
  if (files && files.length > 0) {
    for (const file of files) {
      const localFilePath = path.resolve(file.path);
      const uploadsDir = path.resolve("./uploads");
      if (!localFilePath.startsWith(uploadsDir)) {
        return res.status(400).json({ message: "Invalid file path" });
      }

      try {
        // Datei zu NextCloud hochladen
        const remoteFilePath = await nextCloud.uploadFile(
          localFilePath,
          "/IP_WKS/",
          file.filename,
        );

        // Prüfen, ob das Attachment bereits existiert
        let attachment = await Attachments.findOne({
          where: { filepath: remoteFilePath },
        });

        if (!attachment) {
          // Neues Attachment erstellen
          const attachmentData = {
            filename: file.originalname,
            filepath: remoteFilePath,
            mimetype: file.mimetype,
            size: file.size,
            uploadedAt: new Date(),
            filehash: remoteFilePath.substring(
              remoteFilePath.lastIndexOf("/") + 1,
              remoteFilePath.lastIndexOf("."),
            ),
          };
          attachment = await Attachments.create(attachmentData);
        }

        // Attachment sammeln
        attachmentInstances.push(attachment);
      } catch (error) {
        console.error("Error uploading file to NextCloud:", error);
        throw new Error("Error uploading files to NextCloud");
      }
    }
  }
  return attachmentInstances;
};

exports.deleteAttachmentIfOrphaned = async (attachment) => {
  // Prüfen, ob das Attachment mit anderen Cases verknüpft ist
  const otherCases = await attachment.getCases();
  if (otherCases.length === 0) {
    // Datei aus NextCloud löschen
    await nextCloud.deleteFile(attachment.filepath);
    // Attachment aus der Datenbank löschen
    await attachment.destroy();
  }
};
