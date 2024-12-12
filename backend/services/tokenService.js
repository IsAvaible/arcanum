// services/tokenService.js
module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Token vom LLM empfangen
    socket.on('llm_token', ({ socket_id, token }) => {
      console.log('llm_token:', token);
      io.to(socket_id).emit('llm_token', { token });
    });

    socket.on('llm_identify', () => {
      console.log('LLM connected with socket ID:', socket.id);
    });

    socket.on('llm_end', ({ socket_id, content }) => {
      io.to(socket_id).emit('llm_end', { content });
    });
  });
};