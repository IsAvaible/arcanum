const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossaryController');

// --- Glossary-Routen ---
router.get('/glossary', glossaryController.getAllGlossaryEntries);
router.get('/glossary/:id', glossaryController.getGlossaryEntryById);

// Neu hinzugefügt:
router.post('/glossary', glossaryController.createGlossaryEntry);
router.put('/glossary/:id', glossaryController.updateGlossaryEntry);
router.delete('/glossary/:id', glossaryController.deleteGlossaryEntry);

// "find" nach Query-Parameter (z. B. /glossary/find?term=MIG4300Pro)
router.get('/glossary/find', glossaryController.findGlossaryEntries);

module.exports = router;
