const express = require("express");
const proxmoxService = require("../services/proxmoxService");

const router = express.Router();

// POST /api/vnc/:nodeName/:vmid - Get VNC proxy details for a specific VM
router.post("/:nodeName/:vmid", async (req, res) => {
  try {
    const { nodeName, vmid } = req.params;
    // The service method already constructs the websocket URL
    const vncDetails = await proxmoxService.getVNCProxy(nodeName, vmid);
    res.json({ success: true, data: vncDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Placeholder for LXC console (requires different API calls, e.g., termproxy)
// router.post("/lxc/:nodeName/:vmid", async (req, res) => { ... });

module.exports = router;

