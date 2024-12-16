const server = require("../index");

setTimeout(() => {
  server.close(() => {
    console.log("Server closed successfully.");
    process.exit(0); // Beendet den Prozess
  });
}, 2000);
