// services/tokenService.js
module.exports = (io) => {


  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Receive token from LLM
    socket.on("llm_message", ({ socketId, message }) => {
      io.to(socketId).emit("llm_message", { message });
    });

    socket.on("front_identify", () => {
      console.log("Fronted connected with socket ID:", socket.id);
    });

    socket.on("llm_identify", () => {
      console.log("LLM connected with socket ID:", socket.id);
    });

    socket.on("llm_end", ({ socketId, content }) => {
      // send to frontend
      io.to(socketId).emit("llm_end", { content });
    });
  });
};
