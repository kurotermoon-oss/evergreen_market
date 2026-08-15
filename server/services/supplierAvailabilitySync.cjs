const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");
const milkDillerAdapter = require("../integrations/suppliers/milkDillerAdapter.cjs");
const {
  notifySupplierSyncIssue,
} = require("./supplierSyncNotifications.cjs");

const ALLOWED_ADAPTERS = new Set([milkDillerAdapter.ADAPTER_ID]);
const ALLOWED_OVERRIDES = new Set(["auto", "available", "unavailable"]);
const DEFAULT_MASS_CHANGE_RATIO = 0.3;
const LOCK_MINUTES = 20;
const RUN_DETAILS_LIMIT = 250;

function createHttpError(message, status = 400, code = "SUPPLIER_SYNC_ERROR") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function cleanString(value) {
  return String(value || "").trim();
}

function toIso(value) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapSupplierSyncSettings(supplier) {
  return {
    id: supplier.id,
    name: supplier.name || "",
    adapter: supplier.availabilitySyncAdapter || "",
    enabled: supplier.availabilitySyncEnabled === true,
    paused: supplier.availabilitySyncPaused === true,
    lastRunAt: toIso(supplier.availabilitySyncLastRunAt),
    lastOkAt: toIso(supplier.availabilitySyncLastOkAt),
    lastStatus: supplier.availabilitySyncLastStatus || "idle",
    lastError: supplier.availabilitySyncLastError || "",
    lockedUntil: toIso(supplier.availabilitySyncLockUntil),
  };
}

function mapSyncProduct(product) {
  return {
    id: product.id,
    name: product.name || "",
    brand: product.brand || "",
    stockStatus: product.stockStatus || "preorder",
    active: product.active !== false,
    supplierId: product.supplierId || "",
    fulfillmentType: product.fulfillmentType || "in_stock",
    productUrl: product.supplierProductUrl || "",
    externalId: product.supplierExternalId || "",
    syncEnabled: product.supplierSyncEnabled === true,
    remoteStatus: product.supplierRemoteStatus || "unknown",
    statusOverride: product.supplierStatusOverride || "auto",
    lastCheckedAt: toIso(product.supplierLastCheckedAt),
    lastError: product.supplierLastError || "",
    statusChangedAt: toIso(product.supplierStatusChangedAt),
  };
}

function mapSyncRun(run) {
  return {
    id: run.id,
    supplierId: run.supplierId,
    trigger: run.trigger,
    status: run.status,
    dryRun: run.dryRun,
    startedAt: toIso(run.startedAt),
    completedAt: toIso(run.completedAt),
    mappedCount: Number(run.mappedCount || 0),
    checkedCount: Number(run.checkedCount || 0),
    availableCount: Number(run.availableCount || 0),
    unavailableCount: Number(run.unavailableCount || 0),
    changedCount: Number(run.changedCount || 0),
    errorCount: Number(run.errorCount || 0),
    changeRatio: Number(run.changeRatio || 0),
    message: run.message || "",
    details: run.details || null,
  };
}

