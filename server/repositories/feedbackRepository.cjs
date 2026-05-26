const prisma = require("../database/prisma.cjs");

const FEEDBACK_TYPES = new Set(["complaint", "wish", "bug", "other"]);
const FEEDBACK_STATUSES = new Set(["new", "reviewed", "resolved", "archived"]);

function toCleanString(value) {
  return String(value || "").trim();
}

function toIsoOrEmpty(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString();
}

function normalizeSingleLine(value, maxLength = 120) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeMessage(value, maxLength = 2000) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeType(value) {
  const type = toCleanString(value);

  return FEEDBACK_TYPES.has(type) ? type : "other";
}

function normalizeStatus(value) {
  const status = toCleanString(value);

  return FEEDBACK_STATUSES.has(status) ? status : "";
}

function validateFeedbackPayload(payload = {}) {
  const message = normalizeMessage(payload.message);
  const subject = normalizeSingleLine(payload.subject);
  const type = normalizeType(payload.type);
  const errors = {};

  if (message.length < 8) {
    errors.message = "Опишіть звернення трохи детальніше.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      type,
      subject,
      message,
    },
  };
}

function mapFeedback(feedback) {
  if (!feedback) return null;

  const customer = feedback.customer || null;

  return {
    id: feedback.id,
    customerId: feedback.customerId || null,

    customerName: feedback.customerName || customer?.name || "",
    customerPhone: feedback.customerPhone || customer?.phone || "",
    customerTelegram: feedback.customerTelegram || customer?.telegram || "",

    type: feedback.type || "other",
    subject: feedback.subject || "",
    message: feedback.message || "",
    status: feedback.status || "new",

    createdAt: toIsoOrEmpty(feedback.createdAt),
    updatedAt: toIsoOrEmpty(feedback.updatedAt),

    customer: customer
      ? {
          id: customer.id,
          name: customer.name || "",
          phone: customer.phone || "",
          telegram: customer.telegram || "",
        }
      : null,
  };
}

async function createCustomerFeedback(customer, payload = {}) {
  const customerId = Number(customer?.id);

  if (!Number.isFinite(customerId)) {
    const error = new Error("Увійдіть в акаунт, щоб залишити звернення.");
    error.status = 401;
    throw error;
  }

  const validation = validateFeedbackPayload(payload);

  if (!validation.ok) {
    const error = new Error("Перевірте звернення.");
    error.status = 400;
    error.errors = validation.errors;
    throw error;
  }

  const feedback = await prisma.customerFeedback.create({
    data: {
      customerId,
      customerName: toCleanString(customer.name),
      customerPhone: toCleanString(customer.phone),
      customerTelegram: toCleanString(customer.telegram),
      ...validation.data,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          telegram: true,
        },
      },
    },
  });

  return mapFeedback(feedback);
}

async function getAdminFeedback({ status = "", type = "" } = {}) {
  const cleanStatus = normalizeStatus(status);
  const cleanType = FEEDBACK_TYPES.has(toCleanString(type))
    ? toCleanString(type)
    : "";

  const where = {};

  if (cleanStatus) {
    where.status = cleanStatus;
  }

  if (cleanType) {
    where.type = cleanType;
  }

  const feedback = await prisma.customerFeedback.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          telegram: true,
        },
      },
    },
  });

  return feedback.map(mapFeedback);
}

async function updateFeedbackStatus(id, status) {
  const feedbackId = Number(id);
  const nextStatus = normalizeStatus(status);

  if (!Number.isFinite(feedbackId)) {
    const error = new Error("Звернення не знайдено.");
    error.status = 404;
    throw error;
  }

  if (!nextStatus) {
    const error = new Error("Невідомий статус звернення.");
    error.status = 400;
    throw error;
  }

  try {
    const feedback = await prisma.customerFeedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        status: nextStatus,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            telegram: true,
          },
        },
      },
    });

    return mapFeedback(feedback);
  } catch (error) {
    if (error?.code === "P2025") {
      const notFoundError = new Error("Звернення не знайдено.");
      notFoundError.status = 404;
      throw notFoundError;
    }

    throw error;
  }
}

module.exports = {
  FEEDBACK_TYPES,
  FEEDBACK_STATUSES,
  validateFeedbackPayload,
  createCustomerFeedback,
  getAdminFeedback,
  updateFeedbackStatus,
};
