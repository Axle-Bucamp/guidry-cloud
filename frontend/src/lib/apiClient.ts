import axios from 'axios';

// Use the backend URL from environment variables or default
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add interceptors for handling auth tokens (e.g., from next-auth)
// apiClient.interceptors.request.use(async (config) => {
//   // const session = await getSession(); // Example using next-auth
//   // if (session?.accessToken) {
//   //   config.headers.Authorization = `Bearer ${session.accessToken}`;
//   // }
//   return config;
// });

export default apiClient;

