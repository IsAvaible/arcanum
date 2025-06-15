const { Cases, Attachments } = require("../models");
const attachmentService = require("../services/attachmentService");
const multerMiddleware = require("../middlewares/multerMiddleware");
const nextCloud = require("./nextCloudUploaderController.js");

/**
 * Adds attachments to a specific case.
 *
 * - Purpose: Handles file uploads, links uploaded files to a case, and retrieves the updated case with attachments.
 * - Parameters:
 *   - `req`: The request object containing `params.id` (case ID) and `files` (uploaded files).
 *   - `res`: The response object to send the updated case or error messages.
 * - Returns: Sends the updated case (with attachments) as JSON or an error message if the operation fails.
 */
exports.addAttachmentsToCase = [
  multerMiddleware, // Middleware to handle file uploads
  async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    try {
      // Find the case by ID
      const caseItem = await Cases.findByPk(caseId);
      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      // Upload files and create attachment records
      const attachmentInstances =
        await attachmentService.uploadFilesAndCreateAttachments(req.files);

      // Link attachments to the case if any were uploaded
      if (attachmentInstances.length > 0) {
        await caseItem.addAttachments(attachmentInstances);
      }

      // Fetch the updated case with its attachments
      const caseWithAttachments = await Cases.findByPk(caseId, {
        include: [
          {
            model: Attachments,
            as: "attachments",
            through: { attributes: [] }, // Exclude join table data
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

/**
 * Deletes an attachment from a specific case.
 *
 * - Purpose: Removes the link between a case and an attachment, and deletes the attachment if it is no longer linked to any cases.
 * - Parameters:
 *   - `req`: The request object containing `params.id` (case ID) and `params.attachmentId` (attachment ID).
 *   - `res`: The response object to send the status or error messages.
 * - Returns: Sends a 204 No Content status if successful or an error message if it fails.
 */
exports.deleteAttachmentFromCase = async (req, res) => {
  const caseId = parseInt(req.params.id, 10);
  const attachmentId = parseInt(req.params.attachmentId, 10);
  try {
    // Find the case by ID, including its attachments
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

    // Find the attachment linked to the case
    const attachment = await Attachments.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Remove the link between the case and the attachment
    await caseItem.removeAttachment(attachment);

    // Delete the attachment if it is not linked to any other cases
    await attachmentService.deleteAttachmentIfOrphaned(attachment);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting attachment from case:", error);
    res.status(500).json({ message: "Error deleting attachment from case" });
  }
};

/**
 * Retrieves an attachment from a specific case.
 *
 * - Purpose: Retrieves a specific attachment linked to a case.
 * - Parameters:
 *  - `req`: The request object containing `params.id` (case ID) and `params.attachmentId` (attachment ID).
 *  - `res`: The response object to send the attachment or an error message.
 *  - Returns: Sends the attachment as JSON or an error message if it fails.
 */
exports.getAttachment = async (req, res) => {
  const { id, attachmentId } = req.params;

  try {
    if (id !== undefined) {
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
    }

    // Find the attachment linked to the case
    const attachment = await Attachments.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json(attachment);
  } catch (error) {
    console.error("Error retrieving attachment:", error);
    res.status(500).json({ message: error });
  }
};

/**
 * Downloads an attachment from a specific case.
 *
 * - Purpose: Retrieves and streams an attachment file to the client.
 * - Parameters:
 *   - `req`: The request object containing `params.id` (case ID) and `params.attachmentId` (attachment ID).
 *   - `res`: The response object to send the file or an error message.
 * - Returns: Sends the file as an attachment to the client or an error message if it fails.
 */
exports.downloadAttachment = async (req, res) => {
  const { id, attachmentId } = req.params;

  try {
    if (id !== undefined) {
      // Find the case by ID, including its attachments
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
    }

    // Find the attachment linked to the case
    const attachment = await Attachments.findOne({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Attempt to stream or download the file from Nextcloud
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

    // Send the file to the client
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.filename}"`,
    );
    res.setHeader("Content-Type", attachment.mimetype);
    res.setHeader("Content-Length", attachment.size);

    if (Buffer.isBuffer(fileContent)) {
      res.send(fileContent);
    } else {
      fileContent.pipe(res); // If fileContent is a stream
    }
  } catch (error) {
    console.error("Error downloading attachment:", error);
    res.status(500).json({ message: error });
  }
};
