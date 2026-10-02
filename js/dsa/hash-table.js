/*
 * HASH TABLE (separate chaining)
 * ------------------------------
 * Used for: instant product lookup by product ID and order lookup by order ID.
 *
 * How it works:
 *   1. hash(key) turns the key into a bucket number.
 *   2. Each bucket holds a small chain (array) of { key, value } entries.
 *   3. Two keys landing in the same bucket is a "collision"; they simply
 *      share the chain.
 *   4. When the table gets more than 75% full it moves to a bigger table
 *      (the next prime number after double the size) and every entry is
 *      re-hashed, so chains stay short.
 *
 * The number of buckets is always a prime number. With a prime size the
 * remainder depends on every character of the key, so keys spread evenly.
 *
 * Average time: set / get / delete are O(1).
 */
(function (root) {
  'use strict';

  function isPrime(number) {
    if (number < 2) return false;
    for (let divisor = 2; divisor * divisor <= number; divisor++) {
      if (number % divisor === 0) return false;
    }
    return true;
  }

  function nextPrime(number) {
    let candidate = number;
    while (!isPrime(candidate)) candidate += 1;
    return candidate;
  }

  class HashTable {
    constructor(capacity = 17) {
      this.capacity = capacity;
      this.size = 0;
      this.buckets = HashTable.makeBuckets(capacity);
    }

    static makeBuckets(count) {
      const buckets = new Array(count);
      for (let i = 0; i < count; i++) buckets[i] = [];
      return buckets;
    }

    /* Polynomial string hash: hash = hash * 31 + character code.
       The key "AB" becomes 65 * 31 + 66. The final remainder picks the bucket. */
    hash(key) {
      const text = String(key);
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = (hash * 31 + text.charCodeAt(i)) % 1000000007; // keep the number small
      }
      return hash % this.capacity;
    }

    set(key, value) {
      const chain = this.buckets[this.hash(key)];
      for (let i = 0; i < chain.length; i++) {
        if (chain[i].key === key) {
          chain[i].value = value; // key already stored: replace its value
          return;
        }
      }
      chain.push({ key: key, value: value });
      this.size += 1;
      if (this.size / this.capacity > 0.75) this.resize(nextPrime(this.capacity * 2));
    }

    /* Same as get(), but also reports which bucket was used and how many
       entries were checked. The site shows this in the activity bar. */
    lookup(key) {
      const bucket = this.hash(key);
      const chain = this.buckets[bucket];
      for (let i = 0; i < chain.length; i++) {
        if (chain[i].key === key) {
          return { found: true, value: chain[i].value, bucket: bucket, steps: i + 1 };
        }
      }
      return { found: false, value: undefined, bucket: bucket, steps: chain.length };
    }

    get(key) {
      return this.lookup(key).value;
    }

    has(key) {
      return this.lookup(key).found;
    }

    delete(key) {
      const chain = this.buckets[this.hash(key)];
      for (let i = 0; i < chain.length; i++) {
        if (chain[i].key === key) {
          chain.splice(i, 1);
          this.size -= 1;
          return true;
        }
      }
      return false;
    }

    resize(newCapacity) {
      const oldBuckets = this.buckets;
      this.capacity = newCapacity;
      this.buckets = HashTable.makeBuckets(newCapacity);
      this.size = 0;
      for (let b = 0; b < oldBuckets.length; b++) {
        for (let i = 0; i < oldBuckets[b].length; i++) {
          this.set(oldBuckets[b][i].key, oldBuckets[b][i].value);
        }
      }
    }

    keys() {
      const keys = [];
      for (let b = 0; b < this.buckets.length; b++) {
        for (let i = 0; i < this.buckets[b].length; i++) keys.push(this.buckets[b][i].key);
      }
      return keys;
    }

    loadFactor() {
      return this.size / this.capacity;
    }

    /* Number of entries in each bucket, used to draw the table. */
    bucketSizes() {
      const sizes = [];
      for (let b = 0; b < this.buckets.length; b++) sizes.push(this.buckets[b].length);
      return sizes;
    }

    longestChain() {
      let longest = 0;
      for (let b = 0; b < this.buckets.length; b++) {
        if (this.buckets[b].length > longest) longest = this.buckets[b].length;
      }
      return longest;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.HashTable = HashTable;
  if (typeof module !== 'undefined' && module.exports) module.exports = HashTable;
})(typeof window !== 'undefined' ? window : globalThis);
