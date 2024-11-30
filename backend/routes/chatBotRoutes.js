const express = require('express');
const router = express.Router();
const chatBotController = require('../controllers/chatBotController');





router.post('/createCaseFromFiles', chatBotController.createCaseFromFiles);

router.put('/confirmCase/:id', chatBotController.confirmCase);



module.exports = router;