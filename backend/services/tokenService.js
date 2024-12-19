// services/tokenService.js
module.exports = (io) => {
  let frontId = 123;
  let llmId = 123;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Receive token from LLM
    socket.on("llm_token", ({ socketId, token }) => {
      //console.log("llm_token:", token);
      // send to frontend
      io.to(socketId).emit("llm_token", { token });
    });

    socket.on("front_identify", () => {
      frontId = socket.id;
      console.log("Fronted connected with socket ID:", socket.id);
    });

    socket.on("llm_identify", () => {
      llmId = socket.id;
      console.log("LLM connected with socket ID:", socket.id);
    });

    socket.on("llm_end", ({ socket_id, content }) => {
      io.to(socket_id).emit("llm_end", { content });
    });
  });
};
