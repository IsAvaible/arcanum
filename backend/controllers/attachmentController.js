const { Cases, Attachments } = require("../models");
const attachmentService = require("../services/attachmentService");
const multerMiddleware = require("../middlewares/multerMiddleware");
const nextCloud = require("./nextCloudUploaderController.js");

exports.addAttachmentsToCase = [
  multerMiddleware,
  async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {
      const caseItem = await Cases.findByPk(caseId);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      const attachmentInstances =
        await attachmentService.uploadFilesAndCreateAttachments(req.files);

      if (attachmentInstances.length > 0) {
        await caseItem.addAttachments(attachmentInstances);
      }

      const caseWithAttachments = await Cases.findByPk(caseId, {
        include: [
          {
            model: Attachments,
            as: "attachments",
            through: { attributes: [] },
          },
        ],
      });
      res.json(caseWithAttachments);
    } catch (error) {
      console.error("Error adding attachments to case:", error);
      res.status(500).json({ message: "Error adding attachments to case" });
    }
  },
];

exports.deleteAttachmentFromCase = async (req, res) => {
  const caseId = parseInt(req.params.id, 10);
  const fileId = parseInt(req.params.fileId, 10);
  try {
    const caseItem = await Cases.findByPk(caseId, {
      include: [
        {
          model: Attachments,
          as: "attachments",
          through: { attributes: [] },
        },
      ],
    });

    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    // **Attachment abrufen und prüfen, ob es mit dem Case verknüpft ist**
    const attachment = await Attachments.findOne({
      where: { id: fileId },
      include: [
        {
          model: Cases,
          as: "cases",
          where: { id: caseId },
          through: { attributes: [] },
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Verknüpfung zwischen Case und Attachment entfernen
    await caseItem.removeAttachment(attachment);

    // Attachment löschen, wenn es mit keinem anderen Case verknüpft ist
    await attachmentService.deleteAttachmentIfOrphaned(attachment);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting attachment from case:", error);
    res.status(500).json({ message: "Error deleting attachment from case" });
  }
};

exports.downloadAttachment = async (req, res) => {
  const { id, fileId } = req.params;
  //const caseId = parseInt(req.params.id, 10);
  //const fileId = parseInt(req.params.fileId, 10);

  try {
    const caseItem = await Cases.findByPk(id, {
      include: [
        {
          model: Attachments,
          as: "attachments",
          through: { attributes: [] },
        },
      ],
    });

    if (!caseItem) {
      return res.status(404).json({ message: "Case not found" });
    }

    // **Attachment abrufen und prüfen, ob es mit dem Case verknüpft ist**
    const attachment = await Attachments.findOne({
      where: { id: fileId },
      include: [
        {
          model: Cases,
          as: "cases",
          where: { id: id },
          through: { attributes: [] },
        },
      ],
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // **3. Datei aus Nextcloud abrufen**
    let fileContent;
    try {
      fileContent = await nextCloud.streamFile(attachment.filepath);
    } catch (error) {
      console.warn("Error streaming file, attempting to download:", error);
      fileContent = await nextCloud.downloadFileAndReturn(attachment.filepath);
    }

    if (!fileContent) {
      return res.status(404).json({ message: "File content not found" });
    }

    // **4. Datei an den Client senden**
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.filename}"`,
    );
    res.setHeader("Content-Type", attachment.mimetype);
    res.setHeader("Content-Length", attachment.size);

    if (Buffer.isBuffer(fileContent)) {
      res.send(fileContent);
    } else {
      // If fileContent is a stream (e.g., a read stream from Nextcloud or file system)
      fileContent.pipe(res);
    }
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ message: error });
  }
};
