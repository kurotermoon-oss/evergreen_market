function cleanName(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .replace(/[ʼ’`]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeStrictProductName(value) {
  return cleanName(value);
}

function normalizeCanonicalProductName(value) {
  return cleanName(value)
    .replace(/фруктове пюре\s*\(концентрат чаю\)/giu, "фруктове пюре")
    .replace(/фруктове пюре для лимонадів та чаю/giu, "фруктове пюре")
    .replace(/(^|\s)тм(?=\s|$)/giu, " ")
    .replace(/(\d)\s*[×х*]\s*(?=\d)/giu, "$1x")
    .replace(/(\d)[,.](?=\d)/g, "$1.")
    .replace(/[^\p{L}\p{N}.]+/gu, "");
}

function buildIndex(items, keySelector) {
  const index = new Map();

  items.forEach((item) => {
    const key = keySelector(item);

    if (!key) return;

    const values = index.get(key) || [];
    values.push(item);
    index.set(key, values);
  });

  return index;
}

function getBigrams(value) {
  if (!value) return [];
  if (value.length === 1) return [value];

  return Array.from({ length: value.length - 1 }, (_, index) => {
    return value.slice(index, index + 2);
  });
}

function getNameSimilarity(leftValue, rightValue) {
  const left = normalizeCanonicalProductName(leftValue);
  const right = normalizeCanonicalProductName(rightValue);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftBigrams = getBigrams(left);
  const rightBigrams = getBigrams(right);
  const rightCounts = new Map();

  rightBigrams.forEach((bigram) => {
    rightCounts.set(bigram, (rightCounts.get(bigram) || 0) + 1);
  });

  let intersections = 0;

  leftBigrams.forEach((bigram) => {
    const count = rightCounts.get(bigram) || 0;

    if (count > 0) {
      intersections += 1;
      rightCounts.set(bigram, count - 1);
    }
  });

  return (2 * intersections) / (leftBigrams.length + rightBigrams.length);
}

function mapRemoteCandidate(remote) {
  return {
    name: remote.name || "",
    url: remote.url || "",
    externalId: remote.externalId || "",
    status: remote.status || "unknown",
  };
}

function getSuggestions(product, remoteProducts, limit = 3) {
  return remoteProducts
    .map((remote) => ({
      ...mapRemoteCandidate(remote),
      similarity: getNameSimilarity(product.name, remote.name),
    }))
    .filter((candidate) => candidate.similarity >= 0.58)
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, limit)
    .map((candidate) => ({
      ...candidate,
      similarity: Number(candidate.similarity.toFixed(3)),
    }));
}

function buildProductAutoMapping(products = [], remoteProducts = []) {
  const normalizedRemoteProducts = remoteProducts.filter((remote) => {
    return remote?.url && remote?.name;
  });
  const strictIndex = buildIndex(normalizedRemoteProducts, (remote) => {
    return normalizeStrictProductName(remote.name);
  });
  const canonicalIndex = buildIndex(normalizedRemoteProducts, (remote) => {
    return normalizeCanonicalProductName(remote.name);
  });
  const alreadyMapped = products.filter((product) => product.supplierProductUrl);
  const reservedUrls = new Set(
    alreadyMapped.map((product) => String(product.supplierProductUrl || "").trim())
  );
  const proposals = [];
  const ambiguous = [];
  const unmatched = [];

  products
    .filter((product) => !product.supplierProductUrl)
    .forEach((product) => {
      const strictMatches =
        strictIndex.get(normalizeStrictProductName(product.name)) || [];
      let candidates = strictMatches;
      let matchType = "exact";

      if (candidates.length === 0) {
        candidates =
          canonicalIndex.get(normalizeCanonicalProductName(product.name)) || [];
        matchType = "normalized";
      }

      if (candidates.length === 1) {
        const remote = candidates[0];

        if (reservedUrls.has(remote.url)) {
          ambiguous.push({
            productId: product.id,
            productName: product.name || "",
            reason: "remote_already_mapped",
            candidates: [mapRemoteCandidate(remote)],
          });
          return;
        }

        proposals.push({
          product,
          remote,
          matchType,
        });
        return;
      }

      if (candidates.length > 1) {
        ambiguous.push({
          productId: product.id,
          productName: product.name || "",
          reason: "multiple_remote_matches",
          candidates: candidates.slice(0, 5).map(mapRemoteCandidate),
        });
        return;
      }

      unmatched.push({
        productId: product.id,
        productName: product.name || "",
        suggestions: getSuggestions(product, normalizedRemoteProducts),
      });
    });

  const proposalGroups = buildIndex(proposals, (proposal) => proposal.remote.url);
  const matches = [];

  proposalGroups.forEach((group) => {
    if (group.length === 1) {
      const proposal = group[0];
      reservedUrls.add(proposal.remote.url);
      matches.push({
        productId: proposal.product.id,
        productName: proposal.product.name || "",
        currentSyncEnabled: proposal.product.supplierSyncEnabled === true,
        matchType: proposal.matchType,
        remote: mapRemoteCandidate(proposal.remote),
      });
      return;
    }

    group.forEach((proposal) => {
      ambiguous.push({
        productId: proposal.product.id,
        productName: proposal.product.name || "",
        reason: "multiple_local_matches",
        candidates: [mapRemoteCandidate(proposal.remote)],
      });
    });
  });

  matches.sort((left, right) => left.productName.localeCompare(right.productName, "uk"));
  ambiguous.sort((left, right) =>
    left.productName.localeCompare(right.productName, "uk")
  );
  unmatched.sort((left, right) =>
    left.productName.localeCompare(right.productName, "uk")
  );

  return {
    summary: {
      products: products.length,
      alreadyMapped: alreadyMapped.length,
      matched: matches.length,
      exact: matches.filter((match) => match.matchType === "exact").length,
      normalized: matches.filter((match) => match.matchType === "normalized").length,
      ambiguous: ambiguous.length,
      unmatched: unmatched.length,
    },
    matches,
    ambiguous,
    unmatched,
  };
}

module.exports = {
  normalizeStrictProductName,
  normalizeCanonicalProductName,
  getNameSimilarity,
  buildProductAutoMapping,
};
