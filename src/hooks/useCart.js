import { useEffect, useMemo, useState } from "react";

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

    // Новый формат: { "1": 2, "5": 1 }
    if (!Array.isArray(parsedCart)) {
      return parsedCart;
    }

    // Запасной вариант, если раньше корзина вдруг хранилась массивом
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

export function useCart(products = []) {
  const [cart, setCartState] = useState(readStoredCart);

  function setCart(nextCartOrUpdater) {
    setCartState((currentCart) => {
      const nextCart =
        typeof nextCartOrUpdater === "function"
          ? nextCartOrUpdater(currentCart)
          : nextCartOrUpdater;

      return nextCart && typeof nextCart === "object" ? nextCart : {};
    });
  }

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

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

  const cartCount = useMemo(() => {
    return Object.values(cart).reduce((sum, quantity) => {
      return sum + Number(quantity || 0);
    }, 0);
  }, [cart]);

  function addToCart(product) {
    if (!product?.id) return;

    setCart((currentCart) => {
      const productId = String(product.id);
      const currentQuantity = Number(currentCart[productId] || 0);

      return {
        ...currentCart,
        [productId]: currentQuantity + 1,
      };
    });
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

  return {
    cart,
    setCart,
    cartItems,
    total,
    cartCount,
    addToCart,
    changeQuantity,
    removeFromCart,
  };
}