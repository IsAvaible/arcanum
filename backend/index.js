const port = 3000;
const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");

const https = require("https");
const fs = require("fs");

const caseRoutes = require("./routes/caseRoutes");
const glossaryRoutes = require("./routes/glossaryRoutes");
const uploadRoutes = require("./routes/exampleFileUpload");

// for development only
app.set("view engine", "ejs");

// Use CORS middleware, see: https://expressjs.com/en/resources/middleware/cors.html
app.use(
  cors({
    origin: [
      "http://localhost:8080", // Frontend (Docker)
      "http://localhost:4173", // Frontend (Production)
      "http://localhost:5173", // Frontend (Development)
      "http://localhost:5174", // Swagger OpenAPI Editor
      "http://localhost:63342", // PHPStorm
    ],
    allowedHeaders: "*",
    exposedHeaders: "*",
    credentials: true,
  }),
);

// Middleware (optional)
const exampleMiddleware = require("./middlewares/exampleLogger");
app.use(exampleMiddleware);

app.use(express.json()); // Fügt die JSON-Parsing-Middleware hinzu
app.use(express.urlencoded({ extended: true }));

//Routen verwenden
app.use("/api", caseRoutes);
app.use("/api", glossaryRoutes);

app.use("/", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const credentials = {
  key: fs.readFileSync("./certs/localhost-dev-key.pem", "utf-8"),
  cert: fs.readFileSync("./certs/localhost.pem", "utf-8"),
  //ca: fs.readFileSync('./certs/ca.pem')
};

// for https uncomment the following lines
try {
  const server = https.createServer(credentials, app);
  const io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:8080", // Frontend (Docker)
        "http://localhost:4173", // Frontend (Production)
        "http://localhost:5173", // Frontend (Development)
        "http://localhost:5174", // Swagger OpenAPI Editor
        "http://localhost:63342", // PHPStorm
        "http://localhost:5001", // PHPStorm
        process.env.LLM_API_URL, // LLM_Backend
      ],
      credentials: true,
    },
  });
  // Socket IO Listener
  io.on("connection", (socket) => {
    console.log(`Client connected to ${socket.id}`);

    socket.on("llm_message", (data) => {
      console.log("Received 'llm_message' event:", data);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected : ${socket.id}`);
    });
  });

  server.listen(port, function (req, res) {
    console.log(`Server listening on port (${port})`);
  });
} catch (err) {
  console.error(err);
}
