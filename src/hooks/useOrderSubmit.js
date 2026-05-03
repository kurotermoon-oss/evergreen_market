import { useState } from "react";
import { api } from "../api/client.js";

export function useOrderSubmit({
  cartItems,
  form,
  customer,
  isAdmin,
  loadAdminData,
  loadCustomerOrders,
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
      return;
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

      setOrderMessage(result.telegramMessage || "");
      setCreatedOrder(result.order || null);
      setView("success");

      if (isAdmin) {
        await loadAdminData?.();
      }

      if (customer) {
        await loadCustomerOrders?.();
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert("Не вдалося створити замовлення. Перевір backend.");
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