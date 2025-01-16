const { Op } = require('sequelize');
const { Glossary, Attachments, Cases } = require('../models'); 
const { StatusCodes } = require('http-status-codes');
const attachmentService = require("../services/attachmentService");


module.exports = {
  /**
   * @route GET /glossary
   * @description Retrieves all glossary entries.
   * @returns {Object[]} 200 - An array of all glossary entries.
   * @returns {Error} 500 - Internal server error.
   */
  getAllGlossaryEntries: async (req, res) => {
    try {
      const glossaries = await Glossary.findAll();
      return res.json(glossaries);
    } catch (error) {
      console.error('Error in getAllGlossaryEntries:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch glossary entries.' });
    }
  },

  /**
   * @route GET /glossary/:id
   * @description Retrieves a single glossary entry by ID, including linked attachments and cases.
   * @param {number} id.path.required - The ID of the glossary entry.
   * @returns {Object} 200 - The glossary entry with associated attachments and cases.
   * @returns {Error} 404 - If the glossary entry is not found.
   * @returns {Error} 500 - Internal server error.
   */
  getGlossaryEntryById: async (req, res) => {
    const { id } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id, {
        include: [
          {
            model: Attachments,
            as: "relatedAttachments",
            through: { attributes: [] },
          },
          {
            model: Cases,
            as: "relatedCases",
            through: { attributes: [] },
          }
        ],
      });
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }
      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in getGlossaryEntryById:', error);
      return res.status(500).json({ message: error.message || 'Failed to fetch glossary entry.' });
    }
  },

    /**
   * @route POST /glossary
   * @description Creates a new glossary entry.
   * @param {string} term.body.required - The term (title) of the glossary entry.
   * @returns {Object} 201 - The newly created glossary entry.
   * @returns {Error} 400 - If term is missing or invalid.
   * @returns {Error} 500 - Internal server error.
   */
  createGlossaryEntry: async (req, res) => {
    try {
      // Beispielhafte Felder: term, definition
      const { term } = req.body;
      if (!term) {
        return res.status(400).json({ message: 'Field "term" is required.' });
      }
      const newEntry = await Glossary.create({
        term,
      });
      return res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error in createGlossaryEntry:', error);
      return res.status(500).json({ message: error.message || 'Failed to create glossary entry.' });
    }
  },

  /**
   * @route PUT /glossary/:id
   * @description Updates an existing glossary entry by ID.
   * @param {number} id.path.required - The ID of the glossary entry to update.
   * @param {string} term.body - The new term (title) for the glossary entry.
   * @param {string} definition.body - The new definition for the glossary entry.
   * @returns {StatusCodes} 204 - The updated was succesfull.
   * @returns {Error} 404 - If the glossary entry is not found.
   * @returns {Error} 500 - Internal server error.
   */
  updateGlossaryEntry: async (req, res) => {
    const { id } = req.params;
    const { term } = req.body;
    try {
      // Eintrag suchen
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }
      // Felder aktualisieren
      if (term !== undefined) {
        glossaryEntry.term = term;
      }

      await glossaryEntry.save();
      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in updateGlossaryEntry:', error);
      return res.status(500).json({ message: error.message || 'Failed to update glossary entry.' });
    }
  },

   /**
   * @route DELETE /glossary/:id
   * @description Deletes a glossary entry by ID.
   * @param {number} id.path.required - The ID of the glossary entry to delete.
   * @returns {Object} 204 - Indicating the entry was deleted.
   * @returns {Error} 404 - If the glossary entry is not found.
   * @returns {Error} 500 - Internal server error.
   */
  deleteGlossaryEntry: async (req, res) => {
    const { id } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }
      await glossaryEntry.destroy();
      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteGlossaryEntry:', error);
      return res.status(500).json({ message: error.message || 'Failed to delete glossary entry.' });
    }
  },

  /**
   * @route GET /glossary/find?term=TERM
   * @description Finds glossary entries by the given term substring.
   * @param {string} term.query.required - The term to be searched.
   * @returns {Object[]} 200 - An array of matching glossary entries.
   * @returns {Object} 200 - If no results, returns a message about no matches found.
   * @returns {Error} 400 - Missing 'term' query parameter.
   * @returns {Error} 500 - Internal server error.
   */
  findGlossaryEntries: async (req, res) => {
    const { term } = req.query;
    try {
      if (!term) {
        return res.status(400).json({ message: 'A "term" query parameter is required.' });
      }

      // Suche nach Glossary-Einträgen, bei denen 'term' den gesuchten String enthält
      const results = await Glossary.findAll({
        where: {
          term: {
            [Op.like]: `%${term}%`
          }
        }
      });

      if (!results || results.length === 0) {
        return res.json({ message: 'No matching glossary entries found.' });
      }

      return res.json(results);
    } catch (error) {
      console.error('Error in findGlossaryEntries:', error);
      return res.status(500).json({ message: error.message || 'Failed to search glossary.' });
    }
  },
  /**
   * @route POST /glossary/:id/attachments/:attachmentId
   * @description Adds an existing attachment to a glossary entry via n:m relationship.
   * @param {number} id.path.required - The ID of the glossary entry.
   * @param {number} attachmentId.path.required - The ID of the attachment to be associated.
   * @returns {Object} 200 - The updated glossary entry with its associated attachments.
   * @returns {Error} 404 - Glossary entry or attachment not found.
   * @returns {Error} 500 - Internal server error.
   */
  addAttachmentToGlossary: async (req, res) => {
    const { id, attachmentId } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id, {
        include: [{ model: Attachments, as: 'relatedAttachments' }]
      });
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }

      const attachment = await Attachments.findByPk(attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found.' });
      }

      await glossaryEntry.addRelatedAttachments(attachment); 

      // Reload to get the updated list of attachments
      await glossaryEntry.reload({
        include: [{ model: Attachments, as: 'relatedAttachments' }]
      });

      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in addAttachmentToGlossary:', error);
      return res
        .status(500)
        .json({ message: error.message || 'Failed to associate attachment.' });
    }
  },

  /**
   * @route POST /glossary/:id/cases/:caseId
   * @description Adds an existing case to a glossary entry via n:m relationship.
   * @param {number} id.path.required - The ID of the glossary entry.
   * @param {number} caseId.path.required - The ID of the case to be associated.
   * @returns {Object} 200 - The updated glossary entry with its associated cases.
   * @returns {Error} 404 - Glossary entry or case not found.
   * @returns {Error} 500 - Internal server error.
   */
  addCaseToGlossary: async (req, res) => {
    const { id, caseId } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id, {
        include: [{ model: Cases, as: 'relatedCases' }]
      });
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }

      const theCase = await Cases.findByPk(caseId);
      if (!theCase) {
        return res.status(404).json({ message: 'Case not found.' });
      }

      await glossaryEntry.addRelatedCases(theCase);

      // Reload to get the updated list of cases
      await glossaryEntry.reload({
        include: [{ model: Cases, as: 'relatedCases' }]
      });

      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in addCaseToGlossary:', error);
      return res
        .status(500)
        .json({ message: error.message || 'Failed to associate case.' });
    }
  },

  /**
   * @route DELETE /glossary/:id/attachments/:attachmentId
   * @description Removes an existing attachment from a glossary entry via n:m relationship.
   * @param {number} id.path.required - The ID of the glossary entry.
   * @param {number} attachmentId.path.required - The ID of the attachment to be dissociated.
   * @returns {Object} 200 - The updated glossary entry with its associated attachments.
   * @returns {Error} 404 - Glossary entry or attachment not found.
   * @returns {Error} 500 - Internal server error.
   */
  deleteAttachmentFromGlossary: async (req, res) => {
    const { id, attachmentId } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id, {
        include: [{ model: Attachments, as: 'relatedAttachments' }]
      });
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }

      const attachment = await Attachments.findByPk(attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found.' });
      }

      await glossaryEntry.removeRelatedAttachments(attachment);
      await attachmentService.deleteAttachmentIfOrphaned(attachment);

      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteAttachmentFromGlossary:', error);
      return res
        .status(500)
        .json({ message: error.message || 'Failed to remove attachment.' });
    }
  },

  /**
   * @route DELETE /glossary/:id/cases/:caseId
   * @description Removes an existing case from a glossary entry via n:m relationship.
   * @param {number} id.path.required - The ID of the glossary entry.
   * @param {number} caseId.path.required - The ID of the case to be dissociated.
   * @returns {StatusCodes} 204 - The updated was succesfull.
   * @returns {Error} 404 - Glossary entry or case not found.
   * @returns {Error} 500 - Internal server error.
   */
  deleteCaseFromGlossary: async (req, res) => {
    const { id, caseId } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id, {
        include: [{ model: Cases, as: 'relatedCases' }]
      });
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }

      const theCase = await Cases.findByPk(caseId);
      if (!theCase) {
        return res.status(404).json({ message: 'Case not found.' });
      }

      await glossaryEntry.removeRelatedCases(theCase);


      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteCaseFromGlossary:', error);
      return res
        .status(500)
        .json({ message: error.message || 'Failed to remove case.' });
    }
  },


  uploadAttachmentToGossary: async (req, res) => {
    const { id } = req.params;
    try {
    
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ message: 'Glossary entry not found.' });
      }
    
      // Process uploaded files and create attachments.  
      const attachmentInstances = await attachmentService.uploadFilesAndCreateAttachments(req.files);
      if (attachmentInstances.length > 0) {
        await glossaryEntry.addRelatedAttachments(attachmentInstances);
      }

      await glossaryEntry.reload({
        include: [{ model: Attachments, as: 'relatedAttachments' }]
      });

      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in uploadAttachmentToGossary:', error);
      return res
        .status(500)
        .json({ message: error.message || 'Failed to add Attachmets.' });
    }
  },
};