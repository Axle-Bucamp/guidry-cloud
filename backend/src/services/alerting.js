/**
 * Alerting service for Proxmox PaaS
 */
const nodemailer = require('nodemailer');
const db = require('../config/database');
const monitoringService = require('./monitoring');

class AlertingService {
  constructor() {
    this.emailTransporter = null;
    this.alertThresholds = {
      cpu: 90, // 90% CPU usage
      memory: 85, // 85% memory usage
      disk: 80, // 80% disk usage
      ceph: 80 // 80% CEPH storage usage
    };
  }

  /**
   * Initialize alerting service
   */
  async initialize() {
    try {
      // Initialize email transporter
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      
      // Test email connection
      await this.emailTransporter.verify();
      
      console.log('Alerting service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing alerting service:', error.message);
      return false;
    }
  }

  /**
   * Check system for alerts
   */
  async checkAlerts() {
    try {
      const alerts = [];
      
      // Check node resource usage
      const nodeAlerts = await this.checkNodeAlerts();
      alerts.push(...nodeAlerts);
      
      // Check VM resource usage
      const vmAlerts = await this.checkVMAlerts();
      alerts.push(...vmAlerts);
      
      // Check LXC container resource usage
      const lxcAlerts = await this.checkLXCAlerts();
      alerts.push(...lxcAlerts);
      
      // Check CEPH status
      const cephAlerts = await this.checkCephAlerts();
      alerts.push(...cephAlerts);
      
      // Save alerts to database
      await this.saveAlerts(alerts);
      
      // Send alert notifications
      await this.sendAlertNotifications(alerts);
      
      return {
        success: true,
        data: alerts
      };
    } catch (error) {
      console.error('Error checking alerts:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check node resource usage for alerts
   */
  async checkNodeAlerts() {
    try {
      const alerts = [];
      
      // Get cluster status
      const clusterResult = await monitoringService.getClusterStatus();
      
      if (!clusterResult.success) {
        return alerts;
      }
      
      // Get nodes
      const nodes = clusterResult.data.filter(node => node.type === 'node');
      
      // Check each node
      for (const node of nodes) {
        // Skip offline nodes
        if (node.status !== 'online') {
          continue;
        }
        
        // Get node resource usage
        const resourceResult = await monitoringService.getNodeResourceUsage(node.name);
        
        if (!resourceResult.success) {
          continue;
        }
        
        const { cpu, memory, swap } = resourceResult.data;
        
        // Check CPU usage
        if (cpu > this.alertThresholds.cpu) {
          alerts.push({
            type: 'node_cpu',
            severity: 'high',
            resourceType: 'node',
            resourceId: node.name,
            message: `High CPU usage (${cpu.toFixed(1)}%) on node ${node.name}`,
            details: {
              node: node.name,
              cpu: cpu,
              threshold: this.alertThresholds.cpu
            }
          });
        }
        
        // Check memory usage
        if (memory.usagePercentage > this.alertThresholds.memory) {
          alerts.push({
            type: 'node_memory',
            severity: 'high',
            resourceType: 'node',
            resourceId: node.name,
            message: `High memory usage (${memory.usagePercentage.toFixed(1)}%) on node ${node.name}`,
            details: {
              node: node.name,
              memory: memory.usagePercentage,
              threshold: this.alertThresholds.memory
            }
          });
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking node alerts:', error.message);
      return [];
    }
  }

  /**
   * Check VM resource usage for alerts
   */
  async checkVMAlerts() {
    try {
      const alerts = [];
      
      // Get VMs from database
      const vmsResult = await db.query(
        'SELECT id, name, node FROM virtual_machines WHERE status = \'running\''
      );
      
      // Check each VM
      for (const vm of vmsResult.rows) {
        // Get VM resource usage
        const resourceResult = await monitoringService.getVMResourceUsage(vm.node, vm.id);
        
        if (!resourceResult.success) {
          continue;
        }
        
        const { cpu, memory, disk } = resourceResult.data;
        
        // Check CPU usage
        if (cpu > this.alertThresholds.cpu) {
          alerts.push({
            type: 'vm_cpu',
            severity: 'medium',
            resourceType: 'vm',
            resourceId: vm.id,
            message: `High CPU usage (${cpu.toFixed(1)}%) on VM ${vm.name}`,
            details: {
              vm: vm.name,
              node: vm.node,
              cpu: cpu,
              threshold: this.alertThresholds.cpu
            }
          });
        }
        
        // Check memory usage
        if (memory.usagePercentage > this.alertThresholds.memory) {
          alerts.push({
            type: 'vm_memory',
            severity: 'medium',
            resourceType: 'vm',
            resourceId: vm.id,
            message: `High memory usage (${memory.usagePercentage.toFixed(1)}%) on VM ${vm.name}`,
            details: {
              vm: vm.name,
              node: vm.node,
              memory: memory.usagePercentage,
              threshold: this.alertThresholds.memory
            }
          });
        }
        
        // Check disk usage
        if (disk.usagePercentage > this.alertThresholds.disk) {
          alerts.push({
            type: 'vm_disk',
            severity: 'medium',
            resourceType: 'vm',
            resourceId: vm.id,
            message: `High disk usage (${disk.usagePercentage.toFixed(1)}%) on VM ${vm.name}`,
            details: {
              vm: vm.name,
              node: vm.node,
              disk: disk.usagePercentage,
              threshold: this.alertThresholds.disk
            }
          });
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking VM alerts:', error.message);
      return [];
    }
  }

  /**
   * Check LXC container resource usage for alerts
   */
  async checkLXCAlerts() {
    try {
      const alerts = [];
      
      // Get LXC containers from database
      const containersResult = await db.query(
        'SELECT id, name, node FROM lxc_containers WHERE status = \'running\''
      );
      
      // Check each container
      for (const container of containersResult.rows) {
        // Get container resource usage
        const resourceResult = await monitoringService.getLXCResourceUsage(container.node, container.id);
        
        if (!resourceResult.success) {
          continue;
        }
        
        const { cpu, memory, disk } = resourceResult.data;
        
        // Check CPU usage
        if (cpu > this.alertThresholds.cpu) {
          alerts.push({
            type: 'lxc_cpu',
            severity: 'medium',
            resourceType: 'container',
            resourceId: container.id,
            message: `High CPU usage (${cpu.toFixed(1)}%) on container ${container.name}`,
            details: {
              container: container.name,
              node: container.node,
              cpu: cpu,
              threshold: this.alertThresholds.cpu
            }
          });
        }
        
        // Check memory usage
        if (memory.usagePercentage > this.alertThresholds.memory) {
          alerts.push({
            type: 'lxc_memory',
            severity: 'medium',
            resourceType: 'container',
            resourceId: container.id,
            message: `High memory usage (${memory.usagePercentage.toFixed(1)}%) on container ${container.name}`,
            details: {
              container: container.name,
              node: container.node,
              memory: memory.usagePercentage,
              threshold: this.alertThresholds.memory
            }
          });
        }
        
        // Check disk usage
        if (disk.usagePercentage > this.alertThresholds.disk) {
          alerts.push({
            type: 'lxc_disk',
            severity: 'medium',
            resourceType: 'container',
            resourceId: container.id,
            message: `High disk usage (${disk.usagePercentage.toFixed(1)}%) on container ${container.name}`,
            details: {
              container: container.name,
              node: container.node,
              disk: disk.usagePercentage,
              threshold: this.alertThresholds.disk
            }
          });
        }
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking LXC alerts:', error.message);
      return [];
    }
  }

  /**
   * Check CEPH status for alerts
   */
  async checkCephAlerts() {
    try {
      const alerts = [];
      
      // Get CEPH status
      const cephResult = await monitoringService.getCephStatus();
      
      if (!cephResult.success) {
        return alerts;
      }
      
      const { health, pgmap, osdmap } = cephResult.data;
      
      // Check health status
      if (health.status !== 'HEALTH_OK') {
        alerts.push({
          type: 'ceph_health',
          severity: 'high',
          resourceType: 'ceph',
          resourceId: 'ceph',
          message: `CEPH health issue: ${health.status}`,
          details: {
            status: health.status,
            checks: health.checks
          }
        });
      }
      
      // Check PG status
      if (pgmap.pgs_not_up > 0 || pgmap.pgs_not_clean > 0) {
        alerts.push({
          type: 'ceph_pg',
          severity: 'medium',
          resourceType: 'ceph',
          resourceId: 'ceph',
          message: `CEPH PG issues: ${pgmap.pgs_not_up} not up, ${pgmap.pgs_not_clean} not clean`,
          details: {
            pgs_not_up: pgmap.pgs_not_up,
            pgs_not_clean: pgmap.pgs_not_clean
          }
        });
      }
      
      // Check OSD status
      if (osdmap.num_osds !== osdmap.num_up_osds || osdmap.num_osds !== osdmap.num_in_osds) {
        alerts.push({
          type: 'ceph_osd',
          severity: 'high',
          resourceType: 'ceph',
          resourceId: 'ceph',
          message: `CEPH OSD issues: ${osdmap.num_osds - osdmap.num_up_osds} down, ${osdmap.num_osds - osdmap.num_in_osds} out`,
          details: {
            num_osds: osdmap.num_osds,
            num_up_osds: osdmap.num_up_osds,
            num_in_osds: osdmap.num_in_osds
          }
        });
      }
      
      // Check storage usage
      if (pgmap.bytes_used / pgmap.bytes_total > this.alertThresholds.ceph / 100) {
        const usagePercentage = (pgmap.bytes_used / pgmap.bytes_total) * 100;
        alerts.push({
          type: 'ceph_usage',
          severity: 'medium',
          resourceType: 'ceph',
          resourceId: 'ceph',
          message: `High CEPH storage usage: ${usagePercentage.toFixed(1)}%`,
          details: {
            usage: usagePercentage,
            threshold: this.alertThresholds.ceph,
            bytes_used: pgmap.bytes_used,
            bytes_total: pgmap.bytes_total
          }
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking CEPH alerts:', error.message);
      return [];
    }
  }

  /**
   * Save alerts to database
   * @param {Array} alerts - Alerts to save
   */
  async saveAlerts(alerts) {
    try {
      // Skip if no alerts
      if (alerts.length === 0) {
        return;
      }
      
      // Insert alerts into database
      for (const alert of alerts) {
        await db.query(
          `INSERT INTO alerts (type, severity, resource_type, resource_id, message, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            alert.type,
            alert.severity,
            alert.resourceType,
            alert.resourceId,
            alert.message,
            JSON.stringify(alert.details)
          ]
        );
      }
    } catch (error) {
      console.error('Error saving alerts:', error.message);
    }
  }

  /**
   * Send alert notifications
   * @param {Array} alerts - Alerts to send notifications for
   */
  async sendAlertNotifications(alerts) {
    try {
      // Skip if no alerts or email not configured
      if (alerts.length === 0 || !this.emailTransporter) {
        return;
      }
      
      // Get admin users
      const adminUsersResult = await db.query(
        "SELECT id, email FROM users WHERE role = 'admin' AND alert_notifications = true"
      );
      
      if (adminUsersResult.rows.length === 0) {
        return;
      }
      
      // Group alerts by severity
      const highAlerts = alerts.filter(alert => alert.severity === 'high');
      const mediumAlerts = alerts.filter(alert => alert.severity === 'medium');
      
      // Only send notifications for high and medium alerts
      if (highAlerts.length === 0 && mediumAlerts.length === 0) {
        return;
      }
      
      // Prepare email content
      let emailContent = '<h2>Proxmox PaaS Alert Notification</h2>';
      
      if (highAlerts.length > 0) {
        emailContent += '<h3>High Priority Alerts</h3><ul>';
        for (const alert of highAlerts) {
          emailContent += `<li><strong>${alert.message}</strong></li>`;
        }
        emailContent += '</ul>';
      }
      
      if (mediumAlerts.length > 0) {
        emailContent += '<h3>Medium Priority Alerts</h3><ul>';
        for (const alert of mediumAlerts) {
          emailContent += `<li>${alert.message}</li>`;
        }
        emailContent += '</ul>';
      }
      
      emailContent += '<p>Please check the admin dashboard for more details.</p>';
      
      // Send email to each admin
      for (const admin of adminUsersResult.rows) {
        await this.emailTransporter.sendMail({
          from: process.env.SMTP_FROM,
          to: admin.email,
          subject: `[Proxmox PaaS] Alert Notification - ${highAlerts.length} high, ${mediumAlerts.length} medium`,
          html: emailContent
        });
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error.message);
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const result = await db.query(
        `SELECT * FROM alerts 
         WHERE resolved = false
         ORDER BY created_at DESC`
      );
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting active alerts:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get alert history
   * @param {number} limit - Maximum number of alerts to return
   * @param {number} offset - Offset for pagination
   */
  async getAlertHistory(limit = 100, offset = 0) {
    try {
      const result = await db.query(
        `SELECT * FROM alerts 
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting alert history:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Resolve alert
   * @param {number} alertId - Alert ID
   */
  async resolveAlert(alertId) {
    try {
      const result = await db.query(
        `UPDATE alerts 
         SET resolved = true, resolved_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [alertId]
      );
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'Alert not found'
        };
      }
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error resolving alert:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AlertingService();
