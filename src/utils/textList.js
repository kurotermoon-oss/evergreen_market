const LIST_MARKER_PATTERN = /^\s*(?:[-*•✓✔]|\d+[.)])\s+/u;

function cleanListItem(value) {
  return String(value || "")
    .replace(LIST_MARKER_PATTERN, "")
    .replace(/\s+/g, " ")
    .trim();
}

function startsPlainListItem(line, currentItem) {
  if (!currentItem) return true;

  const startsWithCapitalOrNumber = /^[\p{Lu}\d]/u.test(line);
  const currentEndsSentence = /[.!?…]$/.test(currentItem.trim());

  return startsWithCapitalOrNumber && currentEndsSentence;
}

export function parseTextList(value) {
  if (Array.isArray(value)) {
    return value.map(cleanListItem).filter(Boolean);
  }

  if (typeof value !== "string") {
    return [];
  }

  const text = value.trim();

  if (!text) {
    return [];
  }

  const items = [];
  let currentItem = "";

  text
    .replace(/\r/g, "")
    .split("\n")
    .forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        if (currentItem) {
          items.push(currentItem);
          currentItem = "";
        }

        return;
      }

      if (LIST_MARKER_PATTERN.test(line)) {
        if (currentItem) {
          items.push(currentItem);
        }

        currentItem = cleanListItem(line);
        return;
      }

      if (startsPlainListItem(line, currentItem)) {
        if (currentItem) {
          items.push(currentItem);
        }

        currentItem = cleanListItem(line);
        return;
      }

      currentItem = [currentItem, cleanListItem(line)]
        .filter(Boolean)
        .join(" ");
    });

  if (currentItem) {
    items.push(currentItem);
  }

  return items
    .flatMap((item) => item.split(/\s*;\s*/))
    .map(cleanListItem)
    .filter(Boolean);
}

export function serializeTextList(items) {
  return items
    .map(cleanListItem)
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
}
