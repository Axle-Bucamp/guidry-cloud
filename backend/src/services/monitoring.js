/**
 * Monitoring service for Proxmox PaaS
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const vaultService = require('./vault');

class MonitoringService {
  constructor() {
    this.proxmoxUrl = process.env.PROXMOX_API_URL || 'https://localhost:8006/api2/json';
    this.credentials = null;
    this.client = null;
  }

  /**
   * Initialize monitoring service
   */
  async initialize() {
    try {
      // Get Proxmox credentials from Vault
      const credentialsResult = await vaultService.getProxmoxCredentials();
      
      if (!credentialsResult.success) {
        console.error('Failed to get Proxmox credentials from Vault');
        return false;
      }
      
      this.credentials = credentialsResult.data;
      
      // Create HTTP client
      this.client = axios.create({
        baseURL: this.proxmoxUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        })
      });
      
      // Test connection
      const authResult = await this.authenticate();
      
      if (!authResult.success) {
        console.error('Failed to authenticate with Proxmox API');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing monitoring service:', error.message);
      return false;
    }
  }

  /**
   * Authenticate with Proxmox API
   */
  async authenticate() {
    try {
      const response = await this.client.post('/access/ticket', {
        username: this.credentials.username,
        password: this.credentials.password
      });
      
      // Set authentication headers for future requests
      this.client.defaults.headers.common['Cookie'] = `PVEAuthCookie=${response.data.data.ticket}`;
      this.client.defaults.headers.common['CSRFPreventionToken'] = response.data.data.CSRFPreventionToken;
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error authenticating with Proxmox API:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cluster status
   */
  async getClusterStatus() {
    try {
      const response = await this.client.get('/cluster/status');
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting cluster status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get node status
   * @param {string} node - Node name
   */
  async getNodeStatus(node) {
    try {
      const response = await this.client.get(`/nodes/${node}/status`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error getting status for node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get resource usage for a node
   * @param {string} node - Node name
   */
  async getNodeResourceUsage(node) {
    try {
      const response = await this.client.get(`/nodes/${node}/status`);
      
      // Extract relevant metrics
      const { data } = response.data;
      const metrics = {
        cpu: data.cpu * 100, // Convert to percentage
        memory: {
          total: data.memory.total,
          used: data.memory.used,
          free: data.memory.free,
          usagePercentage: (data.memory.used / data.memory.total) * 100
        },
        swap: {
          total: data.swap.total,
          used: data.swap.used,
          free: data.swap.free,
          usagePercentage: data.swap.total > 0 ? (data.swap.used / data.swap.total) * 100 : 0
        },
        uptime: data.uptime,
        loadAverage: data.loadavg
      };
      
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error(`Error getting resource usage for node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get CEPH status
   */
  async getCephStatus() {
    try {
      // First, get a node that has CEPH installed
      const clusterStatus = await this.getClusterStatus();
      
      if (!clusterStatus.success) {
        return {
          success: false,
          error: 'Failed to get cluster status'
        };
      }
      
      // Find a node to query CEPH status
      const node = clusterStatus.data[0]?.name;
      
      if (!node) {
        return {
          success: false,
          error: 'No nodes found in cluster'
        };
      }
      
      // Get CEPH status from the node
      const response = await this.client.get(`/nodes/${node}/ceph/status`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting CEPH status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get VM resource usage
   * @param {string} node - Node name
   * @param {number} vmid - VM ID
   */
  async getVMResourceUsage(node, vmid) {
    try {
      const response = await this.client.get(`/nodes/${node}/qemu/${vmid}/status/current`);
      
      // Extract relevant metrics
      const { data } = response.data;
      const metrics = {
        status: data.status,
        cpu: data.cpu * 100, // Convert to percentage
        memory: {
          total: data.maxmem,
          used: data.mem,
          usagePercentage: (data.mem / data.maxmem) * 100
        },
        disk: {
          total: data.maxdisk,
          used: data.disk,
          usagePercentage: (data.disk / data.maxdisk) * 100
        },
        uptime: data.uptime,
        netIn: data.netin,
        netOut: data.netout
      };
      
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error(`Error getting resource usage for VM ${vmid} on node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get LXC container resource usage
   * @param {string} node - Node name
   * @param {number} vmid - Container ID
   */
  async getLXCResourceUsage(node, vmid) {
    try {
      const response = await this.client.get(`/nodes/${node}/lxc/${vmid}/status/current`);
      
      // Extract relevant metrics
      const { data } = response.data;
      const metrics = {
        status: data.status,
        cpu: data.cpu * 100, // Convert to percentage
        memory: {
          total: data.maxmem,
          used: data.mem,
          usagePercentage: (data.mem / data.maxmem) * 100
        },
        disk: {
          total: data.maxdisk,
          used: data.disk,
          usagePercentage: (data.disk / data.maxdisk) * 100
        },
        uptime: data.uptime,
        netIn: data.netin,
        netOut: data.netout
      };
      
      return {
        success: true,
        data: metrics
      };
    } catch (error) {
      console.error(`Error getting resource usage for LXC container ${vmid} on node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get historical metrics for a node
   * @param {string} node - Node name
   * @param {string} timeframe - Timeframe (hour, day, week, month, year)
   */
  async getNodeHistoricalMetrics(node, timeframe = 'day') {
    try {
      const response = await this.client.get(`/nodes/${node}/rrddata`, {
        params: {
          timeframe
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error getting historical metrics for node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get historical metrics for a VM
   * @param {string} node - Node name
   * @param {number} vmid - VM ID
   * @param {string} timeframe - Timeframe (hour, day, week, month, year)
   */
  async getVMHistoricalMetrics(node, vmid, timeframe = 'day') {
    try {
      const response = await this.client.get(`/nodes/${node}/qemu/${vmid}/rrddata`, {
        params: {
          timeframe
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error getting historical metrics for VM ${vmid} on node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get historical metrics for an LXC container
   * @param {string} node - Node name
   * @param {number} vmid - Container ID
   * @param {string} timeframe - Timeframe (hour, day, week, month, year)
   */
  async getLXCHistoricalMetrics(node, vmid, timeframe = 'day') {
    try {
      const response = await this.client.get(`/nodes/${node}/lxc/${vmid}/rrddata`, {
        params: {
          timeframe
        }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Error getting historical metrics for LXC container ${vmid} on node ${node}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MonitoringService();
