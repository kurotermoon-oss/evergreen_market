import { useState } from "react";
import { api } from "../api/client.js";
import { DEFAULT_CATEGORY } from "../data/defaults.js";

export function usePublicData() {
  const [categories, setCategories] = useState([DEFAULT_CATEGORY]);
  const [products, setProducts] = useState([]);

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

  return {
    categories,
    products,
    setCategories,
    setProducts,
    loadPublicData,
  };
}