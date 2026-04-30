function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function subtractDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  return copy;
}

export function getAnalyticsDateRange(filters) {
  const today = new Date();

  if (!filters || filters.preset === "all") {
    return {};
  }

  if (filters.preset === "today") {
    const date = formatDateInput(today);

    return {
      from: date,
      to: date,
    };
  }

  if (filters.preset === "7d") {
    return {
      from: formatDateInput(subtractDays(today, 6)),
      to: formatDateInput(today),
    };
  }

  if (filters.preset === "30d") {
    return {
      from: formatDateInput(subtractDays(today, 29)),
      to: formatDateInput(today),
    };
  }

  if (filters.preset === "custom") {
    return {
      from: filters.from || "",
      to: filters.to || "",
    };
  }

  return {};
}