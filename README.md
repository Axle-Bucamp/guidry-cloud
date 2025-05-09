The Proxmox PaaS project has been significantly enhanced with new features and improvements. This document outlines the key changes and provides guidance for deployment and usage.

**Key Features & Enhancements:**

1.  **Proxmox API Integration:** The system now interacts directly with your Proxmox VE server using the provided API details. This replaces any mock data or simulated interactions with real-time data and control over your Proxmox environment.
2.  **VM and LXC Creation:** Users can now create VMs and LXC containers directly from the platform. The system supports creation from available templates and ISOs, providing flexibility in provisioning new instances.
3.  **Cost Computation System:** A basic cost computation system has been implemented. It estimates costs based on resource allocation (CPU, memory, disk) according to a configurable pricing model. The pricing configuration can be found in `backend/config/pricing.js`.
4.  **Prepaid Credit System:** Users operate on a prepaid credit basis. They can add funds to their accounts, and resource usage will be deducted from their credit balance. The system includes logic for monthly free credit allocation.
5.  **Payment Gateway Integration (Simulated):** The framework for integrating payment gateways like PayPal and cryptocurrency platforms (e.g., Crypto.com) has been established. While the actual payment processing is simulated, the backend logic for handling transactions and updating user credits is in place. You can replace the placeholder services in `backend/src/services/paypalService.js` and `backend/src/services/cryptoPaymentService.js` with actual SDK integrations for live payment processing.
6.  **Enhanced User Authentication:** The system uses JWT for secure authentication, and the user onboarding process has been refined. New users receive an initial credit balance upon registration.

**Deployment Steps:**

1.  **Prerequisites:**
    *   Node.js (v18 or later recommended)
    *   PostgreSQL server
    *   Access to a Proxmox VE server with API credentials

2.  **Backend Setup:**
    *   Navigate to the `backend` directory.
    *   Create a `.env` file based on `.env.example` and populate it with your Proxmox API details (URL, Token ID, Token Secret), database credentials, JWT secret, and any other relevant configurations.
    *   Install dependencies: `npm install`
    *   Initialize the database schema: `npm run db:init` (you might need to create this script based on your ORM or DB client)
    *   Start the backend server: `npm start` or `npm run dev` for development.

3.  **Frontend Setup:**
    *   Navigate to the `frontend` directory.
    *   Install dependencies: `npm install`
    *   Configure the API endpoint in your frontend code to point to the backend server (e.g., in `src/lib/apiClient.ts` or environment variables).
    *   Start the frontend development server: `npm run dev`
    *   Build for production: `npm run build`

**Important Notes:**

*   **Security:** Ensure that all API keys, secrets, and sensitive credentials in the `.env` file are kept secure and are not committed to version control. The provided API key for Proxmox is for testing purposes; replace it with a production key for a live environment.
*   **Payment Gateway Integration:** The current payment gateway integrations are simulated. For real-world payment processing, you will need to sign up for developer accounts with the respective payment providers (PayPal, Crypto.com, etc.), obtain API keys, and replace the mock logic with their SDKs/APIs.
*   **Error Handling & Logging:** The system includes basic error handling and logging. For production environments, consider implementing more robust logging and monitoring solutions.

This enhanced Proxmox PaaS provides a solid foundation for managing virtualized resources with added cost control and user management features. Further customization and feature additions can be built upon this core system.
