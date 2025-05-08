# Proxmox PaaS Deployment

This directory contains the deployment-ready version of the Proxmox PaaS system.

## Backend Deployment

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Edit the `.env` file to configure your environment variables.

4. Start the backend server:
   ```
   npm start
   ```

   For production use, it's recommended to use a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start src/index.js --name proxmox-paas-backend
   ```

## Frontend Deployment

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install --production
   ```

3. Edit the `.env.production` file to configure your environment variables.

4. Start the frontend server:
   ```
   npm start
   ```

   For production use, it's recommended to use a process manager like PM2:
   ```
   npm install -g pm2
   pm2 start npm --name proxmox-paas-frontend -- start
   ```

## Database Setup

Before starting the backend, you need to set up the PostgreSQL database:

1. Create the database:
   ```
   createdb proxmox_paas
   ```

2. Run the database schema script:
   ```
   psql -d proxmox_paas -f backend/src/models/database.sql
   ```

## Vault Setup

The system uses HashiCorp Vault for secure credential storage:

1. Install Vault: https://www.vaultproject.io/downloads

2. Initialize Vault:
   ```
   vault operator init
   ```

3. Unseal Vault:
   ```
   vault operator unseal
   ```

4. Create a token for the application:
   ```
   vault token create -policy=default
   ```

5. Update the `VAULT_TOKEN` in the backend `.env` file.

## Proxmox Integration

Ensure your Proxmox server is accessible from the backend server and that the API credentials in the `.env` file are correct.

## Security Considerations

1. Use HTTPS for both frontend and backend
2. Set strong passwords for all services
3. Regularly update all dependencies
4. Implement proper firewall rules
5. Set up regular backups

## Monitoring

The system includes built-in monitoring and alerting. Configure the email settings in the `.env` file to receive alerts.
