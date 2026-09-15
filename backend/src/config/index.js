require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  db: {
    url: process.env.DATABASE_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'sitetrack_jwt_production_secret_key_2026_super_secure_enterprise_erp_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID
  },
  s3: {
    endpoint: process.env.MINIO_ENDPOINT,
    publicEndpoint: process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT,
    bucket: process.env.MINIO_BUCKET
  },
  // Comma-separated list of allowed origins for CORS (e.g. https://akconstruction.ae)
  corsOrigin: process.env.CORS_ORIGIN || '',
};

if (config.env === 'production') {
  if (!process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET not set in environment variables. Using default key. Add JWT_SECRET in Railway for custom security.');
  }
  if (!config.corsOrigin) {
    console.warn('[WARN] CORS_ORIGIN is not set — same-origin requests enabled.');
  }
}

module.exports = config;
