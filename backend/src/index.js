const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const passport = require("passport");

// Load environment variables
dotenv.config();

// Database initialization
const { initDb } = require("./config/database"); 

// Import routes
const authRoutes = require("./routes/auth");
const nodeRoutes = require("./routes/nodes");
const vmRoutes = require("./routes/vm");
const lxcRoutes = require("./routes/lxc");
const vncRoutes = require("./routes/vnc");
const monitoringRoutes = require("./routes/monitoring");
const paymentRoutes = require("./routes/payment"); // Added payment routes
const userRoutes = require("./routes/user"); // Assuming user routes for credit info

const app = express();

// Initialize Database Schema for Credits
initDb().then(() => {
  console.log("Database initialized successfully for credits and transactions.");
}).catch(err => {
  console.error("Failed to initialize database for credits:", err);
  process.exit(1); // Exit if DB init fails
});


// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(helmet()); // Set security-related HTTP headers
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Passport middleware for OAuth and JWT
app.use(passport.initialize());
require("./middleware/oauth"); // Configure OAuth strategy
require("./middleware/auth"); // Configure JWT strategy (if it's done via passport.use)

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/vms", vmRoutes);
app.use("/api/lxc", lxcRoutes);
app.use("/api/vnc", vncRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/payment", paymentRoutes); // Use payment routes
app.use("/api/user", userRoutes); // Use user routes

// Root Route for basic check
app.get("/", (req, res) => {
  res.send("Proxmox PaaS Backend is running!");
});

// Error Handling Middleware (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

