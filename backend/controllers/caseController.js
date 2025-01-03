const { Cases, Attachments, ChangeHistory } = require("../models");
const { body, validationResult } = require("express-validator");
const upload = require("../configs/multerConfig.js");
const attachmentService = require("../services/attachmentService");
const axios = require("axios");
require('dotenv').config();

/**
 * Fetches the details of a specific case, including its attachments.
 * @param {Object} req - Express request object, contains case ID in `req.params.id`.
 * @param {Object} res - Express response object to send case details or errors.
 * @returns {Object} JSON response with case details or an error message.
 */
exports.showCaseDetail = async (req, res) => {
  const caseId = parseInt(req.params.id, 10);
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

    res.json(caseItem);
  } catch (error) {
    console.error("Error fetching case detail:", error);
    res.status(500).json({ message: "Error fetching case detail" });
  }
};

/**
 * Fetches a list of all cases, including their attachments.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send case list or errors.
 * @returns {Object} JSON response with a list of cases or an error message.
 */
exports.showCaseList = async (req, res) => {
  try {
    const casesAll = await Cases.findAll({
      include: [
        {
          model: Attachments,
          as: "attachments",
          through: { attributes: [] },
        },
      ],
    });
    res.json(casesAll);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ message: "Error fetching cases" });
  }
};

/**
 * Deletes a specific case and its attachments if they are not linked to other cases.
 * @param {Object} req - Express request object, contains case ID in `req.params.id`.
 * @param {Object} res - Express response object to send status or errors.
 * @returns {Object} HTTP 204 (No Content) on success or an error message.
 */
exports.deleteCase = async (req, res) => {
  const caseId = parseInt(req.params.id, 10);
  try {
    const caseItemToDelete = await Cases.findByPk(caseId, {
      include: [
        {
          model: Attachments,
          as: "attachments",
          through: { attributes: [] },
        },
      ],
    });

    if (!caseItemToDelete) {
      return res.status(404).json({ message: "Case not found" });
    }

    const attachments = caseItemToDelete.attachments;

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // Remove attachment links and delete orphaned attachments.
        await caseItemToDelete.removeAttachment(attachment);
        await attachmentService.deleteAttachmentIfOrphaned(attachment);
      }
    }

    await ChangeHistory.destroy({ where: { case_id: caseId } });

    await caseItemToDelete.destroy();
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting case:", error);
    res.status(500).json({ message: "Error deleting case" });
  }
};

/**
 * Creates a new case and links uploaded attachments to it.
 * @param {Object} req - Express request object, contains case data and uploaded files.
 * @param {Object} res - Express response object to send the created case or errors.
 * @returns {Object} JSON response with the newly created case or an error message.
 */
