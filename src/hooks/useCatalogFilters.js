import { useEffect, useMemo, useState } from "react";

export function useCatalogFilters({
  products,
  categories,
  productsPerPage = 9,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

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
  ]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();

    const filtered = products.filter((product) => {
      const categoryName =
        categories.find((category) => category.id === product.category)?.name ||
        "";

      const searchableText = [
        product.name,
        product.description,
        product.details,
        product.unit,
        product.packageInfo,
        product.price,
        categoryName,
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

      return (
        product.active &&
        categoryMatch &&
        subcategoryMatch &&
        queryMatch &&
        minPriceMatch &&
        maxPriceMatch
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

      return 0;
    });
  }, [
    products,
    categories,
    selectedCategory,
    selectedSubcategory,
    query,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  const totalProductPages =
    Math.ceil(filteredProducts.length / productsPerPage) || 1;

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

  const popularProducts = useMemo(() => {
    return [...products]
      .filter((product) => product.active)
      .sort((a, b) => {
        const purchasesDiff =
          Number(b.purchaseCount || 0) - Number(a.purchaseCount || 0);

        if (purchasesDiff !== 0) return purchasesDiff;

        return Number(b.popular) - Number(a.popular);
      })
      .slice(0, 6);
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

    filteredProducts,
    paginatedProducts,
    totalProductPages,
    popularProducts,
  };
}