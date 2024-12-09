const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");
const {
  validateData,
  escapeData,
} = require("../middlewares/validationMiddleware");
const { caseSchema } = require("../schemas/caseSchemas");
const attachmentController = require("../controllers/attachmentController");
//const caseListController = require('../controllers/caseListController');
//const caseDetailController = require('../controllers/caseDetailController');

// Route für die Liste aller Fälle
//router.get('/', caseListController.showCaseList);
router.get("/", caseController.showCaseList);
router.get("/:id", caseController.showCaseDetail);

router.post(
  "/",
  escapeData([
    "title",
    "description",
    "solution",
    "assignee",
    "status",
    "case_type",
    "priority",
  ]),
  validateData(caseSchema),
  caseController.createCase,
);

router.put("/:id", caseController.updateCase);
router.delete("/:id", caseController.deleteCase);

router.get("/:id/attachments/:fileId", attachmentController.downloadAttachment);
router.post("/:id/attachments", attachmentController.addAttachmentsToCase);
router.delete(
  "/:id/attachments/:fileId",
  attachmentController.deleteAttachmentFromCase,
);

module.exports = router;
