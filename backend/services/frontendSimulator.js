const { io } = require('socket.io-client');

// Hier die URL deines Backends eintragen
const backendUrl = "https://localhost:443"; 
// Falls du ein self-signed Zertifikat nutzt:
const socket = io(backendUrl, {
  rejectUnauthorized: false
});

socket.on('connect', () => {
  console.log("Frontend-Simulator connected to backend, Socket ID:", socket.id);
  // Diese socket.id könntest du z. B. in einem realen Szenario per HTTP Request ans Backend übermitteln,
  // damit das LLM dann Tokens gezielt an diesen Client sendet.
  socket.emit('front_identify');
});

// Auf eingehende Tokens lauschen
socket.on('llm_token', ({ token }) => {
  console.log("Received token from Backend:", token);
});

// Wenn die LLM-Antwort fertig ist
socket.on('llm_end', ({ content }) => {
  console.log("Final message received:", content);
  // Hier könntest du ggf. den Socket schließen oder weitere Aktionen vornehmen.
});

// Falls du Testnachrichten senden möchtest, um die Reaktion des Backend zu prüfen:
socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
})