const { S3Client } = require("@aws-sdk/client-s3");

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getS3Config() {
  return {
    endpoint: getRequiredEnv("S3_ENDPOINT_URL"),
    bucket: getRequiredEnv("S3_BUCKET_NAME"),
    region: process.env.S3_REGION || "auto",
    accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY"),
  };
}

function createS3Client() {
  const config = getS3Config();

  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

module.exports = {
  getS3Config,
  createS3Client,
};