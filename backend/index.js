const port = 3000;
const express = require("express");
const app = express();
const cors = require("cors");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const https = require("https");
const fs = require("fs");

const caseRoutes = require("./routes/caseRoutes");
const glossaryRoutes = require("./routes/glossaryRoutes");
const uploadRoutes = require("./routes/exampleFileUpload");
const chatRoutes = require("./routes/chatRoutes");
const tokenService = require("./services/tokenService");

// for development only
app.set("view engine", "ejs");

// Use cookie-parser middleware, see: https://expressjs.com/en/resources/middleware/cookie-parser.html
app.use(cookieParser());

// Use CORS middleware, see: https://expressjs.com/en/resources/middleware/cors.html
app.use(
  cors({
    origin: [
      "https://localhost", // Frontend (Docker)
      "http://localhost:4173", // Frontend (Production)
      "http://localhost:5173", // Frontend (Development)
      "http://localhost:5174", // Swagger OpenAPI Editor
      "http://localhost:63342", // PHPStorm
    ],
    allowedHeaders: [
      "origin",
      "content-type",
      "accept",
      "authorization",
      "user-agent",
    ],
    exposedHeaders: [
      "authorization",
      "origin",
      "content-type",
      "content-disposition",
      "content-length",
      "content-range",
      "date",
      "connection",
      "keep-alive",
    ],
    credentials: true,
  }),
);

// Middleware (optional)
const exampleMiddleware = require("./middlewares/exampleLogger");
app.use(exampleMiddleware);

app.use(express.json()); // Fügt die JSON-Parsing-Middleware hinzu
app.use(express.urlencoded({ extended: true }));

//Routen verwenden
app.use("/", uploadRoutes);
app.use("/api", caseRoutes);
app.use("/api", glossaryRoutes);
app.use("/api", chatRoutes);

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
        "https://localhost", // Frontend (Docker)
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
  tokenService(io);

  server.listen(port, function (req, res) {
    console.log(`Server listening on port (${port})`);
  });
} catch (err) {
  console.error(err);
}
