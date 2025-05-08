# Proxmox PaaS Project Documentation

## Overview
This document provides comprehensive documentation for the Proxmox PaaS (Platform as a Service) system. The system integrates Proxmox VE with Ansible, Terraform, and Harpsichord to create a fully operational PaaS solution with a modern web interface.

## System Architecture

### Components
1. **Backend**
   - Node.js with Express
   - PostgreSQL database
   - Redis for caching
   - Terraform Vault for credential management
   - Integration with Proxmox API, Ansible, and Terraform

2. **Frontend**
   - Next.js React framework
   - Tailwind CSS for styling
   - noVNC for VM console access
   - Web-based terminal for LXC containers
   - Parsec integration for Windows VMs with GPU bridging

3. **Security**
   - TLS encryption
   - OAuth authentication
   - Role-based access control
   - API key management
   - Audit logging

4. **Monitoring**
   - Real-time resource monitoring
   - Historical metrics collection
   - Alerting system with email notifications
   - System health checks
   - CEPH storage monitoring

## Installation

### Prerequisites
- Proxmox VE server (version 7.0+)
- Node.js (version 16+)
- PostgreSQL (version 13+)
- Redis (version 6+)
- HashiCorp Vault (version 1.8+)
- Ansible (version 2.9+)
- Terraform (version 1.0+)

### Backend Installation
1. Extract the deployment package:
   ```
   tar -xzf proxmox-paas-deploy.tar.gz
   cd proxmox-paas-deploy/backend
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Edit `.env` to match your environment

4. Set up the database:
   ```
   createdb proxmox_paas
   psql -d proxmox_paas -f src/models/database.sql
   ```

5. Start the backend server:
   ```
   npm start
   ```

### Frontend Installation
1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Configure environment variables:
   - Edit `.env.production` to match your environment

4. Start the frontend server:
   ```
   npm start
   ```

## Configuration

### Proxmox Integration
The system connects to Proxmox VE through its API. Configure the connection in the backend `.env` file:
```
PROXMOX_API_URL=https://your-proxmox-server:8006/api2/json
PROXMOX_USER=root@pam
PROXMOX_PASSWORD=your_proxmox_password
```

### Terraform Integration
Terraform is used for infrastructure provisioning. The system uses Terraform to create and manage VMs and containers on Proxmox.

### Ansible Integration
Ansible is used for configuration management. The system uses Ansible to configure VMs and containers after they are created.

### Harpsichord Integration
Harpsichord is used for dynamic provisioning with intelligent node selection and resource scaling.

## Features

### User Management
- User registration and authentication
- Organization management
- Role-based access control
- API key management

### VM Management
- Create, start, stop, and delete VMs
- View VM details and status
- Access VM console via noVNC
- Access Windows VMs via Parsec for GPU bridging

### Container Management
- Create, start, stop, and delete LXC containers
- View container details and status
- Access container terminal via web-based terminal

### Monitoring
- Real-time resource monitoring
- Historical metrics collection
- CEPH storage monitoring
- System health checks

### Alerting
- Threshold-based alerts
- Email notifications
- Alert history and resolution

### Administration
- System status overview
- User and organization statistics
- Resource allocation and usage tracking
- Audit log analysis

## Security

### Authentication
The system uses OAuth for authentication. Users can log in using their OAuth provider credentials.

### Authorization
The system implements role-based access control with three roles:
- Admin: Full access to all features
- Manager: Access to organization resources
- User: Limited access to assigned resources

### API Security
The system implements API key management for secure API access. API keys can be created, revoked, and have expiration dates.

### Audit Logging
All user actions are logged for security and compliance purposes. Logs include:
- User ID
- Action
- Resource type and ID
- Timestamp
- IP address

## Monitoring

### Resource Monitoring
The system monitors the following resources:
- CPU usage
- Memory usage
- Disk usage
- Network usage
- CEPH storage status

### Alerting
The system generates alerts based on configurable thresholds. Alerts are categorized by severity:
- High: Critical issues that require immediate attention
- Medium: Issues that should be addressed soon
- Low: Informational alerts

### Email Notifications
The system can send email notifications for alerts. Configure email settings in the backend `.env` file:
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@example.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=alerts@example.com
```

## Troubleshooting

### Common Issues

#### Backend Connection Issues
- Check that the Proxmox API URL is correct
- Verify Proxmox credentials
- Ensure the backend server has network access to the Proxmox server

#### Frontend Build Issues
- Check for path errors in component imports
- Ensure all dependencies are installed
- Verify that the Next.js configuration is correct

#### Database Issues
- Check PostgreSQL connection settings
- Verify that the database schema is correctly applied
- Ensure the database user has appropriate permissions

#### Vault Issues
- Check Vault connection settings
- Verify that Vault is unsealed
- Ensure the Vault token has appropriate permissions

## Maintenance

### Backups
It's recommended to regularly back up:
- PostgreSQL database
- Vault data
- Configuration files

### Updates
Regularly update:
- Node.js dependencies
- Frontend dependencies
- Operating system packages
- Proxmox VE

### Monitoring
Regularly check:
- System logs
- Alert history
- Resource usage trends

## Support
For support, please contact the development team or refer to the GitHub repository at https://github.com/community-scripts/ProxmoxVE.
