const { Cases, Attachments, Glossary, ChangeHistory } = require("../models");
const { body, validationResult } = require("express-validator");
const upload = require("../configs/multerConfig.js");
const attachmentService = require("../services/attachmentService");
const axios = require("axios");
require("dotenv").config();

/**
 * Fetches the details of a specific case, including its attachments.
 * @param {Object} req - Express request object, contains case ID in `req.params.id`.
 * @param {Object} res - Express response object to send case details or errors.
 * @returns {Object} JSON response with case details or an error message.
 */
exports.showCaseDetail = async (req, res) => {
  const caseId = parseInt(req.params.id, 10); // Überprüfen, ob caseId korrekt geparst wird
  try {
    const caseItem = await Cases.findByPk(caseId, {
      include: [
        {
          model: Attachments,
          as: "attachments",
          through: { attributes: [] },
        },
        {
          model: ChangeHistory,
          as: "changeHistory",
          attributes: ["updatedAt"], // Stelle sicher, dass der Spaltenname korrekt ist
        },
        {
          model: Glossary,
          as: "glossary",
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

    const deletedAttachmentIds = [];

    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        // Remove attachment links and delete orphaned attachments.
        await caseItemToDelete.removeAttachment(attachment);
        const deletedId =
          await attachmentService.deleteAttachmentIfOrphaned(attachment);

        if (deletedId) {
          deletedAttachmentIds.push(deletedId);
        }
      }
    }

    await ChangeHistory.destroy({ where: { caseId: caseId } });

    await caseItemToDelete.destroy();

    const llmRequestData = {
      caseId: caseId,
      attachmentIds: deletedAttachmentIds,
    };

    console.log("Sending to LLM: ", JSON.stringify(llmRequestData));

    // Send data to the LLM endpoint.
    const llmResponse = axios.post(
      `${process.env.LLM_API_URL}/delete_from_vector_db`,
      llmRequestData,
    );

    //const responseData = llmResponse.data;
    console.log("Received from LLM: ", JSON.stringify(llmResponse.data));

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
        caseId: newCase.id,
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
          caseId: caseId,
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
 * @param {Object} req - Express request object, containing uploaded files and socket_id in `req.body`.
 * @param {Object} res - Express response object to send the created case(s) or error messages.
 * @returns {Object} JSON response with the created case(s) or an error message.
 */
exports.createCaseFromFiles = [
  // Main request handler.
  async (req, res) => {
    try {
      const { socketId } = req.body;
      // Process uploaded files and create attachments.
      const attachmentInstances =
        await attachmentService.uploadFilesAndCreateAttachments(req.files);

      // Prepare data to send to the LLM.
      const llmRequestData = {
        socket_id: socketId,
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

      if (responseData.cases && Array.isArray(responseData.cases)) {
        const newCaseIds = [];
        for (const caseData of responseData.cases) {
          // A) CASE speichern
          const newCase = await Cases.create({
            title: caseData.title,
            description: caseData.description,
            solution: caseData.solution,
            status: caseData.status,
            assignee: caseData.assignee,
            case_type: caseData.case_type,
            priority: caseData.priority,
            draft: true,
          });

          if (Array.isArray(caseData.glossary)) {
            for (const glossaryTerm of caseData.glossary) {
              // findOrCreate => [instanz, created]
              const [glossaryInstance] = await Glossary.findOrCreate({
                where: { term: glossaryTerm },
                defaults: { term: glossaryTerm },
              });
              await newCase.addGlossary(glossaryInstance);
            }
          }

          if (Array.isArray(caseData.attachments)) {
            // IDs extrahieren
            const attachmentIds = caseData.attachments.map((att) => att.id);

            // Datenbank-Instanzen finden
            const foundAttachments = await Attachments.findAll({
              where: { id: attachmentIds },
            });
            await newCase.addAttachments(foundAttachments);

            // Attachment-Glossar
            for (const attObj of caseData.attachments) {
              const attachInst = foundAttachments.find(
                (a) => a.id === attObj.id,
              );
              if (!attachInst) continue;

              if (Array.isArray(attObj.glossary)) {
                for (const term of attObj.glossary) {
                  const [glossaryInstance] = await Glossary.findOrCreate({
                    where: { term },
                    defaults: { term },
                  });
                  await attachInst.addGlossary(glossaryInstance);
                }
              }
            }
          }

          newCaseIds.push(newCase.id);
        }

        // Fetch all created cases with their attachments.
        const casesAll = await Cases.findAll({
          where: { id: newCaseIds },
          include: [
            {
              model: Glossary,
              as: "glossary", // Muss zu den Associations passen
              through: { attributes: [] },
            },
            {
              model: Attachments,
              as: "attachments",
              through: { attributes: [] },
              include: [
                {
                  model: Glossary,
                  as: "glossary",
                  through: { attributes: [] },
                },
              ],
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
      res
        .status(500)
        .json({
          message: error.response.data.message || "Error creating case",
        });
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

      console.log(
        "Sending to LLM: ",
        JSON.stringify(updatedCaseWithAttachments),
      );

      // Send data to the LLM endpoint.
      const llmResponse = await axios.post(
        `${process.env.LLM_API_URL}/save_to_vector_db`,
        updatedCaseWithAttachments,
      );

      //const responseData = llmResponse.data;
      console.log("Received from LLM: ", JSON.stringify(llmResponse.data));

      // Send the updated case as the response.
      res.json(updatedCaseWithAttachments);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(500).json({ message: "Error updating case" });
    }
  },
];