exports.createCase = [
  body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),

  async (req, res) => {
    try {
      const {
        title,
        description,
        solution,
        assignee,
        status,
        case_type,
        priority,
      } = req.body;

      // Process uploaded files and create attachments.
      const attachmentInstances =
        await attachmentService.uploadFilesAndCreateAttachments(req.files);

      // Create a new case record in the database.
      const newCase = await Cases.create({
        title,
        description,
        solution,
        assignee,
        status,
        case_type,
        priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Link attachments to the newly created case.
      if (attachmentInstances.length > 0) {
        await newCase.addAttachments(attachmentInstances);
      }
      await ChangeHistory.create({
        case_id: newCase.id,
        updatedAt: new Date(),
      });

      const caseWithAttachments = await Cases.findByPk(newCase.id, {
        include: [
          {
            model: Attachments,
            as: "attachments",
            through: { attributes: [] },
          },
          {
            model: ChangeHistory,
            as: "changeHistory",
          },
        ],
      });
      res.status(201).json(caseWithAttachments);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(500).json({ message: "Error creating case" });
    }
  },
];

/**
 * Updates an existing case with new data and optionally uploads new attachments.
 * @param {Object} req - Express request object, contains case ID, update data, and uploaded files.
 * @param {Object} res - Express response object to send the updated case or errors.
 * @returns {Object} JSON response with the updated case or an error message.
 */
exports.updateCase = [
  async (req, res) => {
    const caseId = parseInt(req.params.id, 10);

    try {
      // Define allowed fields for update
      const allowedFields = [
        "title",
        "description",
        "solution",
        "assignee",
        "status",
        "case_type",
        "priority",
        "draft",
      ];

      // Extract only allowed fields from the request body
      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const caseItem = await Cases.findByPk(caseId);

      if (!caseItem) {
        return res.status(404).json({ message: "Case not found" });
      }

      // Update the case in the database
      const updatedCase = await caseItem.update(updateData);

      if (!updatedCase) {
        return res.status(404).json({ message: "Error updating case" });
      }

      // Process uploaded files and create new attachments
      const attachmentInstances =
          await attachmentService.uploadFilesAndCreateAttachments(req.files);

      if (attachmentInstances.length > 0) {
        await updatedCase.addAttachments(attachmentInstances);
      }

      if (Object.keys(req.body).length > 0) {
        await ChangeHistory.create({
          case_id: caseId,
          updatedAt: new Date(),
        });
      }

      const caseWithAttachments = await Cases.findByPk(caseId, {
        include: [
          {
            model: Attachments,
            as: "attachments",
            through: { attributes: [] },
          },
          {
            model: ChangeHistory,
            as: "changeHistory",
          },
        ],
      });

      res.json(caseWithAttachments);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Error updating case" });
    }
  },
];



/**
 * Creates a new case from uploaded files and data received from an external LLM.
 * @param {Object} req - Express request object, containing uploaded files and optional socket_id in `req.body`.
 * @param {Object} res - Express response object to send the created case(s) or error messages.
 * @returns {Object} JSON response with the created case(s) or an error message.
 */
exports.createCaseFromFiles = [
  // Main request handler.
  async (req, res) => {
    const socket_id = 123;

    try {
      // Process uploaded files and create attachments.
      const attachmentInstances =
        await attachmentService.uploadFilesAndCreateAttachments(req.files);

      // Prepare data to send to the LLM.
      const llmRequestData = {
        socket_id: socket_id,
        attachments: attachmentInstances,
      };

      console.log("Sending to LLM: ", JSON.stringify(llmRequestData));

      // Send data to the LLM endpoint.
      const llmResponse = await axios.post(
        `${process.env.LLM_API_URL}/generate_case`,
        llmRequestData,
      );

      const responseData = llmResponse.data;
      console.log("Received from LLM: ", JSON.stringify(llmResponse.data));

      // Define allowed fields for creating cases.
      const allowedFields = [
        "title",
        "description",
        "solution",
        "assignee",
        "status",
        "case_type",
        "priority",
        "attachments",
      ];

      if (responseData.cases) {
        // Ensure cases is always an array.
        const casesArray = Array.isArray(responseData.cases)
          ? responseData.cases
          : [responseData.cases];

        let newIds = [];

        for (const caseData of casesArray) {
          let attachments = [];
          let extrCase = {};

          // Extract only allowed fields from the response.
          allowedFields.forEach((field) => {
            if (caseData[field] !== undefined) {
              if (field === "attachments") {
                attachments = caseData[field];
              } else if (
                field === "assignee" &&
                typeof caseData[field] === "string"
              ) {
                extrCase[field] = JSON.parse(caseData[field]);
              } else {
                extrCase[field] = caseData[field];
              }
            }
          });

          extrCase["draft"] = true; // Mark as draft initially.

          // Create a new case in the database.
          const newCase = await Cases.create(extrCase);
          newIds.push(newCase.id);

          // Link attachments to the new case.
          if (attachments && attachments.length > 0) {
            const attachmentInstances = await Attachments.findAll({
              where: { id: attachments },
            });

            await newCase.addAttachments(attachmentInstances);
          }
        }

        // Fetch all created cases with their attachments.
        const casesAll = await Cases.findAll({
          where: { id: newIds },
          include: [
            {
              model: Attachments,
              as: "attachments",
              through: { attributes: [] },
            },
          ],
        });

        console.log("Created Case(s): ", JSON.stringify(casesAll));

        // Send the created cases as the response.
        res.status(201).json(casesAll);
      } else if (responseData.message) {
        // If the LLM returned a message, send it to the client.
        res.status(200).json({ message: responseData.message });
      } else {
        // Handle cases where the LLM returned no data.
        res.status(500).json({ message: "LLM returned no data" });
      }
    } catch (error) {
      console.error("Error in createCaseFromFiles:", error);
      res.status(500).json({ message: error.message || "Error creating case" });
    }
  },
];

/**
 * Confirms and updates a draft case, marking it as finalized.
 * @param {Object} req - Express request object, containing case ID in `req.params.id` and update data in `req.body`.
 * @param {Object} res - Express response object to send the updated case or an error message.
 * @returns {Object} JSON response with the updated case or an error message.
 */
exports.confirmCase = [
  async (req, res) => {
    const caseId = parseInt(req.params.id, 10);

    try {
      const allowedFields = [
        "title",
        "description",
        "solution",
        "assignee",
        "status",
        "case_type",
        "priority",
      ];

      // Extract only allowed fields from the request body.
      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      updateData["draft"] = false;

      // Update the case in the database.
      const [updatedRows] = await Cases.update(updateData, {
        where: { id: caseId },
      });

      if (updatedRows === 0) {
        return res.status(404).json({ message: "Case not found" });
      }

      // Fetch the updated case with its attachments.
      const updatedCaseWithAttachments = await Cases.findByPk(caseId, {
        include: [
          {
            model: Attachments,
            as: "attachments",
            through: { attributes: [] }, // Exclude join table attributes.
          },
        ],
      });

      // Send the updated case as the response.
      res.json(updatedCaseWithAttachments);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Error updating case" });
    }
  },
];