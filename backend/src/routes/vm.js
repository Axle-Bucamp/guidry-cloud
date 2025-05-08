const express = require("express");
const proxmoxService = require("../services/proxmoxService");

const router = express.Router();

// Note: These routes assume the node is known or passed in the request.
// For simplicity, we might need to adjust how the node is determined (e.g., from session, query param).
// Assuming nodeName is available in req (e.g., req.nodeName set by middleware or passed in body/query)

// GET /api/vms/:nodeName/:vmid/config - Get config for a specific VM
router.get("/:nodeName/:vmid/config", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    const config = await proxmoxService.getVMConfig(nodeName, vmid);
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vms/:nodeName/:vmid/start - Start a specific VM
router.post("/:nodeName/:vmid/start", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    // Use proxmox-api: POST /nodes/{node}/qemu/{vmid}/status/start
    const result = await proxmoxService.proxmox.nodes.$(nodeName).qemu.$(vmid).status.start.$post();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error starting VM ${vmid} on node ${nodeName}:`, error);
    res.status(500).json({ success: false, message: `Failed to start VM ${vmid}` });
  }
});

// POST /api/vms/:nodeName/:vmid/stop - Stop a specific VM
router.post("/:nodeName/:vmid/stop", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    // Use proxmox-api: POST /nodes/{node}/qemu/{vmid}/status/stop
    const result = await proxmoxService.proxmox.nodes.$(nodeName).qemu.$(vmid).status.stop.$post();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error stopping VM ${vmid} on node ${nodeName}:`, error);
    res.status(500).json({ success: false, message: `Failed to stop VM ${vmid}` });
  }
});

// POST /api/vms/:nodeName/:vmid/shutdown - Shutdown a specific VM (graceful)
router.post("/:nodeName/:vmid/shutdown", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    // Use proxmox-api: POST /nodes/{node}/qemu/{vmid}/status/shutdown
    const result = await proxmoxService.proxmox.nodes.$(nodeName).qemu.$(vmid).status.shutdown.$post();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error(`Error shutting down VM ${vmid} on node ${nodeName}:`, error);
    res.status(500).json({ success: false, message: `Failed to shutdown VM ${vmid}` });
  }
});

// GET /api/vms/:nodeName/:vmid/status - Get current status of a specific VM
router.get("/:nodeName/:vmid/status", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    // Use proxmox-api: GET /nodes/{node}/qemu/{vmid}/status/current
    const status = await proxmoxService.proxmox.nodes.$(nodeName).qemu.$(vmid).status.current.$get();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error(`Error getting status for VM ${vmid} on node ${nodeName}:`, error);
    res.status(500).json({ success: false, message: `Failed to get status for VM ${vmid}` });
  }
});


module.exports = router;

