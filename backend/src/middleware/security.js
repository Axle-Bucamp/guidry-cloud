/**
 * Security middleware for Proxmox PaaS
 */
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const fs = require('fs');
const path = require('path');

/**
 * Configure security middleware
 * @param {Object} app - Express app
 */
const configureSecurityMiddleware = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Enable CORS
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
  });
  app.use('/api/', limiter);

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Configure TLS if certificates are provided
  if (process.env.NODE_ENV === 'production' && 
      process.env.TLS_CERT_PATH && 
      process.env.TLS_KEY_PATH &&
      fs.existsSync(process.env.TLS_CERT_PATH) && 
      fs.existsSync(process.env.TLS_KEY_PATH)) {
    
    const https = require('https');
    const options = {
      cert: fs.readFileSync(process.env.TLS_CERT_PATH),
      key: fs.readFileSync(process.env.TLS_KEY_PATH)
    };
    
    // Return HTTPS server
    return https.createServer(options, app);
  }

  // Return regular app if TLS is not configured
  return app;
};

module.exports = configureSecurityMiddleware;
