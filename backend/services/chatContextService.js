const { Chat, Message } = require('../models');

async function gatherChatContext(chatId) {
  try {
    const chat = await Chat.findByPk(chatId, {
      include: [
        {
          model: Message,
          as: 'messages',
        }
      ]
    });

    if (!chat) {
      // Falls der Chat nicht existiert, gib einen leeren Array oder null zurück,
      // je nach gewünschtem Verhalten.
      return [];
    }

    // Nachrichten nach timestamp sortieren
    const sortedMessages = chat.messages.sort((a, b) => {
      return new Date(a.timestamp) - new Date(b.timestamp);
    });

    // Falls du nur den reinen Nachrichtentext und Rolle brauchst, könntest du hier filtern:
    // const context = sortedMessages.map(msg => ({ role: msg.role, content: msg.content }));

    // Hier geben wir einfach die kompletten Nachrichten zurück:
    return sortedMessages;
  } catch (error) {
    console.error("Error gathering chat context:", error);
    return [];
  }
}

module.exports = {
  gatherChatContext
};