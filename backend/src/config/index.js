require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  db: {
    url: process.env.DATABASE_URL
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
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
    bucket: process.env.MINIO_BUCKET
  }
};

if (config.env === 'production' && (!config.jwt.secret || config.jwt.secret === 'changeme_at_least_32_chars_random_string')) {
  throw new Error('JWT_SECRET is missing or insecure in production');
}

module.exports = config;
