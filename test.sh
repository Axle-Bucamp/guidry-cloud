#!/bin/bash

# Test script for Proxmox PaaS
# This script tests the functionality of the backend and frontend components

# Set up environment variables
export NODE_ENV=test
export PORT=3001
export FRONTEND_URL=http://localhost:3000
export JWT_SECRET=test_secret
export JWT_EXPIRES_IN=1h

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

# Test backend
print_header "Testing Backend"

# Check if backend files exist
echo "Checking backend files..."
if [ -f "backend/src/index.js" ] && [ -f "backend/src/services/proxmox.js" ] && [ -f "backend/src/services/terraform.js" ]; then
  print_status 0 "Backend files exist"
else
  print_status 1 "Backend files missing"
fi

# Check if package.json exists and has required dependencies
echo "Checking backend dependencies..."
if grep -q "express" backend/package.json && grep -q "passport" backend/package.json; then
  print_status 0 "Backend dependencies exist"
else
  print_status 1 "Backend dependencies missing"
fi

# Test frontend
print_header "Testing Frontend"

# Check if frontend files exist
echo "Checking frontend files..."
if [ -d "frontend/src/pages" ] && [ -d "frontend/src/components" ]; then
  print_status 0 "Frontend files exist"
else
  print_status 1 "Frontend files missing"
fi

# Check if package.json exists and has required dependencies
echo "Checking frontend dependencies..."
if grep -q "next" frontend/package.json && grep -q "react" frontend/package.json; then
  print_status 0 "Frontend dependencies exist"
else
  print_status 1 "Frontend dependencies missing"
fi

# Test security components
print_header "Testing Security Components"

# Check if security files exist
echo "Checking security files..."
if [ -f "backend/src/middleware/security.js" ] && [ -f "backend/src/middleware/auth.js" ]; then
  print_status 0 "Security files exist"
else
  print_status 1 "Security files missing"
fi

# Test monitoring components
print_header "Testing Monitoring Components"

# Check if monitoring files exist
echo "Checking monitoring files..."
if [ -f "backend/src/services/monitoring.js" ] && [ -f "backend/src/routes/monitoring.js" ]; then
  print_status 0 "Monitoring files exist"
else
  print_status 1 "Monitoring files missing"
fi

# Test admin components
print_header "Testing Admin Components"

# Check if admin files exist
echo "Checking admin files..."
if [ -f "backend/src/services/admin.js" ] && [ -f "backend/src/routes/admin.js" ]; then
  print_status 0 "Admin files exist"
else
  print_status 1 "Admin files missing"
fi

# Test alerting components
print_header "Testing Alerting Components"

# Check if alerting files exist
echo "Checking alerting files..."
if [ -f "backend/src/services/alerting.js" ] && [ -f "backend/src/routes/alerting.js" ]; then
  print_status 0 "Alerting files exist"
else
  print_status 1 "Alerting files missing"
fi

# Test VNC components
print_header "Testing VNC Components"

# Check if VNC files exist
echo "Checking VNC files..."
if [ -f "backend/src/routes/vnc.js" ] && [ -f "frontend/src/pages/vms/[id]/console.tsx" ]; then
  print_status 0 "VNC files exist"
else
  print_status 1 "VNC files missing"
fi

# All tests passed
print_header "All Tests Passed"
echo -e "${GREEN}The Proxmox PaaS system has passed all file existence tests.${NC}"
echo -e "${YELLOW}Note: This is a basic test script. For a production deployment, more comprehensive tests should be implemented.${NC}"

exit 0
