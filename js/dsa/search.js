/*
 * SEARCHING
 * ---------
 * linearSearch  - checks every item one by one. Used for keyword search,
 *                 because any product could match the typed words. O(n).
 *
 * binarySearch  - works on a SORTED array. Looks at the middle item and
 *                 throws away the half that cannot contain the target.
 *                 O(log n).
 *
 * lowerBound /  - binary search variations that find where a value would
 * upperBound      sit in a sorted array. The price filter uses them to cut
 *                 the price-sorted catalogue down to one price range without
 *                 looking at every product.
 *
 * Every function also returns how many comparisons it made, so the site can
 * show the work that was done.
 */
(function (root) {
  'use strict';

  /* Returns every item for which matches(item) is true. */
  function linearSearch(items, matches) {
    const results = [];
    let comparisons = 0;
    for (let i = 0; i < items.length; i++) {
      comparisons += 1;
      if (matches(items[i])) results.push(items[i]);
    }
    return { results: results, comparisons: comparisons };
  }

  /* Index of an item whose key equals target, or -1. */
  function binarySearch(sortedItems, target, keyOf) {
    let low = 0;
    let high = sortedItems.length - 1;
    let comparisons = 0;

    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      const key = keyOf(sortedItems[middle]);
      comparisons += 1;
      if (key === target) return { index: middle, comparisons: comparisons };
      if (key < target) low = middle + 1;
      else high = middle - 1;
    }
    return { index: -1, comparisons: comparisons };
  }

  /* First index whose key is >= target (sortedItems.length if none). */
  function lowerBound(sortedItems, target, keyOf) {
    let low = 0;
    let high = sortedItems.length;
    let comparisons = 0;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      comparisons += 1;
      if (keyOf(sortedItems[middle]) < target) low = middle + 1;
      else high = middle;
    }
    return { index: low, comparisons: comparisons };
  }

  /* First index whose key is > target (sortedItems.length if none). */
  function upperBound(sortedItems, target, keyOf) {
    let low = 0;
    let high = sortedItems.length;
    let comparisons = 0;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      comparisons += 1;
      if (keyOf(sortedItems[middle]) <= target) low = middle + 1;
      else high = middle;
    }
    return { index: low, comparisons: comparisons };
  }

  const api = {
    linearSearch: linearSearch,
    binarySearch: binarySearch,
    lowerBound: lowerBound,
    upperBound: upperBound
  };

  root.DSA = root.DSA || {};
  root.DSA.linearSearch = linearSearch;
  root.DSA.binarySearch = binarySearch;
  root.DSA.lowerBound = lowerBound;
  root.DSA.upperBound = upperBound;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
