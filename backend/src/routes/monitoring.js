const express = require("express");
const proxmoxService = require("../services/proxmoxService");

const router = express.Router();

// GET /api/monitoring/dashboard - Get aggregated data for the dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Fetch cluster status and nodes in parallel
    const [clusterStatus, nodes] = await Promise.all([
      proxmoxService.getClusterStatus(),
      proxmoxService.getNodes(),
    ]);

    // Fetch individual node status and Ceph status (if applicable)
    const nodeDetailsPromises = nodes.map(node => proxmoxService.getNodeStatus(node.node));
    const nodeStatuses = await Promise.all(nodeDetailsPromises);
    const cephStatus = await proxmoxService.getCephStatus(); // Handles potential errors internally

    // Structure the dashboard data
    const dashboardData = {
      cluster: {
        nodes: clusterStatus.length, // Assuming clusterStatus is an array of nodes
        status: nodes.every(n => n.status === 'online') ? 'OK' : 'Warning', // Simple status check
      },
      nodes: nodes.map(node => {
        const statusDetail = nodeStatuses.find(s => s.node === node.node); // Find the corresponding status detail
        return {
          name: node.node,
          status: node.status,
          resources: statusDetail ? {
            cpu: statusDetail.cpu * 100, // Convert fraction to percentage
            memory: {
              total: statusDetail.memory.total,
              used: statusDetail.memory.used,
              free: statusDetail.memory.free,
              usagePercentage: (statusDetail.memory.used / statusDetail.memory.total) * 100,
            },
            swap: {
              total: statusDetail.swap.total,
              used: statusDetail.swap.used,
              free: statusDetail.swap.free,
              usagePercentage: statusDetail.swap.total > 0 ? (statusDetail.swap.used / statusDetail.swap.total) * 100 : 0,
            },
            uptime: statusDetail.uptime,
            loadAverage: statusDetail.loadavg, // Proxmox API provides loadavg array
          } : null,
        };
      }),
      ceph: cephStatus ? {
        health: { status: cephStatus.health?.status || 'UNKNOWN' },
        pgmap: { bytes_used: cephStatus.pgmap?.bytes_used || 0, bytes_total: cephStatus.pgmap?.bytes_total || 0 },
        // Add other relevant fields from cephStatus if needed
      } : null,
    };

    res.json({ success: true, data: dashboardData });

  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch dashboard data" });
  }
});

// GET /api/monitoring/rrd - Get RRD data for a specific node or VM/CT
// Example: /api/monitoring/rrd?node=pve&vmid=100&type=qemu&timeframe=hour
router.get("/rrd", async (req, res) => {
  try {
    const { node, vmid, type = 'node', timeframe = 'hour' } = req.query;

    if (!node) {
      return res.status(400).json({ success: false, message: "Node parameter is required" });
    }

    let rrdData;
    if (type === 'node') {
      rrdData = await proxmoxService.getNodeRRDData(node, timeframe);
    } else if (type === 'qemu' && vmid) {
      // GET /nodes/{node}/qemu/{vmid}/rrddata
      rrdData = await proxmoxService.proxmox.nodes.$(node).qemu.$(vmid).rrddata.$get({ timeframe });
    } else if (type === 'lxc' && vmid) {
      // GET /nodes/{node}/lxc/{vmid}/rrddata
      rrdData = await proxmoxService.proxmox.nodes.$(node).lxc.$(vmid).rrddata.$get({ timeframe });
    } else {
      return res.status(400).json({ success: false, message: "Invalid type or missing vmid" });
    }

    res.json({ success: true, data: rrdData });
  } catch (error) {
    console.error("Error fetching RRD data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch RRD data" });
  }
});

module.exports = router;

