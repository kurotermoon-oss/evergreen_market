export const DEFAULT_FORM = {
  name: "",
  phone: "",
  telegram: "",
  deliveryType: "pickup",
  building: "",
  entrance: "",
  floor: "",
  apartment: "",
  payment: "Після підтвердження",
  comment: "",
};

export const EMPTY_DRAFT_PRODUCT = {
  name: "",

  category: "coffee",
  subcategory: "",
  newCategoryName: "",
  newSubcategoryName: "",

  brand: "",
  productType: "",
  countryOfOrigin: "",

  description: "",
  details: "",
  benefits: "",

  unit: "1 шт",
  packageInfo: "продається поштучно",

  composition: "",
  allergens: "",
  storageConditions: "",

  price: "",
  costPrice: "",
  oldPrice: "",

  image: "",

  popular: false,
  active: true,

  stockStatus: "in_stock",
  stockQuantity: "",
};

export const PRODUCTS_PER_PAGE = 9;

export const DEFAULT_CATEGORY = {
  id: "all",
  name: "Усі товари",
};