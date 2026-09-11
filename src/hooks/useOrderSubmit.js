import { useRef, useState } from "react";
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

function getCartItemId(item) {
  return item.productId || item.id;
}

export function useOrderSubmit({
  cartItems,
  form,
  customer,
  isAdmin,
  loadAdminData,
  loadCustomerOrders,
  clearCart,
  clearCartItems,
  setView,
}) {
  const [orderMessage, setOrderMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pendingSubmission = useRef(null);

  function submitOrder(itemsToSubmit = cartItems) {
    // A ref closes the gap before React renders the disabled submit button.
    if (pendingSubmission.current) return pendingSubmission.current;

    setIsSubmitting(true);
    const request = performSubmitOrder(itemsToSubmit);
    pendingSubmission.current = request;
    const finish = () => {
      pendingSubmission.current = null;
      setIsSubmitting(false);
    };
    request.then(finish, finish);
    return request;
  }

  async function performSubmitOrder(itemsToSubmit) {
    const selectedItems = Array.isArray(itemsToSubmit)
      ? itemsToSubmit.filter(Boolean)
      : cartItems;

    const hasName = Boolean(form.name || customer?.name);
    const hasContact = Boolean(
      form.phone || form.telegram || customer?.phone || customer?.telegram
    );

    if (!selectedItems.length || !hasName || !hasContact) {
      return {
        ok: false,
        message: "Додайте товари, імʼя та телефон або Telegram.",
        errors: {
          cart: !selectedItems.length ? "Оберіть сегмент кошика для замовлення" : "",
          name: !hasName ? "Вкажіть імʼя" : "",
          contact: !hasContact ? "Вкажіть телефон або Telegram" : "",
        },
      };
    }

    const items = selectedItems.map((item) => ({
      id: getCartItemId(item),
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

      if (clearCartItems) {
        clearCartItems(items.map((item) => item.id));
      } else {
        clearCart?.();
      }

      setView("success");

      // Optional history refreshes cannot turn a confirmed order into a failure
      // or delay confirmation when one of the history endpoints is unavailable.
      for (const refresh of [isAdmin && loadAdminData, customer && loadCustomerOrders]) {
        if (typeof refresh !== "function") continue;
        Promise.resolve().then(() => refresh()).catch(() => {
          console.warn("Замовлення створено, але не вдалося оновити історію.");
        });
      }

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
    isSubmitting,
    submitOrder,
  };
}
