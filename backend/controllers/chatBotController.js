const { Cases, Attachments } = require("../models");
const nextCloud = require("./nextCloudUploaderController.js");
const path = require("path");
const fileUploadController = require("../controllers/fileuploadController");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const attachmentService = require("../services/attachmentService");
const multerMiddleware = require("../middlewares/multerMiddleware");
const axios = require("axios");

/**
 * Creates a new case from uploaded files and data received from an external LLM.
 * @param {Object} req - Express request object, containing uploaded files and optional socket_id in `req.body`.
 * @param {Object} res - Express response object to send the created case(s) or error messages.
 * @returns {Object} JSON response with the created case(s) or an error message.
 */
exports.createCaseFromFiles = [
  // Middleware for handling file uploads.
  multerMiddleware,

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
        "http://host.docker.internal:5001/generate_case",
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
