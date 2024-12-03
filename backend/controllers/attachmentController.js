const { Cases, Attachments } = require('../models');
const multer = require('multer');
const path = require('path');
const fileUploadController = require('../controllers/fileuploadController');
const attachmentService = require('../services/attachmentService');
const multerMiddleware = require('../middlewares/multerMiddleware');



exports.addAttachmentsToCase = [
    multerMiddleware,
    async (req, res) => {
        const caseId = parseInt(req.params.id, 10);
        try {
            const caseItem = await Cases.findByPk(caseId);
            if (!caseItem) {
                return res.status(404).json({ message: 'Case not found' });
            }

            const attachmentInstances = await attachmentService.uploadFilesAndCreateAttachments(req.files);

            if (attachmentInstances.length > 0) {
                await caseItem.addAttachments(attachmentInstances);
            }

            const caseWithAttachments = await Cases.findByPk(caseId, {
                include: [{
                    model: Attachments,
                    as: 'attachments',
                    through: { attributes: [] }
                }]
            });
            res.json(caseWithAttachments);

        } catch (error) {
            console.error('Error adding attachments to case:', error);
            res.status(500).json({ message: 'Error adding attachments to case' });
        }
    }
];


exports.deleteAttachmentFromCase = async (req, res) => {
    const caseId = parseInt(req.params.id, 10);
    const fileId = parseInt(req.params.fileId, 10);
    try {
        const caseItem = await Cases.findByPk(caseId, {
            include: [{
                model: Attachments,
                as: 'attachments',
                through: { attributes: [] }
            }]
        });
    
        if (!caseItem) {
            return res.status(404).json({ message: 'Case not found' });
        }
        
          // **Attachment abrufen und prüfen, ob es mit dem Case verknüpft ist**
          const attachment = await Attachments.findOne({
            where: { id: fileId },
            include: [{
                model: Cases,
                as: 'cases',
                where: { id: caseId },
                through: { attributes: [] }
            }]
        });
    
          if (!attachment) {
            return res.status(404).json({ message: 'Attachment not found' });
          }
    

        // Verknüpfung zwischen Case und Attachment entfernen
        await caseItem.removeAttachment(attachment);

        // Attachment löschen, wenn es mit keinem anderen Case verknüpft ist
        await attachmentService.deleteAttachmentIfOrphaned(attachment);

        res.status(204).send();

    } catch (error) {
        console.error('Error deleting attachment from case:', error);
        res.status(500).json({ message: 'Error deleting attachment from case' });
    }
};