async function getSupplierSyncDashboard(supplierId) {
  const id = cleanString(supplierId);
  const supplier = await prisma.supplier.findUnique({
    where: {
      id,
    },
  });

  if (!supplier) {
    throw createHttpError("Постачальника не знайдено.", 404, "SUPPLIER_NOT_FOUND");
  }

  const [products, runs] = await Promise.all([
    prisma.product.findMany({
      where: {
        supplierId: id,
        fulfillmentType: "supplier_order",
      },
      orderBy: [
        {
          supplierLastError: "desc",
        },
        {
          name: "asc",
        },
      ],
    }),
    prisma.supplierSyncRun.findMany({
      where: {
        supplierId: id,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: 30,
    }),
  ]);

  const mappedProducts = products.filter((product) => {
    return product.supplierSyncEnabled && product.supplierProductUrl;
  });

  return {
    supported: true,
    supplier: mapSupplierSyncSettings(supplier),
    stats: {
      products: products.length,
      mapped: mappedProducts.length,
      available: mappedProducts.filter((product) => {
        return product.stockStatus !== "out_of_stock";
      }).length,
      unavailable: mappedProducts.filter((product) => {
        return product.stockStatus === "out_of_stock";
      }).length,
      errors: mappedProducts.filter((product) => product.supplierLastError).length,
      unmapped: products.filter((product) => !product.supplierProductUrl).length,
    },
    products: products.map(mapSyncProduct),
    runs: runs.map(mapSyncRun),
  };
}

async function updateSupplierSyncSettings(supplierId, payload = {}) {
  const id = cleanString(supplierId);
  const existing = await prisma.supplier.findUnique({
    where: {
      id,
    },
  });

  if (!existing) {
    throw createHttpError("Постачальника не знайдено.", 404, "SUPPLIER_NOT_FOUND");
  }

  const adapter = cleanString(payload.adapter ?? existing.availabilitySyncAdapter);

  if (adapter && !ALLOWED_ADAPTERS.has(adapter)) {
    throw createHttpError("Непідтримуваний адаптер синхронізації.");
  }

  const supplier = await prisma.supplier.update({
    where: {
      id,
    },
    data: {
      availabilitySyncAdapter: adapter,
      availabilitySyncEnabled:
        payload.enabled === undefined
          ? existing.availabilitySyncEnabled
          : payload.enabled === true,
      availabilitySyncPaused:
        payload.paused === undefined
          ? existing.availabilitySyncPaused
          : payload.paused === true,
    },
  });

  return mapSupplierSyncSettings(supplier);
}

async function updateProductSyncMapping(supplierId, productId, payload = {}) {
  const id = cleanString(supplierId);
  const product = await prisma.product.findFirst({
    where: {
      id: cleanString(productId),
      supplierId: id,
      fulfillmentType: "supplier_order",
    },
  });

  if (!product) {
    throw createHttpError(
      "Товар цього постачальника не знайдено.",
      404,
      "SYNC_PRODUCT_NOT_FOUND"
    );
  }

  const productUrl = milkDillerAdapter.normalizeProductUrl(
    payload.productUrl ?? product.supplierProductUrl
  );
  const statusOverride = cleanString(
    payload.statusOverride ?? product.supplierStatusOverride ?? "auto"
  );

  if ((payload.productUrl ?? product.supplierProductUrl) && !productUrl) {
    throw createHttpError("Вкажіть коректне посилання на товар Milk Diller.");
  }

  if (!ALLOWED_OVERRIDES.has(statusOverride)) {
    throw createHttpError("Непідтримуваний ручний статус товару.");
  }

  let stockStatus = product.stockStatus;

  if (statusOverride === "available") stockStatus = "preorder";
  if (statusOverride === "unavailable") stockStatus = "out_of_stock";
  if (statusOverride === "auto" && product.supplierRemoteStatus === "available") {
    stockStatus = "preorder";
  }
  if (statusOverride === "auto" && product.supplierRemoteStatus === "unavailable") {
    stockStatus = "out_of_stock";
  }

  const updated = await prisma.product.update({
    where: {
      id: product.id,
    },
    data: {
      supplierProductUrl: productUrl,
      supplierExternalId: cleanString(
        payload.externalId ?? product.supplierExternalId
      ),
      supplierSyncEnabled:
        payload.syncEnabled === undefined
          ? product.supplierSyncEnabled
          : payload.syncEnabled === true,
      supplierStatusOverride: statusOverride,
      stockStatus,
    },
  });

  return mapSyncProduct(updated);
}

async function acquireSupplierLock(supplierId) {
  const now = new Date();
  const lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60_000);
  const result = await prisma.supplier.updateMany({
    where: {
      id: supplierId,
      OR: [
        {
          availabilitySyncLockUntil: null,
        },
        {
          availabilitySyncLockUntil: {
            lt: now,
          },
        },
      ],
    },
    data: {
      availabilitySyncLockUntil: lockUntil,
    },
  });

  if (result.count === 0) {
    throw createHttpError(
      "Синхронізація цього постачальника вже виконується.",
      409,
      "SUPPLIER_SYNC_RUNNING"
    );
  }
}

function getEffectiveStockStatus(product, remoteStatus) {
  if (product.supplierStatusOverride === "available") return "preorder";
  if (product.supplierStatusOverride === "unavailable") return "out_of_stock";
  if (remoteStatus === "available") return "preorder";
  if (remoteStatus === "unavailable") return "out_of_stock";

  return product.stockStatus;
}

function getMassChangeThreshold() {
  const configured = Number(process.env.SUPPLIER_SYNC_MASS_CHANGE_RATIO);

  if (Number.isFinite(configured) && configured > 0 && configured <= 1) {
    return configured;
  }

  return DEFAULT_MASS_CHANGE_RATIO;
}

