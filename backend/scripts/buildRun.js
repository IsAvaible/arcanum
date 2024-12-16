const express = require("express");
require("dotenv").config();

try {
  const app = express();

  const PORT = process.env.PORT || 3000;
  console.log(`Using port: ${PORT}`);
  app.use(require("body-parser").json());
  app.use(require("cors")());

  console.log("Middleware loaded successfully.");

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    setTimeout(() => {
      server.close(() => {
        console.log("Server closed successfully.");
        process.exit(0); // Beendet den Prozess
      });
    }, 2000);
  });
} catch (err) {
  console.error("Error during application initialization:", err.message);
  process.exit(1); // Fehlercode zurückgeben
}
