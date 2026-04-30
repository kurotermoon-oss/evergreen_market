export function formatUAH(value) {
  const number = Number(value || 0);

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(number);
}