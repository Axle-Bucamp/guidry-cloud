const express = require("express");
const proxmoxService = require("../services/proxmoxService");

const router = express.Router();

// GET /api/nodes - List all nodes
router.get("/", async (req, res) => {
  console.log("Received request for /api/nodes"); // Add log
  try {
    console.log("Attempting to call proxmoxService.getNodes()..."); // Add log
    const nodes = await proxmoxService.getNodes();
    console.log("proxmoxService.getNodes() returned:", nodes); // Add log
    res.json({ success: true, data: nodes });
  } catch (error) {
    // Log the detailed error for debugging
    console.error("Error in /api/nodes route:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to fetch nodes" });
  }
});

// GET /api/nodes/:nodeName/status - Get status for a specific node
router.get("/:nodeName/status", async (req, res) => {
  try {
    const { nodeName } = req.params;
    const status = await proxmoxService.getNodeStatus(nodeName);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/nodes/:nodeName/vms - List VMs on a specific node
router.get("/:nodeName/vms", async (req, res) => {
  try {
    const { nodeName } = req.params;
    const vms = await proxmoxService.getVMs(nodeName);
    res.json({ success: true, data: vms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/nodes/:nodeName/containers - List Containers on a specific node
router.get("/:nodeName/containers", async (req, res) => {
  try {
    const { nodeName } = req.params;
    const containers = await proxmoxService.getContainers(nodeName);
    res.json({ success: true, data: containers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/nodes/:nodeName/rrddata - Get RRD data for a specific node
router.get("/:nodeName/rrddata", async (req, res) => {
  try {
    const { nodeName } = req.params;
    const timeFrame = req.query.timeframe || 'hour'; // Default to hour
    const rrdData = await proxmoxService.getNodeRRDData(nodeName, timeFrame);
    res.json({ success: true, data: rrdData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

