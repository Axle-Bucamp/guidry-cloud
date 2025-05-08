const proxmox = require("../config/proxmox");

class ProxmoxService {
  async getNodes() {
    try {
      // Use the proxmox-api client to get nodes
      // The API path is GET /nodes
      const nodes = await proxmox.nodes.$get();
      return nodes;
    } catch (error) {
      console.error("Error fetching nodes:", error);
      throw new Error("Failed to fetch nodes from Proxmox API");
    }
  }

  async getNodeStatus(nodeName) {
    try {
      // GET /nodes/{node}/status
      const status = await proxmox.nodes.$(nodeName).status.$get();
      return status;
    } catch (error) {
      console.error(`Error fetching status for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch status for node ${nodeName}`);
    }
  }

  async getVMs(nodeName) {
    try {
      // GET /nodes/{node}/qemu
      const vms = await proxmox.nodes.$(nodeName).qemu.$get({ full: true });
      return vms;
    } catch (error) {
      console.error(`Error fetching VMs for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch VMs for node ${nodeName}`);
    }
  }

  async getContainers(nodeName) {
    try {
      // GET /nodes/{node}/lxc
      const containers = await proxmox.nodes.$(nodeName).lxc.$get();
      return containers;
    } catch (error) {
      console.error(`Error fetching containers for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch containers for node ${nodeName}`);
    }
  }

  async getVMConfig(nodeName, vmid) {
    try {
      // GET /nodes/{node}/qemu/{vmid}/config
      const config = await proxmox.nodes.$(nodeName).qemu.$(vmid).config.$get();
      return config;
    } catch (error) {
      console.error(`Error fetching config for VM ${vmid} on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch config for VM ${vmid}`);
    }
  }

  async getVNCProxy(nodeName, vmid) {
    try {
      // POST /nodes/{node}/qemu/{vmid}/vncproxy
      const vncData = await proxmox.nodes.$(nodeName).qemu.$(vmid).vncproxy.$post();
      // Construct the WebSocket URL
      // The host is the Proxmox node's address, which might need adjustment
      // based on network setup. Using the API host for now.
      const wsHost = process.env.PROXMOX_API_URL.replace("https://", "").replace("/api2/json", "");
      // Construct URL without ticket, ticket is passed via credentials in frontend
      const wsUrl = `wss://${wsHost}:${vncData.port}/`;
      return { ...vncData, websocketUrl: wsUrl };
    } catch (error) {
      console.error(`Error getting VNC proxy for VM ${vmid} on node ${nodeName}:`, error);
      throw new Error(`Failed to get VNC proxy for VM ${vmid}`);
    }
  }

  // Add more methods as needed for monitoring, container console, etc.
  async getNodeRRDData(nodeName, timeFrame = 'hour') {
    try {
      // GET /nodes/{node}/rrddata
      const rrdData = await proxmox.nodes.$(nodeName).rrddata.$get({ timeframe: timeFrame });
      return rrdData;
    } catch (error) {
      console.error(`Error fetching RRD data for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch RRD data for node ${nodeName}`);
    }
  }

  async getClusterStatus() {
    try {
      // GET /cluster/status
      const status = await proxmox.cluster.status.$get();
      return status;
    } catch (error) {
      console.error("Error fetching cluster status:", error);
      throw new Error("Failed to fetch cluster status");
    }
  }

  async getCephStatus() {
    try {
      // Attempt to get Ceph status - might fail if Ceph is not configured
      // GET /cluster/ceph/status
      const status = await proxmox.cluster.ceph.status.$get();
      return status;
    } catch (error) {
      // Ceph might not be enabled, return null or a specific error indicator
      if (error.message && error.message.includes('500')) { // Proxmox often returns 500 if Ceph isn't setup
        console.warn("Ceph might not be configured or available.");
        return null;
      }
      console.error("Error fetching Ceph status:", error);
      throw new Error("Failed to fetch Ceph status");
    }
  }
}

module.exports = new ProxmoxService();

