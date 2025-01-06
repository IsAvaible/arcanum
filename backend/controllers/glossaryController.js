const { Op } = require('sequelize');
const { Glossary } = require('../models'); 
// oder Glossary / Glossarys, je nachdem wie dein Modell heißt

module.exports = {
  /**
   * 1) Alle Glossary-Einträge abrufen
   * GET /glossary
   */
  getAllGlossaryEntries: async (req, res) => {
    try {
      const glossaries = await Glossary.findAll();
      return res.json(glossaries);
    } catch (error) {
      console.error('Error in getAllGlossaryEntries:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen der Glossary-Einträge.' });
    }
  },

  /**
   * 2) Einzelnen Glossary-Eintrag abrufen
   * GET /glossary/:id
   */
  getGlossaryEntryById: async (req, res) => {
    const { id } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ error: 'Glossary-Eintrag nicht gefunden.' });
      }
      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in getGlossaryEntryById:', error);
      return res.status(500).json({ error: 'Fehler beim Abrufen des Glossary-Eintrags.' });
    }
  },

  /**
   * 3) Neuen Glossary-Eintrag erstellen
   * POST /glossary
   */
  createGlossaryEntry: async (req, res) => {
    try {
      // Beispielhafte Felder: term, definition
      const { term, definition } = req.body;
      if (!term) {
        return res.status(400).json({ error: 'Feld "term" wird benötigt.' });
      }
      const newEntry = await Glossary.create({
        term,
        definition: definition || null
      });
      return res.status(201).json(newEntry);
    } catch (error) {
      console.error('Error in createGlossaryEntry:', error);
      return res.status(500).json({ error: 'Fehler beim Erstellen des Glossary-Eintrags.' });
    }
  },

  /**
   * 4) Vorhandenen Glossary-Eintrag aktualisieren
   * PUT /glossary/:id
   */
  updateGlossaryEntry: async (req, res) => {
    const { id } = req.params;
    const { term, definition } = req.body;
    try {
      // Eintrag suchen
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ error: 'Glossary-Eintrag nicht gefunden.' });
      }
      // Felder aktualisieren
      if (term !== undefined) {
        glossaryEntry.term = term;
      }
      if (definition !== undefined) {
        glossaryEntry.definition = definition;
      }

      await glossaryEntry.save();
      return res.json(glossaryEntry);
    } catch (error) {
      console.error('Error in updateGlossaryEntry:', error);
      return res.status(500).json({ error: 'Fehler beim Aktualisieren des Glossary-Eintrags.' });
    }
  },

  /**
   * 5) Glossary-Eintrag löschen
   * DELETE /glossary/:id
   */
  deleteGlossaryEntry: async (req, res) => {
    const { id } = req.params;
    try {
      const glossaryEntry = await Glossary.findByPk(id);
      if (!glossaryEntry) {
        return res.status(404).json({ error: 'Glossary-Eintrag nicht gefunden.' });
      }
      await glossaryEntry.destroy();
      return res.json({ message: 'Glossary-Eintrag erfolgreich gelöscht.' });
    } catch (error) {
      console.error('Error in deleteGlossaryEntry:', error);
      return res.status(500).json({ error: 'Fehler beim Löschen des Glossary-Eintrags.' });
    }
  },

  /**
   * 6) Glossary-Einträge nach Suchbegriff finden
   * GET /glossary/find?term=MIG4300Pro
   */
  findGlossaryEntries: async (req, res) => {
    const { term } = req.query;
    try {
      if (!term) {
        return res.status(400).json({ error: 'Es muss ein "term"-Parameter übergeben werden.' });
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
        return res.json({ message: 'Keine passenden Glossary-Einträge gefunden.' });
      }

      return res.json(results);
    } catch (error) {
      console.error('Error in findGlossaryEntries:', error);
      return res.status(500).json({ error: 'Fehler bei der Glossary-Suche.' });
    }
  }
};