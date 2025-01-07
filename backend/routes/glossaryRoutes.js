const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossaryController');

// --- Glossary-Routen ---
router.get('/glossary', glossaryController.getAllGlossaryEntries);

// "find" nach Query-Parameter (z. B. /glossary/find?term=MIG4300Pro)
router.get('/glossary/find', glossaryController.findGlossaryEntries);
router.get('/glossary/:id', glossaryController.getGlossaryEntryById);

// Create, Update and delete Glossary
router.post('/glossary', glossaryController.createGlossaryEntry);
router.put('/glossary/:id', glossaryController.updateGlossaryEntry);
router.delete('/glossary/:id', glossaryController.deleteGlossaryEntry);

// Add attachments/cases to a glossary
router.post('/glossary/:id/attachments/:attachmentId', glossarController.addAttachmentToGlossary);
router.post('/glossary/:id/cases/:caseId', glossarController.addCaseToGlossary);

// Remove attachments/cases from a glossary
router.delete('/glossary/:id/attachments/:attachmentId', glossarController.deleteAttachmentFromGlossary);
router.delete('/glossary/:id/cases/:caseId', glossarController.deleteCaseFromGlossary);


module.exports = router;
