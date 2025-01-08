const { Chats, Messages } = require("../models");
/**
 * @async
 * @function gatherChatContext
 * @description Retrieves all messages for a given chat, sorted by their timestamp, providing context for interactions.
 * @param {number} chatId - The ID of the chat whose messages should be gathered.
 * @returns {Promise<Array>} An array of messages from the specified chat, sorted chronologically by their timestamp.
 * @throws {Error} Internal server error if there's an issue querying the database or sorting the messages.
 * @example
 * const context = await gatherChatContext(42);
 * console.log(context); // [{ id: 1, content: 'Hello', ... }, { id: 2, content: 'Hi', ... }]
 */
async function gatherChatContext(chatId) {
  try {
    const chat = await Chats.findByPk(chatId, {
      include: [
        {
          model: Messages,
          as: "messages",
        },
      ],
    });

    if (!chat) {
      return [];
    }

    // Nachrichten nach timestamp sortieren
    const sortedMessages = chat.messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    return sortedMessages;
  } catch (error) {
    console.error("Error gathering chat context:", error);
    return [];
  }
}

module.exports = {
  gatherChatContext,
};
