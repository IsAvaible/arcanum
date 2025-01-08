const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");
const multerMiddleware = require("../middlewares/multerMiddleware");
const {
  validateData,
  escapeData,
} = require("../middlewares/validationMiddleware");
const { caseSchema } = require("../schemas/caseSchemas");
const attachmentController = require("../controllers/attachmentController");

/**
 * @route GET /cases/
 * @description Retrieves a list of all cases.
 * @returns {Object[]} 200 - An array of case objects.
 * @returns {Error} 500 - Internal server error.
 */
router.get("/cases/", caseController.showCaseList);

/**
 * @route GET /cases/:id
 * @description Retrieves a single case by its ID.
 * @param {number} id.path.required - The ID of the case to retrieve.
 * @returns {Object} 200 - A case object.
 * @returns {Error} 404 - Case not found.
 * @returns {Error} 500 - Internal server error.
 */
router.get("/cases/:id", caseController.showCaseDetail);

/**
 * @route POST /cases/
 * @description Creates a new case with optional file attachments.
 * @param {string} title.formData.required - The title of the case.
 * @param {string} description.formData.required - The description of the case.
 * @param {string} solution.formData - A possible solution for the case.
 * @param {string} assignee.formData - The assignee of the case.
 * @param {string} status.formData - The status of the case (e.g. "Open").
 * @param {string} case_type.formData - The type of the case (e.g. "Problem", "Incident", "Change", "FAQ").
 * @param {string} priority.formData - The priority of the case (e.g. "Low", "Medium", "High").
 * @param {file} files.formData - One or more files to be attached to the case.
 * @returns {Object} 201 - The created case object.
 * @returns {Error} 400 - Invalid data.
 * @returns {Error} 500 - Internal server error.
 */
router.post(
  "/cases/",
  multerMiddleware,
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

/**
 * @route PUT /cases/:id
 * @description Updates an existing case by its ID with new data and optionally adds new attachments.
 * @param {number} id.path.required - The ID of the case to update.
 * @param {string} [title] - Updated title (min. 3 chars).
 * @param {string} [description] - Updated description.
 * @param {string} [solution] - Updated solution text.
 * @param {string} [assignee] - Updated assignee.
 * @param {string} [status] - Updated status ("Open", "inProgress", "Solved", "Closed").
 * @param {string} [case_type] - Updated case type ("Problem", "Incident", "Change", "FAQ").
 * @param {string} [priority] - Updated priority ("Low", "Medium", "High").
 * @param {string} [draft] - Updated draft state ("true" or "false").
 * @param {file} [files] - Additional files to attach.
 * @returns {Object} 200 - The updated case object including its attachments.
 * @returns {Error} 404 - Case not found.
 * @returns {Error} 500 - Internal server error.
 */
router.put("/cases/:id", multerMiddleware, caseController.updateCase);

/**
 * @route DELETE /cases/:id
 * @description Deletes a case by its ID.
 * @param {number} id.path.required - The ID of the case to delete.
 * @returns {String} 200 - Confirmation message.
 * @returns {Error} 404 - Case not found.
 * @returns {Error} 500 - Internal server error.
 */
router.delete("/cases/:id", caseController.deleteCase);

/**
 * @route GET /cases/:id/attachments/:fileId
 * @description Downloads an attachment of a specific case.
 * @param {number} id.path.required - The ID of the case.
 * @param {number} fileId.path.required - The ID of the attachment to download.
 * @returns {file} 200 - The requested file.
 * @returns {Error} 404 - Case or attachment not found.
 * @returns {Error} 500 - Internal server error.
 */
router.get(
  "/cases/:id/attachments/:fileId",
  attachmentController.downloadAttachment,
);

/**
 * @route POST /cases/:id/attachments
 * @description Adds new attachments to a specified case.
 * @param {number} id.path.required - The ID of the case to add attachments to.
 * @param {file} files.formData.required - One or more files to attach to the case.
 * @returns {Object[]} 201 - The updated list of attachments.
 * @returns {Error} 404 - Case not found.
 * @returns {Error} 500 - Internal server error.
 */
router.post(
  "/cases/:id/attachments",
  attachmentController.addAttachmentsToCase,
);

/**
 * @route DELETE /cases/:id/attachments/:fileId
 * @description Deletes an attachment from a specified case.
 * @param {number} id.path.required - The ID of the case.
 * @param {number} fileId.path.required - The ID of the attachment to delete.
 * @returns {String} 200 - Confirmation message.
 * @returns {Error} 404 - Case or attachment not found.
 * @returns {Error} 500 - Internal server error.
 */
router.delete(
  "/cases/:id/attachments/:fileId",
  attachmentController.deleteAttachmentFromCase,
);

/**
 * @route POST /createCaseFromFiles
 * @description Creates one or multiple new cases based on uploaded files and data returned from an external LLM.
 * The LLM returns case data (title, description, etc.) and references to attachments.
 * @param {file} files.formData.required - Files to process for creating case(s).
 * @param {string} [socketId] - Id of Socket where the Tokens are send to.
 * @returns {Object|Object[]} 201 - The newly created case(s) with attachments.
 * @returns {Object} 200 - If LLM returns a message but no cases, returns an object with { message: string }.
 * @returns {Error} 500 - Internal server error or LLM error.
 */
router.post(
  "/createCaseFromFiles",
  multerMiddleware,
  escapeData(["socketId"]),
  caseController.createCaseFromFiles,
);

/**
 * @route PUT /confirmCase/:id
 * @description Confirms a draft case by removing the draft state and possibly updating other fields.
 * @param {number} id.path.required - The ID of the case to confirm.
 * @param {string} [title] - Updated title.
 * @param {string} [description] - Updated description.
 * @param {string} [solution] - Updated solution.
 * @param {string} [assignee] - Updated assignee.
 * @param {string} [status] - Updated status.
 * @param {string} [case_type] - Updated case type.
 * @param {string} [priority] - Updated priority.
 * @returns {Object} 200 - The confirmed (updated) case with attachments.
 * @returns {Error} 404 - Case not found.
 * @returns {Error} 500 - Internal server error.
 */
router.put("/confirmCase/:id", caseController.confirmCase);

module.exports = router;
