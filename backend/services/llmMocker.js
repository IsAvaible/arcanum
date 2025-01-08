//const { io } = require("socket.io-client");
const express = require("express");
const bodyParser = require("body-parser");



// -------------------------------------------
// Globale Variablen / Setup
// -------------------------------------------
const backendUrl = "https://localhost:443"; // URL des eigentlichen Backends
// Socket.io-Client mit Backend verbinden

const app = express();
app.use(bodyParser.json());

// -------------------------------------------
// Socket Event Handler
// -------------------------------------------


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
      
    const attachmentsWithGlossary = attachments?.map((att) => {
      return {
        id: att.id,
        glossary: ["fakeGlossaryTerm1", "fakeGlossaryTerm2"], // z. B. zwei Fake-Begriffe
      };
    }) || [];
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
          attachments: attachmentsWithGlossary,
        },
      ],
    };

    // Starte das Senden der Tokens
    //simulateTokenSending(socket, socketId, tokens, 100);
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
// Server starten
// -------------------------------------------
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`LLM Mocker running on http://localhost:${PORT}`);
});