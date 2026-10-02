/*
 * SORTING
 * -------
 * Three algorithms, all written by hand, so they can be compared on the
 * same data. Each one takes a compare(a, b) function that returns a
 * negative number when a should come first, and returns
 * { sorted, comparisons }. The original array is never changed.
 *
 *   mergeSort   O(n log n) always. Stable. The default on the site.
 *   quickSort   O(n log n) on average, O(n^2) in the worst case.
 *   bubbleSort  O(n^2). Kept for comparison: it needs far more comparisons.
 */
(function (root) {
  'use strict';

  /* Split in half, sort each half, then merge the two sorted halves. */
  function mergeSort(items, compare) {
    let comparisons = 0;

    function merge(left, right) {
      const merged = [];
      let i = 0;
      let j = 0;
      while (i < left.length && j < right.length) {
        comparisons += 1;
        // "<=" keeps equal items in their original order (stable sort)
        if (compare(left[i], right[j]) <= 0) merged.push(left[i++]);
        else merged.push(right[j++]);
      }
      while (i < left.length) merged.push(left[i++]);
      while (j < right.length) merged.push(right[j++]);
      return merged;
    }

    function sort(list) {
      if (list.length <= 1) return list;
      const middle = Math.floor(list.length / 2);
      return merge(sort(list.slice(0, middle)), sort(list.slice(middle)));
    }

    return { sorted: sort(items.slice()), comparisons: comparisons };
  }

  /* Pick a pivot, move smaller items before it and larger items after it,
     then sort the two sides the same way. */
  function quickSort(items, compare) {
    const list = items.slice();
    let comparisons = 0;

    function swap(a, b) {
      const kept = list[a];
      list[a] = list[b];
      list[b] = kept;
    }

    function partition(low, high) {
      // The middle item is the pivot, so an already-sorted list is not the worst case.
      swap(Math.floor((low + high) / 2), high);
      const pivot = list[high];
      let boundary = low; // everything before `boundary` is smaller than the pivot
      for (let i = low; i < high; i++) {
        comparisons += 1;
        if (compare(list[i], pivot) < 0) {
          swap(i, boundary);
          boundary += 1;
        }
      }
      swap(boundary, high); // put the pivot in its final position
      return boundary;
    }

    function sort(low, high) {
      if (low >= high) return;
      const pivotIndex = partition(low, high);
      sort(low, pivotIndex - 1);
      sort(pivotIndex + 1, high);
    }

    sort(0, list.length - 1);
    return { sorted: list, comparisons: comparisons };
  }

  /* Repeatedly swap neighbours that are in the wrong order. After each pass
     the largest remaining item has "bubbled" to the end. */
  function bubbleSort(items, compare) {
    const list = items.slice();
    let comparisons = 0;

    for (let pass = 0; pass < list.length - 1; pass++) {
      let swapped = false;
      for (let i = 0; i < list.length - 1 - pass; i++) {
        comparisons += 1;
        if (compare(list[i], list[i + 1]) > 0) {
          const kept = list[i];
          list[i] = list[i + 1];
          list[i + 1] = kept;
          swapped = true;
        }
      }
      if (!swapped) break; // no swaps in a full pass: already sorted
    }
    return { sorted: list, comparisons: comparisons };
  }

  const api = { mergeSort: mergeSort, quickSort: quickSort, bubbleSort: bubbleSort };

  root.DSA = root.DSA || {};
  root.DSA.mergeSort = mergeSort;
  root.DSA.quickSort = quickSort;
  root.DSA.bubbleSort = bubbleSort;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
