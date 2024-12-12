const { Chat, Message } = require('../models');
const axios = require('axios');
const { gatherChatContext } = require('../services/chatContextService');

module.exports = {

  /**
   * Erstellt einen neuen Chat und gibt dessen ID zurück.
   * GET /chats/
   */
  async createNewChat(req, res) {
    try {
      const newChat = await Chat.create({
        title: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json({ chat_id: newChat.id });
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ error: "Error creating chat" });
    }
  },

  /**
   * Gibt die Nachrichten eines Chats zurück
   * GET /chats/:id
   */
  async getChatMessages(req, res) {
    const chatId = parseInt(req.params.id, 10);

    try {
      const chat = await Chat.findByPk(chatId, {
        include: [
          {
            model: Message,
            as: 'messages',
            order: [['timestamp', 'ASC']]
          }
        ]
      });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Nachrichten sortieren (falls nötig, oder in der Include-Option)
      //chat.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ error: "Error fetching chat messages" });
    }
  },

  /**
   * Speichert eine neue user-Nachricht in einem Chat und sendet den Kontext ans LLM
   * POST /chats/:id/message
   * Body: { content: "Nachrichtentext" }
   */
  async postMessage(req, res) {
    const chatId = parseInt(req.params.id, 10);
    //const { content, socketId } = req.body;
    const { content } = req.body;
    const socketId  = 123;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    try {
      const chat = await Chat.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // User-Nachricht speichern
      await Message.create({
        chatId: chatId,
        role: 'user',
        content: content,
        timestamp: new Date(),
      });

      // Kontext holen
      const context = await gatherChatContext(chatId);

      // An LLM senden und auf fertige Antwort warten
      // Erwarte hier ein JSON: { message: "Die komplette Antwort vom LLM" }
      const llmResponse = await axios.post(`${process.env.LLM_API_URL}/generate`, { socketId: socketId, context });
      const { message: assistantMessageContent } = llmResponse.data;

      // LLM-Antwort (assistant message) speichern
      const assistantMessage = await Message.create({
        chatId: chatId,
        role: 'assistant',
        content: assistantMessageContent,
        timestamp: new Date(),
  });

      // Fertige Assistant-Nachricht ans Frontend schicken
      res.status(200).json({ message: assistantMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Error sending message" });
    }
  }

}