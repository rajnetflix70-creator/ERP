const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config/index');

let s3Client;
if (config.s3.endpoint) {
  s3Client = new S3Client({
    endpoint: config.s3.endpoint,
    forcePathStyle: true,
    region: 'us-east-1', // Required by SDK even for MinIO
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER || 'minioadmin',
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD || 'changeme_minio_password'
    }
  });
}

async function getPresignUrl(key, contentType) {
  if (!s3Client) throw new Error('S3 not configured');
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    ContentType: contentType
  });
  return getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins
}

function getObjectUrl(key) {
  if (!config.s3.endpoint) return null;
  return `${config.s3.endpoint}/${config.s3.bucket}/${key}`;
}

module.exports = {
  getPresignUrl,
  getObjectUrl
};
