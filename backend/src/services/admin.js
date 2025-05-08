/**
 * Admin service for Proxmox PaaS
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const vaultService = require('./vault');
const db = require("../../config/database");

class AdminService {
  constructor() {
    this.proxmoxUrl = process.env.PROXMOX_API_URL || 'https://localhost:8006/api2/json';
    this.credentials = null;
    this.client = null;
  }

  /**
   * Initialize admin service
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
      console.error('Error initializing admin service:', error.message);
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
   * Get system status
   */
  async getSystemStatus() {
    try {
      // Get cluster status
      const clusterResponse = await this.client.get('/cluster/status');
      
      // Get nodes
      const nodesResponse = await this.client.get('/nodes');
      
      // Get storage
      const storageResponse = await this.client.get('/storage');
      
      // Get pools
      const poolsResponse = await this.client.get('/pools');
      
      // Compile system status
      const systemStatus = {
        cluster: clusterResponse.data.data,
        nodes: nodesResponse.data.data,
        storage: storageResponse.data.data,
        pools: poolsResponse.data.data
      };
      
      return {
        success: true,
        data: systemStatus
      };
    } catch (error) {
      console.error('Error getting system status:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics() {
    try {
      // Get user counts from database
      const userCountResult = await db.query('SELECT COUNT(*) FROM users');
      const adminCountResult = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      const organizationCountResult = await db.query('SELECT COUNT(*) FROM organizations');
      
      // Get active users (users who logged in within the last 30 days)
      const activeUsersResult = await db.query(
        'SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL \'30 days\''
      );
      
      // Get new users (users who registered within the last 30 days)
      const newUsersResult = await db.query(
        'SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL \'30 days\''
      );
      
      // Compile user statistics
      const userStatistics = {
        totalUsers: parseInt(userCountResult.rows[0].count),
        adminUsers: parseInt(adminCountResult.rows[0].count),
        organizations: parseInt(organizationCountResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        newUsers: parseInt(newUsersResult.rows[0].count)
      };
      
      return {
        success: true,
        data: userStatistics
      };
    } catch (error) {
      console.error('Error getting user statistics:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get resource statistics
   */
  async getResourceStatistics() {
    try {
      // Get VM and container counts from database
      const vmCountResult = await db.query('SELECT COUNT(*) FROM virtual_machines');
      const containerCountResult = await db.query('SELECT COUNT(*) FROM lxc_containers');
      
      // Get running VM and container counts
      const runningVMCountResult = await db.query(
        'SELECT COUNT(*) FROM virtual_machines WHERE status = \'running\''
      );
      const runningContainerCountResult = await db.query(
        'SELECT COUNT(*) FROM lxc_containers WHERE status = \'running\''
      );
      
      // Get resource allocation
      const vmResourcesResult = await db.query(
        'SELECT SUM(cpu) as total_cpu, SUM(memory) as total_memory, SUM(disk) as total_disk FROM virtual_machines'
      );
      const containerResourcesResult = await db.query(
        'SELECT SUM(cpu) as total_cpu, SUM(memory) as total_memory, SUM(disk) as total_disk FROM lxc_containers'
      );
      
      // Compile resource statistics
      const resourceStatistics = {
        vms: {
          total: parseInt(vmCountResult.rows[0].count),
          running: parseInt(runningVMCountResult.rows[0].count),
          resources: {
            cpu: parseInt(vmResourcesResult.rows[0].total_cpu) || 0,
            memory: parseInt(vmResourcesResult.rows[0].total_memory) || 0,
            disk: parseInt(vmResourcesResult.rows[0].total_disk) || 0
          }
        },
        containers: {
          total: parseInt(containerCountResult.rows[0].count),
          running: parseInt(runningContainerCountResult.rows[0].count),
          resources: {
            cpu: parseInt(containerResourcesResult.rows[0].total_cpu) || 0,
            memory: parseInt(containerResourcesResult.rows[0].total_memory) || 0,
            disk: parseInt(containerResourcesResult.rows[0].total_disk) || 0
          }
        }
      };
      
      return {
        success: true,
        data: resourceStatistics
      };
    } catch (error) {
      console.error('Error getting resource statistics:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStatistics() {
    try {
      // Get total audit log count
      const logCountResult = await db.query('SELECT COUNT(*) FROM audit_logs');
      
      // Get audit log counts by action
      const actionCountsResult = await db.query(
        'SELECT action, COUNT(*) FROM audit_logs GROUP BY action ORDER BY COUNT(*) DESC'
      );
      
      // Get audit log counts by resource type
      const resourceTypeCountsResult = await db.query(
        'SELECT resource_type, COUNT(*) FROM audit_logs GROUP BY resource_type ORDER BY COUNT(*) DESC'
      );
      
      // Get recent audit logs
      const recentLogsResult = await db.query(
        `SELECT al.*, u.email as user_email 
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ORDER BY al.created_at DESC
         LIMIT 10`
      );
      
      // Compile audit log statistics
      const auditLogStatistics = {
        totalLogs: parseInt(logCountResult.rows[0].count),
        actionCounts: actionCountsResult.rows.map(row => ({
          action: row.action,
          count: parseInt(row.count)
        })),
        resourceTypeCounts: resourceTypeCountsResult.rows.map(row => ({
          resourceType: row.resource_type,
          count: parseInt(row.count)
        })),
        recentLogs: recentLogsResult.rows
      };
      
      return {
        success: true,
        data: auditLogStatistics
      };
    } catch (error) {
      console.error('Error getting audit log statistics:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth() {
    try {
      // Check database connection
      const dbHealthy = await this.checkDatabaseHealth();
      
      // Check Proxmox API connection
      const proxmoxHealthy = await this.checkProxmoxHealth();
      
      // Check Vault connection
      const vaultHealthy = await this.checkVaultHealth();
      
      // Check disk space
      const diskSpaceHealthy = await this.checkDiskSpace();
      
      // Compile system health
      const systemHealth = {
        overall: dbHealthy && proxmoxHealthy && vaultHealthy && diskSpaceHealthy,
        components: {
          database: dbHealthy,
          proxmox: proxmoxHealthy,
          vault: vaultHealthy,
          diskSpace: diskSpaceHealthy
        }
      };
      
      return {
        success: true,
        data: systemHealth
      };
    } catch (error) {
      console.error('Error getting system health:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      await db.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check Proxmox API health
   */
  async checkProxmoxHealth() {
    try {
      const response = await this.client.get('/version');
      return response.status === 200;
    } catch (error) {
      console.error('Proxmox API health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check Vault health
   */
  async checkVaultHealth() {
    try {
      const result = await vaultService.initialize();
      return result;
    } catch (error) {
      console.error('Vault health check failed:', error.message);
      return false;
    }
  }

  /**
   * Check disk space
   */
  async checkDiskSpace() {
    try {
      // Use child_process to run df command
      const { execSync } = require('child_process');
      const output = execSync('df -h / | tail -1 | awk \'{print $5}\'').toString().trim();
      
      // Parse percentage
      const usagePercentage = parseInt(output.replace('%', ''));
      
      // Consider healthy if usage is below 90%
      return usagePercentage < 90;
    } catch (error) {
      console.error('Disk space check failed:', error.message);
      return false;
    }
  }
}

module.exports = new AdminService();
