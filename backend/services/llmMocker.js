const { io } = require("socket.io-client");
const express = require("express");
const bodyParser = require("body-parser");

/**
 * Simuliert das Senden von Tokens an das Backend.
 *
 * @param {Object} socket - Die Socket.io-Client-Instanz, die mit dem Backend verbunden ist.
 * @param {string} socketId - Die Socket-ID des Frontend-Clients, an den die Tokens geroutet werden sollen.
 * @param {Array<string>} tokens - Ein Array von Strings, die als einzelne Tokens gesendet werden.
 * @param {number} intervalMs - Zeit in Millisekunden zwischen zwei Token-Sendungen.
 */
function simulateTokenSending(socket, socketId, tokens, intervalMs = 500) {
  let index = 0;

  const interval = setInterval(() => {
    if (index < tokens.length) {
      const token = tokens[index];
      console.log("Sending token:", token);
      socket.emit("llm_token", { socketId, token });
      index++;
    } else {
      clearInterval(interval);

      // Wenn alle Tokens gesendet sind, sende das end-Event
      const finalMessage = tokens.join("");
      console.log("Sending llm_end with content:", finalMessage);
      socket.emit("llm_end", { socketId, content: finalMessage });
    }
  }, intervalMs);
}

// -------------------------------------------
// Globale Variablen / Setup
// -------------------------------------------
const backendUrl = "https://localhost:443"; // URL des eigentlichen Backends
// Socket.io-Client mit Backend verbinden
const socket = io(backendUrl, {
  rejectUnauthorized: false,
});

const app = express();
app.use(bodyParser.json());

// -------------------------------------------
// Socket Event Handler
// -------------------------------------------

socket.on("connect", () => {
  console.log(
    "LLM Simulator connected to backend, Socket ID (LLM-Simulator):",
    socket.id,
  );

  // Dem Backend mitteilen, dass dies ein LLM-Simulator ist (falls notwendig)
  socket.emit("llm_identify");

  // Falls vom Backend Daten empfangen werden...
  socket.on("something_from_backend", (data) => {
    console.log("Received from backend:", data);
  });
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
});

// -------------------------------------------
// Neuer Endpoint für /generate_case
// -------------------------------------------
app.post("/generate_case", async (req, res) => {
  const { socketId, message, context, attachments } = req.body;

  console.log(
    `Received /generate_case request: socketId= ${socketId}, message= "${message}"`,
  );
  if (attachments && attachments.length > 0) {
    console.log("Received attachments from client:", attachments);
  }

  // Beispiel-Tokens, die schrittweise gesendet werden
  // Hier kannst du natürlich beliebigen Text generieren
  const tokens = [
    "Reading",
    " ",
    "files",
    "...",
    " ",
    "Gathering",
    " ",
    "context",
    "...",
    " ",
    "Generating",
    " ",
    "Case",
    "...",
  ];

  // Beantworte den HTTP-Request sofort mit JSON
  // (Während parallel Tokens über Socket gesendet werden)
  try {
    // Beispiel-Rückgabe:
    // - message: final LLM message
    // - cases: ein Array aus Cases, wie es das Backend erwartet
    const result = {
      message: "Here is a final message with a new case.",
      cases: [
        {
          title: "Case from LLM via Chat",
          description: "Created by LLM",
          status: "Open",
          case_type: "Problem",
          priority: "Low",
          // Simulieren wir: Der LLM schickt die IDs zurück,
          // die er in der Bearbeitung gefunden hat:
          attachments: attachments?.map((att) => att.id) || [],
        },
      ],
    };

    // Starte das Senden der Tokens
    simulateTokenSending(socket, socketId, tokens, 100);
    // Kurze Verzögerung, damit das Token-Streaming Zeit hat, loszulaufen
    await new Promise((resolve) => setTimeout(resolve, 1600));

    // Sende die JSON-Antwort an den aufrufenden Client (Backend)
    return res.json(result);
  } catch (error) {
    console.error("Error in /generate_case:", error);
    return res.status(500).json({
      error: "LLM-Simulator encountered an error generating case.",
    });
  }
});
// -------------------------------------------
// /generate Endpoint
// -------------------------------------------
app.post("/generate", async (req, res) => {
  const { socketId, message, context } = req.body;

  console.log(
    `Received request with socketId: ${socketId}, message: "${message}", context:`,
    context,
  );

  // Hier könnten Sie je nach message/context Tokens generieren
  // Wir nehmen einfach Fake-Tokens an:
  const tokens = [
    "This",
    " ",
    "is",
    " ",
    "a",
    " ",
    "fake",
    " ",
    "LLM",
    " ",
    "response",
    " ",
    "message.",
  ];
  try {
    // Tokens asynchron über Socket senden
    simulateTokenSending(socket, socketId, tokens, 100);
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Sofortige HTTP-Response an den Request
    // Wir geben eine Fake-LLM-Antwort zurück
    res.json({
      message: "This is a fake LLM response message.",
    });
  } catch (error) {
    console.error(error);
  }
});

// -------------------------------------------
// Server starten
// -------------------------------------------
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`LLM Mocker running on http://localhost:${PORT}`);
});
