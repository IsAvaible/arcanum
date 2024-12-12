const { io } = require('socket.io-client');

/**
 * Simuliert das Senden von Tokens an das Backend.
 * 
 * @param {Object} socket - Die Socket.io-Client-Instanz, die mit dem Backend verbunden ist.
 * @param {string} socket_id - Die Socket-ID des Frontend-Clients, an den die Tokens geroutet werden sollen.
 * @param {Array<string>} tokens - Ein Array von Strings, die als einzelne Tokens gesendet werden.
 * @param {number} intervalMs - Zeit in Millisekunden zwischen zwei Token-Sendungen.
 */
function simulateTokenSending(socket, socket_id, tokens, intervalMs = 500) {
  let index = 0;
  
  const interval = setInterval(() => {
    if (index < tokens.length) {
      const token = tokens[index];
      console.log("Sending token:", token);
      socket.emit('llm_token', { socket_id, token });
      index++;
    } else {
      clearInterval(interval);

      // Wenn alle Tokens gesendet sind, sende das end-Event
      const finalMessage = tokens.join('');
      console.log("Sending llm_end with content:", finalMessage);
      socket.emit('llm_end', { socket_id, content: finalMessage });
    }
  }, intervalMs);
}

// -----------------------------------------------------
// Hauptteil des Skripts
// -----------------------------------------------------
(async () => {
  // Hier die URL deines Backends eintragen
  const backendUrl = "https://localhost:443";

  // Socket.io-Client mit Backend verbinden
  const socket = io(backendUrl, {
    rejectUnauthorized: false // Falls du ein self-signed Zertifikat nutzt
  });

  // Wenn Verbindung steht
  socket.on('connect', () => {
    console.log('LLM Simulator connected to backend, Socket ID (LLM-Simulator):', socket.id);

    // LLM identifizieren (optional, falls Backend darauf reagiert)
    socket.emit('llm_identify');
    
    // Angenommen, du hast vom Frontend/Backend einen socket_id erhalten, an den du die Tokens schicken sollst
    // In einem echten Szenario würde diese socket_id vom Backend kommen, hier hardcodest du sie testweise:
    const targetSocketId = 123;
    
    // Tokens definieren, die gesendet werden sollen
    const tokens = ["Hallo", " ", "Welt", "!"];

    // Tokens senden simulieren
    simulateTokenSending(socket, targetSocketId, tokens, 500);
  });

  socket.on('connect_error', (err) => {
    console.error('Connection error:', err);
  });

  // Falls das Backend irgendetwas an den LLM zurückschickt (normalerweise nicht nötig)
  socket.on('something_from_backend', (data) => {
    console.log('Received from backend:', data);
  });
})();
