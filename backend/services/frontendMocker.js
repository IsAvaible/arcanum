const { io } = require('socket.io-client');

const backendUrl = "https://localhost:443"; 
const socket = io(backendUrl, {
  //Da Zertifikat Self-signed:
  rejectUnauthorized: false
});

socket.on('connect', () => {
  console.log("Frontend-Simulator connected to backend, Socket ID:", socket.id);
  socket.emit('front_identify');
});

socket.on('llm_token', ({ token }) => {
  console.log("Received token from Backend:", token);
});

socket.on('llm_end', ({ content }) => {
  console.log("Final message received:", content);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err);
})