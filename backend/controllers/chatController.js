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

      const { title } = req.body; // optionaler Titel aus dem Request Body
      const newChat = await Chat.create({
        title: title || null,
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
   * Gibt alle Chats zurück
   * GET /chats
   */
    async getAllChats(req, res) {
      try {
        const chats = await Chat.findAll({
          order: [['createdAt', 'DESC']]
        });
        res.status(200).json(chats);
      } catch (error) {
        console.error("Error fetching all chats:", error);
        res.status(500).json({ error: "Error fetching all chats" });
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
  },


    /**
   * Aktualisiert die Metadaten eines Chats (z. B. den Titel)
   * PUT /chats/:id
   * Body: { title: "Neuer Titel" }
   */
    async updateChat(req, res) {
      const chatId = parseInt(req.params.id, 10);
      const { title } = req.body;
  
      try {
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
          return res.status(404).json({ message: "Chat not found" });
        }
  
        chat.title = title || chat.title;
        chat.updatedAt = new Date();
        await chat.save();
  
        res.status(200).json({ message: "Chat updated successfully", chat });
      } catch (error) {
        console.error("Error updating chat:", error);
        res.status(500).json({ error: "Error updating chat" });
      }
    },

    async deleteChat(req, res) {
      const chatId = parseInt(req.params.id, 10);
  
      try {
        const chat = await Chat.findByPk(chatId);
        if (!chat) {
          return res.status(404).json({ message: "Chat not found" });
        }
  
        await chat.destroy();
        res.status(200).json({ message: "Chat deleted successfully" });
      } catch (error) {
        console.error("Error deleting chat:", error);
        res.status(500).json({ error: "Error deleting chat" });
      }
    },

    /**
   * Löscht eine bestimmte Nachricht in einem bestimmten Chat
   * DELETE /chats/:chatId/messages/:messageId
   */
  async deleteMessage(req, res) {
    const chatId = parseInt(req.params.chatId, 10);
    const messageId = parseInt(req.params.messageId, 10);

    try {
      const message = await Message.findOne({ where: { id: messageId, chatId: chatId } });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      await message.destroy();
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ error: "Error deleting message" });
    }
  },

  /**
   * Aktualisiert eine bestimmte Nachricht
   * PUT /chats/:chatId/messages/:messageId
   * Body: { content: "Neuer Nachrichtentext" }
   */
  async updateMessage(req, res) {
    const chatId = parseInt(req.params.chatId, 10);
    const messageId = parseInt(req.params.messageId, 10);
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }

    try {
      const message = await Message.findOne({ where: { id: messageId, chatId: chatId } });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      message.content = content;
      // timestamp wird aktualisiert, wenn Sie wollen (hier optional)
      message.timestamp = new Date();
      await message.save();

      res.status(200).json({ message: "Message updated successfully", updatedMessage: message });
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ error: "Error updating message" });
    }
  },

  /**
   * Exportiert einen Chat (z. B. als JSON oder ein bestimmtes Format)
   * GET /chats/:id/export
   */
  async exportChat(req, res) {
    const chatId = parseInt(req.params.id, 10);

    try {
      const chat = await Chat.findByPk(chatId, {
        include: [{ model: Message, as: 'messages' }]
      });
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // Beispiel: Export als JSON der Chat-Daten
      const exportData = {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: chat.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };

      // Je nach Wunsch: Datei-Download oder einfach JSON zurückgeben
      // Hier einfach als JSON zurückgeben
      res.status(200).json(exportData);

    } catch (error) {
      console.error("Error exporting chat:", error);
      res.status(500).json({ error: "Error exporting chat" });
    }
  }
  
}