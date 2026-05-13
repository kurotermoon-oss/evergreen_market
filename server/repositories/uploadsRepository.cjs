const crypto = require("crypto");
const path = require("path");

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const sharp = require("sharp");

const { createS3Client, getS3Config } = require("../storage/s3Client.cjs");

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_IMAGE_SIZE = 6 * 1024 * 1024;

let s3Client = null;

function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client();
  }

  return s3Client;
}

function createHttpError(message, status = 500, code = "") {
  const error = new Error(message);

  error.status = status;
  error.code = code;

  return error;
}

function createProductImageKey() {
  const id = crypto.randomUUID();

  return `products/product_${id}.webp`;
}

function normalizeUploadKey(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .trim();
}

function normalizeMetadataValue(value) {
  return String(value || "")
    .replace(/[^\x20-\x7E]/g, "")
    .slice(0, 120);
}

function assertImageFile(file) {
  if (!file) {
    throw createHttpError("Файл зображення обовʼязковий.", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw createHttpError(
      "Непідтримуваний формат. Дозволені JPG, PNG, WEBP або AVIF.",
      400
    );
  }

  if (!file.buffer?.length) {
    throw createHttpError("Файл порожній.", 400);
  }

  if (file.size > MAX_IMAGE_SIZE || file.buffer.length > MAX_IMAGE_SIZE) {
    throw createHttpError("Файл завеликий. Максимальний розмір — 6 МБ.", 400);
  }
}

async function prepareProductImage(buffer) {
  return sharp(buffer, {
    failOn: "none",
  })
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "cover",
      position: "center",
      withoutEnlargement: false,
    })
    .webp({
      quality: 84,
      effort: 5,
    })
    .toBuffer();
}

async function uploadProductImage(file) {
  assertImageFile(file);

  const config = getS3Config();
  const s3 = getS3Client();

  const key = createProductImageKey();
  const body = await prepareProductImage(file.buffer);

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
      Metadata: {
        originalName: normalizeMetadataValue(
          path.basename(file.originalname || "product-image")
        ),
      },
    })
  );

  return {
    key,
    imageUrl: `/uploads/${key}`,
  };
}

async function getUploadedObject(key) {
  const cleanKey = normalizeUploadKey(key);

  if (!cleanKey) {
    throw createHttpError("Image key is required.", 400);
  }

  const config = getS3Config();
  const s3 = getS3Client();

  return s3.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    })
  );
}

async function deleteUploadedObject(key) {
  const cleanKey = normalizeUploadKey(key);

  if (!cleanKey) return;

  const config = getS3Config();
  const s3 = getS3Client();

  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    })
  );
}

module.exports = {
  uploadProductImage,
  getUploadedObject,
  deleteUploadedObject,
};