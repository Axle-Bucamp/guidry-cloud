const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const loadConfig = require('./src/config/vault');

(async () => {
  try {
    // Load and apply Vault secrets to process.env
    const config = await loadConfig();
    Object.entries(config).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Now safely use env variables
    const app = express();
    const port = process.env.PORT || 3001;

    // Middleware
    app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
    app.use(express.json());

    // Import Routes
    const nodeRoutes = require("./routes/nodes");
    const vmRoutes = require("./routes/vms");
    const vncRoutes = require("./routes/vnc");
    const monitoringRoutes = require("./routes/monitoring");

    // Health Check
    app.get("/api/health", (req, res) => {
      res.json({ status: "UP", timestamp: new Date().toISOString() });
    });

    // Mount Routes
    app.use("/api/nodes", nodeRoutes);
    app.use("/api/vms", vmRoutes);
    app.use("/api/vnc", vncRoutes);
    app.use("/api/monitoring", monitoringRoutes);

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ success: false, message: "An internal server error occurred" });
    });

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });

  } catch (err) {
    console.error('❌ Failed to load config from Vault:', err);
    process.exit(1);
  }
})();
