const express = require("express");
require("dotenv").config();

// Function to extract registered routes from the Express app
const getRoutes = (app) => {
  return app._router.stack
    .filter((layer) => layer.route) // Filter only route definitions
    .map((layer) => ({
      method: Object.keys(layer.route.methods)[0].toUpperCase(), // Extract HTTP method
      path: layer.route.path, // Extract route path
    }));
};

// Function to test all registered routes
const testRoutes = async (routes, port) => {
  let allRoutesReachable = true; // Flag to track if all routes are reachable

  for (const route of routes) {
    try {
      // Perform a GET request to each route
      const response = await fetch(`http://localhost:${port}${route.path}`);
      if (response.ok) {
        console.log(`Route ${route.method} ${route.path} is reachable.`);
      } else {
        console.warn(
          `Route ${route.method} ${route.path} returned status ${response.status}.`,
        );
        allRoutesReachable = false; // Mark as not all routes reachable
      }
    } catch (error) {
      console.error(
        `Route ${route.method} ${route.path} is NOT reachable: ${error.message}`,
      );
      allRoutesReachable = false; // Mark as not all routes reachable
    }
  }

  // Log final result based on the reachability of routes
  if (allRoutesReachable) {
    console.log("All routes are reachable!");
  } else {
    console.warn("Some routes are not reachable. Please check the logs.");
  }
};

(async () => {
  try {
    const app = express();
    const PORT = process.env.PORT || 3000; // Set the port from environment variables or default to 3000

    console.log(`Using port: ${PORT}`);

    // Load middleware
    app.use(require("body-parser").json()); // Parse incoming JSON requests
    app.use(require("cors")()); // Enable CORS for cross-origin requests
    console.log("Middleware loaded successfully.");

    // Define a health-check route to verify server status
    app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" }); // Respond with status 200 and a simple JSON object
    });

    // Start the server
    const server = app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);

      // Retrieve all registered routes from the app
      const routes = getRoutes(app);
      console.log("Registered routes:", routes);

      // Test all routes for reachability
      await testRoutes(routes, PORT);

      // Close the server after a delay of 2 seconds
      setTimeout(() => {
        server.close(() => {
          console.log("Server closed successfully.");
          process.exit(0); // Exit the process with success
        });
      }, 2000);
    });
  } catch (err) {
    // Handle any errors during initialization
    console.error("Error during application initialization:", err.message);
    process.exit(1); // Exit the process with an error code
  }
})();