async function resolveMappedProducts(products, catalogResult, options = {}) {
  const resolved = [];
  const missing = [];

  products.forEach((product) => {
    const normalizedUrl = milkDillerAdapter.normalizeProductUrl(
      product.supplierProductUrl
    );
    const catalogProduct = catalogResult.products.get(normalizedUrl);

    if (catalogProduct?.status && catalogProduct.status !== "unknown") {
      resolved.push({
        product,
        remote: catalogProduct,
        error: "",
      });
    } else {
      missing.push({
        product,
        normalizedUrl,
      });
    }
  });

  const fallbackResults = await milkDillerAdapter.mapWithConcurrency(
    missing,
    2,
    async ({ product, normalizedUrl }) => {
      try {
        const remote = await milkDillerAdapter.fetchProductAvailability(
          normalizedUrl,
          options
        );

        if (remote.status === "unknown") {
          return {
            product,
            remote,
            error: "Не вдалося розпізнати статус у картці товару.",
          };
        }

        return {
          product,
          remote,
          error: "",
        };
      } catch (error) {
        return {
          product,
          remote: null,
          error: error.message || "Не вдалося перевірити картку товару.",
        };
      }
    }
  );

  return [...resolved, ...fallbackResults];
}

async function runSupplierSync(
  supplierId,
  { trigger = "manual", dryRun = false, force = false, fetchImpl } = {}
) {
  const id = cleanString(supplierId);
  const supplier = await prisma.supplier.findUnique({
    where: {
      id,
    },
  });

  if (!supplier) {
    throw createHttpError("Постачальника не знайдено.", 404, "SUPPLIER_NOT_FOUND");
  }

  if (!ALLOWED_ADAPTERS.has(supplier.availabilitySyncAdapter)) {
    throw createHttpError(
      "Спочатку підключіть адаптер Milk Diller.",
      409,
      "SUPPLIER_SYNC_NOT_CONFIGURED"
    );
  }

  if (trigger === "cron" && !supplier.availabilitySyncEnabled) {
    throw createHttpError(
      "Автоматичну синхронізацію вимкнено.",
      409,
      "SUPPLIER_SYNC_DISABLED"
    );
  }

  if (supplier.availabilitySyncPaused && !dryRun) {
    throw createHttpError(
      "Синхронізацію призупинено. Доступний лише тестовий запуск.",
      409,
      "SUPPLIER_SYNC_PAUSED"
    );
  }

  await acquireSupplierLock(id);

  const runId = `supplier_sync_${crypto.randomUUID()}`;
  let run;

  try {
    run = await prisma.supplierSyncRun.create({
      data: {
        id: runId,
        supplierId: id,
        trigger: cleanString(trigger) || "manual",
        dryRun: dryRun === true,
      },
    });
  } catch (error) {
    await prisma.supplier
      .update({
        where: {
          id,
        },
        data: {
          availabilitySyncLockUntil: null,
        },
      })
      .catch(() => undefined);

    throw error;
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        supplierId: id,
        fulfillmentType: "supplier_order",
        supplierSyncEnabled: true,
        NOT: {
          supplierProductUrl: "",
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    if (products.length === 0) {
      const completedAt = new Date();
      const completed = await prisma.$transaction(async (tx) => {
        const updatedRun = await tx.supplierSyncRun.update({
          where: {
            id: run.id,
          },
          data: {
            status: dryRun ? "dry_run" : "completed",
            completedAt,
            message: "Немає привʼязаних товарів для перевірки.",
          },
        });

        await tx.supplier.update({
          where: {
            id,
          },
          data: {
            availabilitySyncLastRunAt: completedAt,
            availabilitySyncLastOkAt: completedAt,
            availabilitySyncLastStatus: updatedRun.status,
            availabilitySyncLastError: "",
            availabilitySyncLockUntil: null,
          },
        });

        return updatedRun;
      });

      return mapSyncRun(completed);
    }

    const catalogResult = await milkDillerAdapter.crawlCatalog({ fetchImpl });
    const resolved = await resolveMappedProducts(products, catalogResult, {
      fetchImpl,
    });
    const now = new Date();
    const results = resolved.map(({ product, remote, error }) => {
      const remoteStatus = remote?.status || "unknown";
      const nextStockStatus = getEffectiveStockStatus(product, remoteStatus);

      return {
        product,
        remote,
        remoteStatus,
        nextStockStatus,
        changed: !error && nextStockStatus !== product.stockStatus,
        error,
      };
    });
    const checkedCount = results.filter((result) => !result.error).length;
    const changedCount = results.filter((result) => result.changed).length;
    const errorCount = results.filter((result) => result.error).length;
    const availableCount = results.filter((result) => {
      return !result.error && result.remoteStatus === "available";
    }).length;
    const unavailableCount = results.filter((result) => {
      return !result.error && result.remoteStatus === "unavailable";
    }).length;
    const changeRatio = products.length > 0 ? changedCount / products.length : 0;
    const massChangeBlocked =
      !force &&
      products.length >= 10 &&
      changedCount >= 5 &&
      changeRatio > getMassChangeThreshold();
    const finalStatus = massChangeBlocked
      ? "blocked"
      : dryRun
        ? "dry_run"
        : "completed";
    const message = massChangeBlocked
      ? `Зміни призупинено: статус змінився у ${changedCount} з ${products.length} товарів.`
      : dryRun
        ? "Тестову перевірку завершено без запису змін."
        : "Синхронізацію наявності завершено.";
    const details = {
      catalogPages: catalogResult.pageCount,
      catalogAdvertisedProducts: catalogResult.totalCount,
      changes: results
        .filter((result) => result.changed)
        .slice(0, RUN_DETAILS_LIMIT)
        .map((result) => ({
          productId: result.product.id,
          name: result.product.name,
          from: result.product.stockStatus,
          to: result.nextStockStatus,
          remoteStatus: result.remoteStatus,
          productUrl: result.product.supplierProductUrl,
        })),
      errors: results
        .filter((result) => result.error)
        .slice(0, RUN_DETAILS_LIMIT)
        .map((result) => ({
          productId: result.product.id,
          name: result.product.name,
          message: result.error,
          productUrl: result.product.supplierProductUrl,
        })),
    };

    const operations = [];

    if (!dryRun && !massChangeBlocked) {
      results.forEach((result) => {
        if (result.error) {
          operations.push(
            prisma.product.update({
              where: {
                id: result.product.id,
              },
              data: {
                supplierLastCheckedAt: now,
                supplierLastError: result.error,
              },
            })
          );
          return;
        }

        operations.push(
          prisma.product.update({
            where: {
              id: result.product.id,
            },
            data: {
              stockStatus: result.nextStockStatus,
              supplierRemoteStatus: result.remoteStatus,
              supplierExternalId:
                result.product.supplierExternalId || result.remote?.externalId || "",
              supplierLastCheckedAt: now,
              supplierLastError: "",
              supplierStatusChangedAt:
                result.remoteStatus !== result.product.supplierRemoteStatus
                  ? now
                  : result.product.supplierStatusChangedAt,
            },
          })
        );
      });
    }

    if (operations.length > 0) {
      await prisma.$transaction(operations);
    }

    const completedAt = new Date();
    const completed = await prisma.$transaction(async (tx) => {
      const updatedRun = await tx.supplierSyncRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: finalStatus,
          completedAt,
          mappedCount: products.length,
          checkedCount,
          availableCount,
          unavailableCount,
          changedCount,
          errorCount,
          changeRatio,
          message,
          details,
        },
      });

      await tx.supplier.update({
        where: {
          id,
        },
        data: {
          availabilitySyncLastRunAt: completedAt,
          availabilitySyncLastOkAt: massChangeBlocked ? undefined : completedAt,
          availabilitySyncLastStatus: finalStatus,
          availabilitySyncLastError: massChangeBlocked ? message : "",
          availabilitySyncLockUntil: null,
        },
      });

      return updatedRun;
    });

    if (massChangeBlocked) {
      await notifySupplierSyncIssue(
        `Evergreen Market: синхронізацію ${supplier.name} призупинено. ${message}`
      );
    }

    return mapSyncRun(completed);
  } catch (error) {
    const completedAt = new Date();
    const message = cleanString(error.message) || "Невідома помилка синхронізації.";

    await prisma.$transaction([
      prisma.supplierSyncRun.update({
        where: {
          id: run.id,
        },
        data: {
          status: "failed",
          completedAt,
          message,
          errorCount: 1,
        },
      }),
      prisma.supplier.update({
        where: {
          id,
        },
        data: {
          availabilitySyncLastRunAt: completedAt,
          availabilitySyncLastStatus: "failed",
          availabilitySyncLastError: message,
          availabilitySyncLockUntil: null,
        },
      }),
    ]);

    await notifySupplierSyncIssue(
      `Evergreen Market: помилка синхронізації ${supplier.name}. ${message}`
    );

    throw error;
  }
}

async function runEnabledSupplierSyncs({ fetchImpl } = {}) {
  const suppliers = await prisma.supplier.findMany({
    where: {
      availabilitySyncAdapter: milkDillerAdapter.ADAPTER_ID,
      availabilitySyncEnabled: true,
      availabilitySyncPaused: false,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  const results = [];

  for (const supplier of suppliers) {
    try {
      results.push(
        await runSupplierSync(supplier.id, {
          trigger: "cron",
          fetchImpl,
        })
      );
    } catch (error) {
      results.push({
        supplierId: supplier.id,
        status: "failed",
        message: error.message,
      });
    }
  }

  return results;
}

module.exports = {
  getSupplierSyncDashboard,
  updateSupplierSyncSettings,
  updateProductSyncMapping,
  runSupplierSync,
  runEnabledSupplierSyncs,
  mapSyncRun,
};
