const express = require('express');
const router = express.Router();
//const caseListController = require('../controllers/caseListController');
//const caseDetailController = require('../controllers/caseDetailController');
const caseController = require('../controllers/caseController');



// Route für die Liste aller Fälle
//router.get('/', caseListController.showCaseList);
router.get('/', caseController.showCaseList);
router.get('/:id', caseController.showCaseDetail);

router.post('/', caseController.createCase);
router.put('/:id', caseController.updateCase);
router.delete('/:id', caseController.deleteCase);
router.post('/:id/attachments', caseController.updateCase);
router.get('/:caseId/attachments/:filename', caseController.downloadAttachment);



// Route für die Details eines Falls
//router.get('/:id', caseDetailController.showCaseDetail);

// Route zum Löschen eines Falls
//router.post('/:id/delete', caseListController.deleteCase);




module.exports = router;
