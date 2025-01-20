const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossaryController');
const {
    authenticateJWT,
    validateData,
    escapeData,
  } = require("../middlewares/validationMiddleware");
  const { glossarySchema } = require("../schemas/glossarySchemas");


// --- Glossary-Routen ---
router.get('/glossary',authenticateJWT , glossaryController.getAllGlossaryEntries);

// "find" nach Query-Parameter (z. B. /glossary/find?term=MIG4300Pro)
router.get('/glossary/find', authenticateJWT, escapeData(["term",]), glossaryController.findGlossaryEntries);
router.get('/glossary/:id', authenticateJWT, glossaryController.getGlossaryEntryById);

// Create, Update and delete Glossary
router.post('/glossary', authenticateJWT, escapeData(["term",]), validateData(glossarySchema), glossaryController.createGlossaryEntry);
router.put('/glossary/:id', authenticateJWT, escapeData(["term",]), validateData(glossarySchema), glossaryController.updateGlossaryEntry);
router.delete('/glossary/:id', authenticateJWT, glossaryController.deleteGlossaryEntry);

// Add attachments/cases to a glossary
router.post('/glossary/:id/attachments/:attachmentId', authenticateJWT,  glossaryController.addAttachmentToGlossary);
router.post('/glossary/:id/cases/:caseId', authenticateJWT, glossaryController.addCaseToGlossary);

// Remove attachments/cases from a glossary
router.delete('/glossary/:id/attachments/:attachmentId', authenticateJWT, glossaryController.deleteAttachmentFromGlossary);
router.delete('/glossary/:id/cases/:caseId', authenticateJWT, glossaryController.deleteCaseFromGlossary);


module.exports = router;
