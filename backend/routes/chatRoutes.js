const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');



// Speichert eine neue User-Nachricht und sendet Kontext ans LLM
router.post('/chats/:id/message', chatController.postMessage);



router.get('/chats', chatController.getAllChats); // Get all chats
router.get('/chats/:id', chatController.getChatMessages); // Get messages in a chat
router.post('/chats', chatController.createNewChat); // Create a new chat
router.put('/chats/:id', chatController.updateChat); // Update chat metadata
router.delete('/chats/:id', chatController.deleteChat); // Delete a chat
router.delete('/chats/:chatId/messages/:messageId', chatController.deleteMessage); // Delete a message
router.put('/chats/:chatId/messages/:messageId', chatController.updateMessage); // Update a message
router.get('/chats/:id/export', chatController.exportChat); // Export chat



module.exports = router;