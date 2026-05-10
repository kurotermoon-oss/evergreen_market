import { useState } from "react";
import { api } from "../api/client.js";

export function useCustomerSession({ applyCustomerToForm } = {}) {
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);

  async function checkCustomerSession() {
    try {
      const customerStatus = await api.customerMe();

      if (customerStatus.authenticated && customerStatus.customer) {
        setCustomer(customerStatus.customer);
        applyCustomerToForm?.(customerStatus.customer);

        return customerStatus.customer;
      }

      setCustomer(null);
      setCustomerOrders([]);

      return null;
    } catch (error) {
      console.warn("Customer session check failed:", error);

      setCustomer(null);
      setCustomerOrders([]);

      return null;
    }
  }

  async function loadCustomerOrders() {
    try {
      const response = await api.getCustomerOrders();

      setCustomerOrders(response.orders || []);

      return response.orders || [];
    } catch (error) {
      console.warn("Load customer orders failed:", error);

      setCustomerOrders([]);

      return [];
    }
  }

  async function customerLogin(payload) {
    const response = await api.customerLogin(payload);

    setCustomer(response.customer);
    applyCustomerToForm?.(response.customer);

    const ordersResponse = await api.getCustomerOrders();
    setCustomerOrders(ordersResponse.orders || []);

    return response.customer;
  }

  async function customerRegister(payload) {
    const response = await api.customerRegister(payload);

    setCustomer(response.customer);
    applyCustomerToForm?.(response.customer);

    const ordersResponse = await api.getCustomerOrders();
    setCustomerOrders(ordersResponse.orders || []);

    return response.customer;
  }

  async function updateCustomerProfile(payload) {
    const response = await api.updateCustomerProfile(payload);

    setCustomer(response.customer);
    applyCustomerToForm?.(response.customer);

    return response.customer;
  }

  async function customerLogout() {
    await api.customerLogout();

    setCustomer(null);
    setCustomerOrders([]);
  }

  return {
    customer,
    customerOrders,
    setCustomer,
    setCustomerOrders,

    checkCustomerSession,
    loadCustomerOrders,

    customerLogin,
    customerRegister,
    updateCustomerProfile,
    customerLogout,
  };
}