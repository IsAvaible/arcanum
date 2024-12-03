const express = require('express');
const router = express.Router();
//const caseListController = require('../controllers/caseListController');
//const caseDetailController = require('../controllers/caseDetailController');
const caseController = require('../controllers/caseController');
const attachmentController = require('../controllers/attachmentController')


// Route für die Liste aller Fälle
//router.get('/', caseListController.showCaseList);
router.get('/', caseController.showCaseList);
router.get('/:id', caseController.showCaseDetail);

router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);
router.get('/:caseId/attachment/:fileId', caseController.downloadAttachment);

router.post('/:id/attachments', attachmentController.addAttachmentsToCase);
router.delete('/:id/attachment/:fileId', attachmentController.deleteAttachmentFromCase);






module.exports = router;
