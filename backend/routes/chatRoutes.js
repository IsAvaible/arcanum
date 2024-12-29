const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const multerMiddleware = require("../middlewares/multerMiddleware");
const {
  escapeData,
  validateData,
} = require("../middlewares/validationMiddleware");
const {
  messageSchema,
  chatSchema,
  updateMessageSchema,
} = require("../schemas/chatSchemas");

// Saves a new user message and sends context to LLM
router.post(
  "/chats/:id/messages",
  validateData(messageSchema),
  escapeData(["content", "socketId"]),
  chatController.postMessage,
);

router.get("/chats", chatController.getAllChats); // Get all chats
router.get("/chats/:id", chatController.getChatMessages); // Get messages in a chat
router.post(
  "/chats",
  validateData(chatSchema),
  escapeData(["title"]),
  chatController.createNewChat,
); // Create a new chat
router.put(
  "/chats/:id",
  validateData(chatSchema),
  escapeData(["title"]),
  chatController.updateChat,
); // Update chat metadata
router.delete("/chats/:id", chatController.deleteChat); // Delete a chat
router.delete(
  "/chats/:chatId/messages/:messageId",
  chatController.deleteMessage,
); // Delete a message
router.put(
  "/chats/:chatId/messages/:messageId",
  validateData(updateMessageSchema),
  escapeData(["content", "socketId"]),
  chatController.updateMessage,
); // Update a message
router.get("/chats/:id/export", chatController.exportChat); // Export chat

router.post(
  "/chats/:id/messages/files",
  multerMiddleware,
  escapeData(["content", "socketId"]),
  validateData(chatSchema),
  chatController.postMessageWithFiles,
);//Accepts files, create user/assistant message. Optionally, create a new case

module.exports = router;
