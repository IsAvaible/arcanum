const express = require("express");
require("dotenv").config();

try {
  const app = express();

  if (!process.env.PORT) {
    throw new Error("Missing required environment variable: PORT");
  }
  console.log("Environment variables loaded successfully.");

  app.use(require("body-parser").json());
  app.use(require("cors")());
  console.log("Middleware loaded successfully.");

  const server = app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });

  console.log("Application initialized without errors.");
  process.exit(0);
} catch (err) {
  console.error("Error during application initialization:", err.message);
  process.exit(1);
}
