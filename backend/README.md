# Proxmox PaaS Deployment README

This package contains the updated Proxmox PaaS system integrated with your live Proxmox API.

## Contents

- `backend/`: Node.js backend application (Express)
- `frontend/`: Next.js frontend application
- `documentation.md`: Original project documentation
- `README.md`: This file

## Setup Instructions

1.  **Prerequisites**:
    *   Node.js (v18 or later recommended)
    *   npm or pnpm
    *   PostgreSQL database (for user management, audit logs - optional for basic functionality)
    *   Redis (optional, for caching/session management)
    *   Access to your Proxmox server (`https://guidry-cloud.com/api2/json`)

2.  **Backend Setup**:
    *   Navigate to the `backend` directory: `cd backend`
    *   Create a `.env` file by copying `.env.example` (if provided) or using the content below.
    *   **Important**: Update the `.env` file with your actual database credentials, JWT secret, and any other necessary configurations. The Proxmox API details are already configured in the service, but using environment variables is best practice for production.
    *   Install dependencies: `npm install`
    *   (Optional) Set up the PostgreSQL database using the schema in `backend/src/models/database.sql`.
    *   Start the backend server: `node src/index.js` (or use a process manager like pm2 in production: `pm2 start src/index.js --name proxmox-paas-backend`)
    *   The backend should now be running (default port 3001).

3.  **Frontend Setup**:
    *   Navigate to the `frontend` directory: `cd ../frontend`
    *   Install dependencies: `npm install` (or `pnpm install`)
    *   Create a `.env.local` file and add the backend API URL:
        ```
        NEXT_PUBLIC_API_URL=http://localhost:3001/api
        NEXTAUTH_URL=http://localhost:3000 # Adjust if your frontend runs elsewhere
        NEXTAUTH_SECRET=a_secure_random_string_for_nextauth # Generate a strong secret
        ```
    *   Build the frontend: `npm run build`
    *   Start the frontend server: `npm run start` (or use `npm run dev` for development)
    *   The frontend should now be running (default port 3000).

4.  **Accessing the Application**:
    *   Open your web browser and navigate to `http://localhost:3000` (or the configured frontend URL).
    *   Log in using the configured OAuth providers or credentials.
    *   You should now be able to manage and view VMs/LXCs from your Proxmox server, including accessing the VNC console.

## Environment Variables (`backend/.env` example)

```
# Proxmox API (Configured in service, but good practice)
PROXMOX_API_URL=https://guidry-cloud.com/api2/json
PROXMOX_API_TOKEN_ID=root@pam!testing
PROXMOX_API_TOKEN_SECRET=88fb2141-598e-4b8c-b89f-649c0cb106f3

# Database (Required for full functionality like audit logs)
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=proxmox_paas
DB_PASSWORD=your_db_password
DB_PORT=5432

# OAuth (Replace placeholders with your actual provider details)
OAUTH_AUTHORIZATION_URL=https://example.com/oauth/authorize
OAUTH_TOKEN_URL=https://example.com/oauth/token
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_CALLBACK_URL=http://localhost:3001/api/auth/callback # Adjust host/port if needed

# JWT
JWT_SECRET=generate_a_strong_random_secret_here

# Server
PORT=3001
NODE_ENV=production # Use 'development' for testing
```

## Notes

*   The LXC console and Parsec integration are currently placeholders in the backend routes and frontend pages. Further development is needed to fully implement these features.
*   Ensure firewall rules allow communication between the backend server, frontend server, and your Proxmox instance.
*   For production deployments, consider using HTTPS, process managers (like pm2), and robust logging.

