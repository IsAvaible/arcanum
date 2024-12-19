const express = require("express");
const { io } = require("socket.io-client");
const axios = require("axios");

// Da self-signed Zertifikat
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 8080;

// URL des Backends
const backendUrl = "https://localhost:443";

// Socket mit Backend verbinden
const socket = io(backendUrl, {
  rejectUnauthorized: false,
});

socket.on("connect", () => {
  console.log("Frontend-Simulator connected to backend, Socket ID:", socket.id);
  socket.emit("front_identify");
});

socket.on("llm_token", ({ token }) => {
  console.log("Received token from Backend:", token);
});

socket.on("llm_end", ({ content }) => {
  console.log("Final message received:", content);
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
});

// Kleiner Hilfs-Wrapper für axios-Requests, um Ergebnisse sauber zu loggen
async function testRequest(method, url, data = null) {
  try {
    const res = await axios({
      method,
      url: backendUrl + url,
      data,
    });
    console.log(
      `Request ${method.toUpperCase()} ${url} => Status: ${res.status}`,
      res.data,
    );
    return res.data;
  } catch (error) {
    console.error(
      `Error in request ${method.toUpperCase()} ${url}`,
      error.response ? error.response.data : error.message,
    );
  }
}

// Nach Start 30s warten, dann Requests losschicken
setTimeout(async () => {
  console.log("Starting test requests...");

  // Beispielablauf:
  // 1. Get all chats
  const allChats = await testRequest("get", "/api/chats");

  // 2. Create a new chat
  const newChatData = { title: "Test Chat" };
  const createChat = await testRequest("post", "/api/chats", newChatData);

  if (createChat && createChat.chatId) {
    const chatId = createChat.chatId;

    // 3. Get the newly created chat messages
    await testRequest("get", `/api/chats/${chatId}`);

    // 4. Update the chat title
    const updatedChatData = { title: "Updated Chat Title" };
    await testRequest("put", `/api/chats/${chatId}`, updatedChatData);

    let messageData = {
      content: "Hallo, wie geht es dir?",
      socketId: socket.id,
    };

    await testRequest(
      "post",
      `/api/chats/${chatId}/message`,
      messageData,
    );

    // 10 Sekunden warten
    await new Promise(resolve => setTimeout(resolve, 10000));

    messageData = {
      content: "Hier eine zweite nachricht",
      socketId: socket.id,
    };

    const messages = await testRequest(
      "post",
      `/api/chats/${chatId}/message`,
      messageData,
    );


    // 10 Sekunden warten
    await new Promise(resolve => setTimeout(resolve, 10000));

    const userMessages = messages.filter((msg) => msg.role === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];
    const lastUserMessageId = lastUserMessage ? lastUserMessage.id : null;

    messageData = {
      content: "Updated Content",
      socketId: socket.id,
    };
    await testRequest("put", `/api/chats/${chatId}/message/${lastUserMessageId}`, messageData);

    // 5. Export the chat
    await testRequest("get", `/api/chats/${chatId}/export`);

    // 6. Delete the chat
    await testRequest("delete", `/api/chats/${chatId}`);
  }

  // Weitere Endpunkte testen:
  // Delete Message:
  // await testRequest('delete', '/chats/someChatId/message/someMessageId');

  console.log("All test requests done.");
}, 15000);

app.get("/", (req, res) => {
  res.send("Frontend Mocker running...");
});

app.listen(PORT, () => {
  console.log(`Frontend Mocker running on http://localhost:${PORT}`);
});
