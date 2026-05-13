import { useState } from "react";
import { api } from "../api/client.js";
import { saveRecentOrder } from "../utils/recentOrders.js";

function extractBackendErrors(error) {
  return (
    error?.response?.data?.errors ||
    error?.data?.errors ||
    error?.errors ||
    {}
  );
}

function extractBackendMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    "Не вдалося створити замовлення."
  );
}

export function useOrderSubmit({
  cartItems,
  form,
  customer,
  isAdmin,
  loadAdminData,
  loadCustomerOrders,
  clearCart,
  setView,
}) {
  const [orderMessage, setOrderMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);

  async function submitOrder() {
    const hasName = Boolean(form.name || customer?.name);
    const hasContact = Boolean(
      form.phone || form.telegram || customer?.phone || customer?.telegram
    );

    if (!cartItems.length || !hasName || !hasContact) {
      return {
        ok: false,
        message: "Додайте товари, імʼя та телефон або Telegram.",
        errors: {
          cart: !cartItems.length ? "Кошик порожній" : "",
          name: !hasName ? "Вкажіть імʼя" : "",
          contact: !hasContact ? "Вкажіть телефон або Telegram" : "",
        },
      };
    }

    const items = cartItems.map((item) => ({
      id: item.productId || item.id,
      quantity: Number(item.quantity || 1),
    }));

    try {
      const result = await api.createOrder({
        items,
        form,
      });

      const order = result.order || null;

      setOrderMessage(result.telegramMessage || "");
      setCreatedOrder(order);

      saveRecentOrder(order, {
        form,
        customer,
      });

      clearCart?.();

      if (isAdmin) {
        await loadAdminData?.();
      }

      if (customer) {
        await loadCustomerOrders?.();
      }

      setView("success");

      return {
        ok: true,
        order,
      };
    } catch (error) {
      console.error("Create order error:", error);

      return {
        ok: false,
        message: extractBackendMessage(error),
        errors: extractBackendErrors(error),
      };
    }
  }

  return {
    orderMessage,
    setOrderMessage,
    createdOrder,
    setCreatedOrder,
    submitOrder,
  };
}