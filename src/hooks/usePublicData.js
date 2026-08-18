import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { DEFAULT_CATEGORY } from "../data/defaults.js";

const AVAILABILITY_REFRESH_INTERVAL_MS = 60_000;

export function usePublicData() {
  const [categories, setCategories] = useState([DEFAULT_CATEGORY]);
  const [products, setProducts] = useState([]);
  const availabilityRefreshInFlight = useRef(false);

  async function loadPublicData() {
    const [categoriesResponse, productsResponse] = await Promise.all([
      api.getCategories(),
      api.getProducts(),
    ]);

    setCategories([DEFAULT_CATEGORY, ...categoriesResponse.categories]);
    setProducts(productsResponse.products);

    return {
      categories: categoriesResponse.categories,
      products: productsResponse.products,
    };
  }

  useEffect(() => {
    let disposed = false;

    async function refreshAvailability() {
      if (
        document.visibilityState !== "visible" ||
        availabilityRefreshInFlight.current
      ) {
        return;
      }

      availabilityRefreshInFlight.current = true;

      try {
        const response = await api.getProducts();

        if (!disposed) {
          setProducts(response.products);
        }
      } catch (error) {
        if (!disposed) {
          console.warn("Не вдалося тихо оновити наявність товарів:", error);
        }
      } finally {
        availabilityRefreshInFlight.current = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshAvailability();
      }
    }

    const intervalId = window.setInterval(
      refreshAvailability,
      AVAILABILITY_REFRESH_INTERVAL_MS
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    categories,
    products,
    setCategories,
    setProducts,
    loadPublicData,
  };
}
