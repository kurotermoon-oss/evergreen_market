import { useMemo, useState } from "react";

export function useCart(products) {
  const [cart, setCart] = useState([]);

  const cartItems = useMemo(() => {
    return cart
      .map((cartItem) => {
        const product = products.find((item) => item.id === cartItem.id);

        return product
          ? {
              ...product,
              quantity: cartItem.quantity,
            }
          : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const total = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cart]);

  function addToCart(product) {
    if (!product || product.stockStatus === "out_of_stock") return;

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          quantity: 1,
        },
      ];
    });
  }

  function changeQuantity(id, delta) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + delta,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
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
    clearCart,
  };
}