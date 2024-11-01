const express = require('express');
const router = express.Router();

// Controller importieren
const exampleController = require('../controllers/exampleController');

// Routen definieren
router.get('/example', exampleController.getExample);

module.exports = router;