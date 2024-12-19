const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { escapeData } = require("../middlewares/validationMiddleware");


// Speichert eine neue User-Nachricht und sendet Kontext ans LLM
router.post('/chats/:id/message', escapeData(['content', 'socketId']), chatController.postMessage);



router.get('/chats', chatController.getAllChats); // Get all chats
router.get('/chats/:id', chatController.getChatMessages); // Get messages in a chat
router.post('/chats',escapeData(['title']), chatController.createNewChat); // Create a new chat
router.put('/chats/:id',escapeData(['title']), chatController.updateChat); // Update chat metadata
router.delete('/chats/:id', chatController.deleteChat); // Delete a chat
router.delete('/chats/:chatId/message/:messageId', chatController.deleteMessage); // Delete a message
router.put('/chats/:chatId/message/:messageId',escapeData(['content', 'socketId']), chatController.updateMessage); // Update a message
router.get('/chats/:id/export', chatController.exportChat); // Export chat



module.exports = router;