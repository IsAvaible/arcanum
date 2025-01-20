const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const multerMiddleware = require("../middlewares/multerMiddleware");
const { authenticateJWT } = require("../middlewares/validationMiddleware");
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
  multerMiddleware,
  authenticateJWT,
  validateData(messageSchema),
  escapeData(["content", "socketId"]),
  chatController.postMessage,
);

router.get("/chats", authenticateJWT, chatController.getAllChats); // Get all chats
router.get("/chats/:id", authenticateJWT, chatController.getChatMessages); // Get messages in a chat
router.post(
  "/chats",
  authenticateJWT,
  validateData(chatSchema),
  escapeData(["title"]),
  chatController.createNewChat,
); // Create a new chat
router.put(
  "/chats/:id",
  authenticateJWT,
  multerMiddleware,
  validateData(chatSchema),
  escapeData(["title"]),
  chatController.updateChat,
); // Update chat metadata
router.delete("/chats/:id", authenticateJWT,chatController.deleteChat); // Delete a chat
router.delete(
  "/chats/:chatId/messages/:messageId",
  authenticateJWT,
  chatController.deleteMessage,
); // Delete a message
router.put(
  "/chats/:chatId/messages/:messageId",
  authenticateJWT,
  multerMiddleware,
  validateData(updateMessageSchema),
  escapeData(["content", "socketId"]),
  chatController.updateMessage,
); // Update a message
router.get("/chats/:id/export", authenticateJWT, chatController.exportChat); // Export chat

module.exports = router;
