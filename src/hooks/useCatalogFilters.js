import { useEffect, useMemo, useState } from "react";
import {
  markPopularProducts,
  getPopularProducts,
} from "../utils/products.js";

export function useCatalogFilters({
  products = [],
  categories = [],
  productsPerPage = 9,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedStockStatuses, setSelectedStockStatuses] = useState([]);
  const [showPopularOnly, setShowPopularOnly] = useState(false);

  useEffect(() => {
    setSelectedSubcategory("all");
    setCurrentPage(1);
  }, [selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    selectedCategory,
    selectedSubcategory,
    minPrice,
    maxPrice,
    sortBy,
    selectedBrands,
    selectedProductTypes,
    selectedCountries,
    selectedStockStatuses,
    showPopularOnly,
  ]);

  const productsWithPopularity = useMemo(() => {
    return markPopularProducts(products, 6);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    const filtered = productsWithPopularity.filter((product) => {
      const categoryName =
        categories.find((category) => category.id === product.category)?.name ||
        "";

      const subcategoryName =
        categories
          .find((category) => category.id === product.category)
          ?.subcategories?.find(
            (subcategory) => subcategory.id === product.subcategory
          )?.name || "";

      const searchableText = [
        product.name,
        product.brand,
        product.description,
        product.details,
        product.unit,
        product.packageInfo,
        product.productType,
        product.countryOfOrigin,
        product.price,
        categoryName,
        subcategoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const categoryMatch =
        selectedCategory === "all" || product.category === selectedCategory;

      const subcategoryMatch =
        selectedSubcategory === "all" ||
        product.subcategory === selectedSubcategory;

      const queryMatch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      const minPriceMatch =
        minPrice === "" || Number(product.price) >= Number(minPrice);

      const maxPriceMatch =
        maxPrice === "" || Number(product.price) <= Number(maxPrice);

      const brandMatch =
        selectedBrands.length === 0 ||
        selectedBrands.includes(String(product.brand || "").trim());

      const productTypeMatch =
        selectedProductTypes.length === 0 ||
        selectedProductTypes.includes(String(product.productType || "").trim());

      const countryMatch =
        selectedCountries.length === 0 ||
        selectedCountries.includes(String(product.countryOfOrigin || "").trim());

      const stockStatus = product.stockStatus || "in_stock";
      const stockStatusMatch =
        selectedStockStatuses.length === 0 ||
        selectedStockStatuses.includes(stockStatus);

      const popularMatch = !showPopularOnly || Boolean(product.isPopular);

      return (
        product.active !== false &&
        categoryMatch &&
        subcategoryMatch &&
        queryMatch &&
        minPriceMatch &&
        maxPriceMatch &&
        brandMatch &&
        productTypeMatch &&
        countryMatch &&
        stockStatusMatch &&
        popularMatch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "price-desc") {
        return Number(b.price) - Number(a.price);
      }

      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name, "uk");
      }

      if (sortBy === "popular") {
        const popularityDiff =
          Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular));

        if (popularityDiff !== 0) return popularityDiff;

        return Number(b.purchaseCount || 0) - Number(a.purchaseCount || 0);
      }

      return 0;
    });
  }, [
    productsWithPopularity,
    categories,
    selectedCategory,
    selectedSubcategory,
    query,
    minPrice,
    maxPrice,
    sortBy,
    selectedBrands,
    selectedProductTypes,
    selectedCountries,
    selectedStockStatuses,
    showPopularOnly,
  ]);

  const totalProductPages =
    Math.ceil(filteredProducts.length / productsPerPage) || 1;

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const popularProducts = useMemo(() => {
    return getPopularProducts(products, 6);
  }, [products]);

  return {
    selectedCategory,
    setSelectedCategory,

    selectedSubcategory,
    setSelectedSubcategory,

    query,
    setQuery,

    currentPage,
    setCurrentPage,

    minPrice,
    setMinPrice,

    maxPrice,
    setMaxPrice,

    sortBy,
    setSortBy,

    selectedBrands,
    setSelectedBrands,

    selectedProductTypes,
    setSelectedProductTypes,

    selectedCountries,
    setSelectedCountries,

    selectedStockStatuses,
    setSelectedStockStatuses,

    showPopularOnly,
    setShowPopularOnly,

    filteredProducts,
    paginatedProducts,
    totalProductPages,
    popularProducts,
  };
}
