const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Erstellt neuen Chat und gibt ID zurück
router.get('/chats', chatController.createNewChat);

// Gibt alle Nachrichten eines Chats zurück
router.get('/chats/:id', chatController.getChatMessages);

// Speichert eine neue User-Nachricht und sendet Kontext ans LLM
router.post('/chats/:id/message', chatController.postMessage);

module.exports = router;