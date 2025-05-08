#!/bin/bash

# Deployment script for Proxmox PaaS
# This script prepares and deploys the backend and frontend components

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ $2${NC}"
  else
    echo -e "${RED}✗ $2${NC}"
    exit 1
  fi
}

# Function to print section header
print_header() {
  echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Navigate to project root
cd /home/ubuntu/proxmox-paas

# Create deployment directory
print_header "Creating Deployment Directory"
DEPLOY_DIR="/home/ubuntu/proxmox-paas-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/backend
mkdir -p $DEPLOY_DIR/frontend
print_status 0 "Created deployment directory at $DEPLOY_DIR"

# Prepare backend for deployment
print_header "Preparing Backend for Deployment"
echo "Copying backend files..."
cp -r backend/src $DEPLOY_DIR/backend/
cp backend/package.json $DEPLOY_DIR/backend/
cp backend/.env.example $DEPLOY_DIR/backend/.env

# Create production configuration
cat > $DEPLOY_DIR/backend/.env << EOL
# Production Environment Variables for Proxmox PaaS
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://proxmox-paas.example.com

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=proxmox_paas
DB_USER=postgres
DB_PASSWORD=secure_password

# JWT Configuration
JWT_SECRET=change_this_to_a_secure_random_string
JWT_EXPIRES_IN=24h

# Proxmox API Configuration
PROXMOX_API_URL=https://your-proxmox-server:8006/api2/json
PROXMOX_USER=root@pam
PROXMOX_PASSWORD=your_proxmox_password

# Vault Configuration
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your_vault_token

# Email Configuration for Alerts
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=alerts@example.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=alerts@example.com

# TLS Configuration
TLS_CERT_PATH=/path/to/cert.pem
TLS_KEY_PATH=/path/to/key.pem
EOL

print_status 0 "Backend prepared for deployment"

# Prepare frontend for deployment
print_header "Preparing Frontend for Deployment"
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Copying frontend files..."
cp -r frontend/.next $DEPLOY_DIR/frontend/
cp -r frontend/public $DEPLOY_DIR/frontend/
cp frontend/package.json $DEPLOY_DIR/frontend/
cp frontend/next.config.js $DEPLOY_DIR/frontend/

# Create production configuration for frontend
cat > $DEPLOY_DIR/frontend/.env.production << EOL
# Production Environment Variables for Frontend
NEXT_PUBLIC_API_URL=https://api.proxmox-paas.example.com
NEXT_PUBLIC_OAUTH_REDIRECT_URI=https://proxmox-paas.example.com/auth/callback
EOL

print_status 0 "Frontend prepared for deployment"

# Create deployment documentation
print_header "Creating Deployment Documentation"
cat > $DEPLOY_DIR/README.md << EOL
# Proxmox PaaS Deployment

This directory contains the deployment-ready version of the Proxmox PaaS system.

## Backend Deployment

1. Navigate to the backend directory:
   \`\`\`
   cd backend
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install --production
   \`\`\`

3. Edit the \`.env\` file to configure your environment variables.

4. Start the backend server:
   \`\`\`
   npm start
   \`\`\`

   For production use, it's recommended to use a process manager like PM2:
   \`\`\`
   npm install -g pm2
   pm2 start src/index.js --name proxmox-paas-backend
   \`\`\`

## Frontend Deployment

1. Navigate to the frontend directory:
   \`\`\`
   cd frontend
   \`\`\`

2. Install dependencies:
   \`\`\`
   npm install --production
   \`\`\`

3. Edit the \`.env.production\` file to configure your environment variables.

4. Start the frontend server:
   \`\`\`
   npm start
   \`\`\`

   For production use, it's recommended to use a process manager like PM2:
   \`\`\`
   npm install -g pm2
   pm2 start npm --name proxmox-paas-frontend -- start
   \`\`\`

## Database Setup

Before starting the backend, you need to set up the PostgreSQL database:

1. Create the database:
   \`\`\`
   createdb proxmox_paas
   \`\`\`

2. Run the database schema script:
   \`\`\`
   psql -d proxmox_paas -f backend/src/models/database.sql
   \`\`\`

## Vault Setup

The system uses HashiCorp Vault for secure credential storage:

1. Install Vault: https://www.vaultproject.io/downloads

2. Initialize Vault:
   \`\`\`
   vault operator init
   \`\`\`

3. Unseal Vault:
   \`\`\`
   vault operator unseal
   \`\`\`

4. Create a token for the application:
   \`\`\`
   vault token create -policy=default
   \`\`\`

5. Update the \`VAULT_TOKEN\` in the backend \`.env\` file.

## Proxmox Integration

Ensure your Proxmox server is accessible from the backend server and that the API credentials in the \`.env\` file are correct.

## Security Considerations

1. Use HTTPS for both frontend and backend
2. Set strong passwords for all services
3. Regularly update all dependencies
4. Implement proper firewall rules
5. Set up regular backups

## Monitoring

The system includes built-in monitoring and alerting. Configure the email settings in the \`.env\` file to receive alerts.
EOL

print_status 0 "Deployment documentation created"

# Create deployment package
print_header "Creating Deployment Package"
cd /home/ubuntu
tar -czf proxmox-paas-deploy.tar.gz proxmox-paas-deploy
print_status 0 "Deployment package created at /home/ubuntu/proxmox-paas-deploy.tar.gz"

# All steps completed
print_header "Deployment Preparation Complete"
echo -e "${GREEN}The Proxmox PaaS system has been prepared for deployment.${NC}"
echo -e "${YELLOW}To deploy the system:${NC}"
echo -e "1. Transfer the deployment package to your production server"
echo -e "2. Extract the package: tar -xzf proxmox-paas-deploy.tar.gz"
echo -e "3. Follow the instructions in the README.md file"

exit 0
