const proxmoxApi = require("proxmox-api"); // Standard import
console.log("Imported proxmoxApi:", proxmoxApi); // Log the imported module
const dotenv = require("dotenv");

dotenv.config();

// Allow self-signed certificates (use with caution in production)
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") { // Also allow for testing
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Ensure required environment variables are set
if (!process.env.PROXMOX_API_URL || !process.env.PROXMOX_API_TOKEN_ID || !process.env.PROXMOX_API_TOKEN_SECRET) {
  console.error("Error: Missing required Proxmox API environment variables (PROXMOX_API_URL, PROXMOX_API_TOKEN_ID, PROXMOX_API_TOKEN_SECRET).");
  process.exit(1); // Exit if config is missing
}

// Check if the imported value is a function or an object with a default property
const proxmoxApiFn = proxmoxApi.default || proxmoxApi;

if (typeof proxmoxApiFn !== "function") {
  console.error("Error: Imported proxmox-api module is not a function.", proxmoxApiFn);
  process.exit(1);
}

const proxmoxClient = proxmoxApiFn({
  host: process.env.PROXMOX_API_URL.replace("https://", "").replace("/api2/json", ""), // proxmox-api expects host without protocol or path
  tokenID: process.env.PROXMOX_API_TOKEN_ID,
  tokenSecret: process.env.PROXMOX_API_TOKEN_SECRET,
});

module.exports = proxmoxClient;

