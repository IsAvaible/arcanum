const { Chats, Messages } = require("../models");
const axios = require("axios");
const { gatherChatContext } = require("../services/chatContextService");

module.exports = {
  /**
   * @route POST /chats
   * @description Creates a new chat instance and returns its ID.
   * @param {string} [title.body.optional] - An optional title for the new chat.
   * @returns {Object} 201 - A JSON object containing the newly created chat's ID.
   * @returns {Error} 500 - Internal server error.
   */
  async createNewChat(req, res) {
    try {
      const { title } = req.body;
      const newChat = await Chats.create({
        title: title || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.status(201).json({ chatId: newChat.id });
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({ message: error.message || "Error creating chat" });
    }
  },

  /**
   * @route GET /chats
   * @description Retrieves all chats, ordered by their creation date (descending).
   * @returns {Array} 200 - An array of chat objects.
   * @returns {Error} 500 - Internal server error.
   */
  async getAllChats(req, res) {
    try {
      const chats = await Chats.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(chats);
    } catch (error) {
      console.error("Error fetching all chats:", error);
      res
        .status(500)
        .json({ message: error.message || "Error fetching all chats" });
    }
  },

  /**
   * @route GET /chats/:id
   * @description Retrieves a specific chat by its ID, including all messages associated with it.
   * @param {number} id.path.required - The ID of the chat to retrieve.
   * @returns {Object} 200 - The chat object, including an array of messages.
   * @returns {Error} 404 - Chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async getChatMessages(req, res) {
    const chatId = parseInt(req.params.id, 10);

    try {
      const chat = await Chats.findByPk(chatId, {
        include: [
          {
            model: Messages,
            as: "messages",
            order: [["timestamp", "ASC"]],
          },
        ],
      });

      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.json(chat);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res
        .status(500)
        .json({ message: error.message || "Error fetching chat messages" });
    }
  },

  /**
   * @route POST /chats/:id/message
   * @description Saves a new user message in the specified chat and sends the context to the LLM (Language Model).
   * @param {number} id.path.required - The ID of the chat to which the message will be added.
   * @param {Text} content.body.required - The content of the user's message (non-empty).
   * @param {string} socketId.body.required - An socket ID to track responses in real-time.
   * @returns {Object} 200 - The updated chat with user and assisstant messages
   * @returns {Error} 400 - Missing or invalid message content.
   * @returns {Error} 404 - Chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async postMessage(req, res) {
    const chatId = parseInt(req.params.id, 10);
    const { content, socketId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required" });
    }

    try {
      const chat = await Chats.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      // fetch context
      const context = await gatherChatContext(chatId);

      // store User-message
      await Messages.create({
        chatId: chatId,
        role: "user",
        content: content,
        timestamp: new Date(),
      });

      console.log(
        "Sende ans LLM: ",
        JSON.stringify({ socketId: socketId, message: content, context }),
      );

      // Send to LLM and wait for a reply
      // Expect a JSON here: { message: ‘The complete response from LLM’ }
      // ...I_URL}/generate`, { socketId: socketId, context }); Could also send new messages in context here
      const llmResponse = await axios.post(
        `${process.env.LLM_API_URL}/generate`,
        { socketId: socketId, message: content, context },
      );
      const { message: assistantMessageContent } = llmResponse.data;

      console.log(
        "Vom LLM Empfangen: ",
        JSON.stringify(assistantMessageContent),
      );

      // Save LLM response (assistant message)
      await Messages.create({
        chatId: chatId,
        role: "assistant",
        content: assistantMessageContent,
        timestamp: new Date(),
      });

      const result = await gatherChatContext(chatId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error sending message:", error);
      res
        .status(500)
        .json({ message: error.message || "Error sending message" });
    }
  },

  /**
   * @route PUT /chats/:id
   * @description Updates chat title
   * @param {number} id.path.required - The ID of the chat to update.
   * @param {string} [title.body.optional] - The new title of the chat.
   * @returns {Object} 200 - A message indicating a successful update and the updated chat object.
   * @returns {Error} 404 - Chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async updateChat(req, res) {
    const chatId = parseInt(req.params.id, 10);
    const { title } = req.body;

    try {
      const chat = await Chats.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      chat.title = title || chat.title;
      chat.updatedAt = new Date();
      await chat.save();

      res.status(200).json({ message: "Chat updated successfully", chat });
    } catch (error) {
      console.error("Error updating chat:", error);
      res.status(500).json({ message: error.message || "Error updating chat" });
    }
  },

  /**
   * @route DELETE /chats/:id
   * @description Deletes a specific chat by its ID.
   * @param {number} id.path.required - The ID of the chat to delete.
   * @returns {Object} 200 - A message indicating the chat was successfully deleted.
   * @returns {Error} 404 - Chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async deleteChat(req, res) {
    const chatId = parseInt(req.params.id, 10);

    try {
      const chat = await Chats.findByPk(chatId);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      await chat.destroy();
      res.status(200).json({ message: "Chat deleted successfully" });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({ message: error.message || "Error deleting chat" });
    }
  },

  /**
   * @route DELETE /chats/:chatId/messages/:messageId
   * @description Deletes a specific message by its ID within a given chat.
   * @param {number} chatId.path.required - The ID of the chat containing the message.
   * @param {number} messageId.path.required - The ID of the message to delete.
   * @returns {Object} 200 - A message indicating the message was successfully deleted.
   * @returns {Error} 404 - Message or chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async deleteMessage(req, res) {
    const chatId = parseInt(req.params.chatId, 10);
    const messageId = parseInt(req.params.messageId, 10);

    try {
      const message = await Messages.findOne({
        where: { id: messageId, chatId: chatId },
      });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      await message.destroy();
      res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res
        .status(500)
        .json({ message: error.message || "Error deleting message" });
    }
  },

  /**
   * @route PUT /chats/:chatId/messages/:messageId
   * @description Updates a specific message within a given chat. Optionally sends updated content to the LLM for a new response.
   * @param {number} chatId.path.required - The ID of the chat containing the message.
   * @param {number} messageId.path.required - The ID of the message to update.
   * @param {string} content.body.required - The new content of the message.
   * @param {string} [socketId.body.optional] - Optional socket ID for sending the updated message to the LLM.
   * @returns {Object} 200 - The updated chat with user and assisstant messages
   * @returns {Error} 400 - Missing or invalid message content.
   * @returns {Error} 404 - Message or chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async updateMessage(req, res) {
    const chatId = parseInt(req.params.chatId, 10);
    const messageId = parseInt(req.params.messageId, 10);
    const { content, socketId } = req.body;
    let assistantMessage = [];

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Message content is required" });
    }

    try {
      let message = await Messages.findOne({
        where: { id: messageId, chatId: chatId },
      });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      if (socketId) {
        const context = await gatherChatContext(chatId);

        console.log(
          "Sende ans LLM: ",
          JSON.stringify({ socketId: socketId, message: content, context }),
        );

        // Send to LLM and wait for a reply
        // Expect a JSON here: { message: ‘The complete response from LLM’ }
        const llmResponse = await axios.post(
          `${process.env.LLM_API_URL}/generate`,
          { socketId: socketId, message: content, context },
        );
        const { message: assistantMessageContent } = llmResponse.data;

        console.log(
          "Vom LLM Empfangen: ",
          JSON.stringify(assistantMessageContent),
        );

        message.content = content;
        message.timestamp = new Date();
        await message.save();

        
        // Save LLM response (assistant message)
        assistantMessage = await Messages.create({
          chatId: chatId,
          role: "assistant",
          content: assistantMessageContent,
          timestamp: new Date(),
        });
      }



      const result = gatherChatContext(chatId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating message:", error);
      res
        .status(500)
        .json({ message: error.message || "Error updating message" });
    }
  },

  /**
   * @route GET /chats/:id/export
   * @description Exports a chat and its messages as a JSON file.
   * @param {number} id.path.required - The ID of the chat to export.
   * @returns {File} 200 - A downloadable JSON file representing the chat and its messages.
   * @returns {Error} 404 - Chat not found.
   * @returns {Error} 500 - Internal server error.
   */
  async exportChat(req, res) {
    const chatId = parseInt(req.params.id, 10);

    try {
      const chat = await Chats.findByPk(chatId, {
        include: [{ model: Messages, as: "messages" }],
      });
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const exportData = {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: chat.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        })),
      };

      // Convert the data into a JSON string
      const jsonString = JSON.stringify(exportData, null, 2);

      // Set headers to force download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="chat-${chatId}-export.json`,
      );
      res.setHeader("Content-Type", "application/json");

      res.send(jsonString);
    } catch (error) {
      console.error("Error exporting chat:", error);
      res
        .status(500)
        .json({ message: error.message || "Error exporting chat" });
    }
  },
};
