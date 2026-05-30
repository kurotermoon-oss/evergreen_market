import { useEffect, useMemo, useState } from "react";
import {
  buildCartOrderGroups,
  buildCartSupplierSummary,
  validateAddToCart,
} from "../utils/cartSupplierRules.js";

const CART_STORAGE_KEY = "evergreen_cart";

function readStoredCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!rawCart) {
      return {};
    }

    const parsedCart = JSON.parse(rawCart);

    if (!parsedCart || typeof parsedCart !== "object") {
      return {};
    }

    if (!Array.isArray(parsedCart)) {
      return parsedCart;
    }

    return parsedCart.reduce((result, item) => {
      const productId = item.id ?? item.productId;
      const quantity = Number(item.quantity || 0);

      if (productId && quantity > 0) {
        result[String(productId)] = quantity;
      }

      return result;
    }, {});
  } catch (error) {
    console.error("Failed to read cart from localStorage:", error);
    return {};
  }
}

function saveStoredCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save cart to localStorage:", error);
  }
}

function normalizeCart(cart) {
  return Object.entries(cart || {}).reduce((result, [productId, quantity]) => {
    const normalizedQuantity = Number(quantity || 0);

    if (productId && normalizedQuantity > 0) {
      result[String(productId)] = normalizedQuantity;
    }

    return result;
  }, {});
}

export function useCart(products = []) {
  const [cart, setCartState] = useState(() => normalizeCart(readStoredCart()));
  const [cartNotice, setCartNotice] = useState("");

  function setCart(nextCartOrUpdater) {
    setCartState((currentCart) => {
      const nextCart =
        typeof nextCartOrUpdater === "function"
          ? nextCartOrUpdater(currentCart)
          : nextCartOrUpdater;

      return normalizeCart(nextCart);
    });
  }

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  useEffect(() => {
    if (!cartNotice) return undefined;

    const timeoutId = window.setTimeout(() => {
      setCartNotice("");
    }, 7000);

    return () => window.clearTimeout(timeoutId);
  }, [cartNotice]);

  // Чистим корзину от товаров, которых уже нет в каталоге
  useEffect(() => {
    if (!products.length) return;

    setCartState((currentCart) => {
      const existingProductIds = new Set(
        products.map((product) => String(product.id))
      );

      const cleanedCart = Object.entries(currentCart).reduce(
        (result, [productId, quantity]) => {
          if (existingProductIds.has(String(productId))) {
            result[String(productId)] = Number(quantity || 0);
          }

          return result;
        },
        {}
      );

      const currentKeys = Object.keys(currentCart);
      const cleanedKeys = Object.keys(cleanedCart);

      const isSame =
        currentKeys.length === cleanedKeys.length &&
        currentKeys.every((key) => cleanedCart[key] === currentCart[key]);

      return isSame ? currentCart : cleanedCart;
    });
  }, [products]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find(
          (item) => String(item.id) === String(productId)
        );

        if (!product) {
          return null;
        }

        const normalizedQuantity = Math.max(1, Number(quantity) || 1);
        const price = Number(product.price || 0);

        return {
          ...product,
          id: product.id,
          productId: product.id,
          quantity: normalizedQuantity,
          total: price * normalizedQuantity,
        };
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.quantity || 0);
    }, 0);
  }, [cartItems]);

  // Важно: считаем badge только по реально существующим товарам
  const cartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + Number(item.quantity || 0);
    }, 0);
  }, [cartItems]);

  const supplierOrderSummary = useMemo(() => {
    return buildCartSupplierSummary(cartItems);
  }, [cartItems]);

  const cartOrderGroups = useMemo(() => {
    return buildCartOrderGroups(cartItems);
  }, [cartItems]);

  function addToCart(product) {
    if (!product?.id) return;

    const addValidation = validateAddToCart(product, cartItems);

    if (!addValidation.ok) {
      setCartNotice(addValidation.message);
      return false;
    }

    setCart((currentCart) => {
      const productId = String(product.id);
      const currentQuantity = Number(currentCart[productId] || 0);

      return {
        ...currentCart,
        [productId]: currentQuantity + 1,
      };
    });

    setCartNotice("");
    return true;
  }

  function changeQuantity(productId, quantity) {
    const normalizedProductId = String(productId);
    const nextQuantity = Number(quantity || 0);

    setCart((currentCart) => {
      const nextCart = { ...currentCart };

      if (nextQuantity <= 0) {
        delete nextCart[normalizedProductId];
        return nextCart;
      }

      nextCart[normalizedProductId] = nextQuantity;
      return nextCart;
    });
  }

  function removeFromCart(productId) {
    const normalizedProductId = String(productId);

    setCart((currentCart) => {
      const nextCart = { ...currentCart };
      delete nextCart[normalizedProductId];
      return nextCart;
    });
  }

  function clearCart() {
    setCart({});
  }

  function clearCartItems(productIds = []) {
    const idsToRemove = new Set(
      productIds.map((productId) => String(productId)).filter(Boolean)
    );

    if (!idsToRemove.size) return;

    setCart((currentCart) => {
      const nextCart = { ...currentCart };

      idsToRemove.forEach((productId) => {
        delete nextCart[productId];
      });

      return nextCart;
    });
  }

  return {
    cart,
    setCart,
    cartItems,
    cartOrderGroups,
    total,
    cartCount,
    supplierOrderSummary,
    cartNotice,
    clearCartNotice: () => setCartNotice(""),
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
    clearCartItems,
  };
}
