const express = require("express");
const router = express.Router();
const glossaryController = require("../controllers/glossaryController");
const {
  validateData,
  escapeData,
} = require("../middlewares/validationMiddleware");
const { glossarySchema } = require("../schemas/glossarySchemas");
const multerMiddleware = require("../middlewares/multerMiddleware");

// --- Glossary-Routen ---
router.get("/glossary", glossaryController.getAllGlossaryEntries);

// "find" nach Query-Parameter (z. B. /glossary/find?term=MIG4300Pro)
router.get(
  "/glossary/find",
  escapeData(["term"]),
  glossaryController.findGlossaryEntries,
);
router.get("/glossary/:id", glossaryController.getGlossaryEntryById);

// Create, Update and delete Glossary
router.post(
  "/glossary",
  multerMiddleware,
  escapeData(["term"]),
  validateData(glossarySchema),
  glossaryController.createGlossaryEntry,
);
router.put(
  "/glossary/:id",
  multerMiddleware,
  escapeData(["term"]),
  validateData(glossarySchema),
  glossaryController.updateGlossaryEntry,
);
router.delete("/glossary/:id", glossaryController.deleteGlossaryEntry);
router.post(
  "/glossary/:id/upload",
  multerMiddleware,
  glossaryController.uploadAttachmentToGossary,
);

// Add attachments/cases to a glossary
router.post(
  "/glossary/:id/attachments/:attachmentId",
  glossaryController.addAttachmentToGlossary,
);
router.post(
  "/glossary/:id/cases/:caseId",
  glossaryController.addCaseToGlossary,
);

// Remove attachments/cases from a glossary
router.delete(
  "/glossary/:id/attachments/:attachmentId",
  glossaryController.deleteAttachmentFromGlossary,
);
router.delete(
  "/glossary/:id/cases/:caseId",
  glossaryController.deleteCaseFromGlossary,
);

module.exports = router;
