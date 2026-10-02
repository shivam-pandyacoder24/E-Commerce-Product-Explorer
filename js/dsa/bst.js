/*
 * BINARY SEARCH TREE
 * ------------------
 * Used for: looking a product up by its product ID.
 *
 * Rule: for every node, smaller keys go in the left subtree and larger keys
 * go in the right subtree. A search therefore throws away half of the
 * remaining tree at each step (when the tree is reasonably balanced).
 *
 * The BST also gives two things a hash table cannot:
 *   - inOrder() returns the IDs already sorted.
 *   - nearest() returns the closest IDs below and above a missing ID,
 *     which the site uses for "did you mean" suggestions.
 *
 * Time: insert / search O(h), where h is the height of the tree.
 */
(function (root) {
  'use strict';

  class BSTNode {
    constructor(key, value) {
      this.key = key;
      this.value = value;
      this.left = null;
      this.right = null;
    }
  }

  class BinarySearchTree {
    constructor() {
      this.root = null;
      this.size = 0;
    }

    insert(key, value) {
      const node = new BSTNode(key, value);
      if (this.root === null) {
        this.root = node;
        this.size = 1;
        return;
      }

      let current = this.root;
      while (true) {
        if (key === current.key) {
          current.value = value; // same ID again: replace the value
          return;
        }
        if (key < current.key) {
          if (current.left === null) {
            current.left = node;
            break;
          }
          current = current.left;
        } else {
          if (current.right === null) {
            current.right = node;
            break;
          }
          current = current.right;
        }
      }
      this.size += 1;
    }

    /* Returns the value plus the keys visited on the way down (the path). */
    search(key) {
      const path = [];
      let current = this.root;
      while (current !== null) {
        path.push(current.key);
        if (key === current.key) {
          return { found: true, value: current.value, path: path, comparisons: path.length };
        }
        current = key < current.key ? current.left : current.right;
      }
      return { found: false, value: undefined, path: path, comparisons: path.length };
    }

    /* Closest keys on each side of `key`: { below, above } (null if none). */
    nearest(key) {
      let below = null;
      let above = null;
      let current = this.root;
      while (current !== null) {
        if (key === current.key) return { below: current.key, above: current.key };
        if (key < current.key) {
          above = current.key; // best "larger" candidate so far
          current = current.left;
        } else {
          below = current.key; // best "smaller" candidate so far
          current = current.right;
        }
      }
      return { below: below, above: above };
    }

    /* Left subtree, node, right subtree: visits keys in ascending order. */
    inOrder(node = this.root, visited = []) {
      if (node === null) return visited;
      this.inOrder(node.left, visited);
      visited.push({ key: node.key, value: node.value });
      this.inOrder(node.right, visited);
      return visited;
    }

    /* Number of edges on the longest path from the root to a leaf. */
    height(node = this.root) {
      if (node === null) return -1;
      const left = this.height(node.left);
      const right = this.height(node.right);
      return 1 + (left > right ? left : right);
    }

    min() {
      if (this.root === null) return null;
      let current = this.root;
      while (current.left !== null) current = current.left;
      return current.key;
    }

    max() {
      if (this.root === null) return null;
      let current = this.root;
      while (current.right !== null) current = current.right;
      return current.key;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.BinarySearchTree = BinarySearchTree;
  if (typeof module !== 'undefined' && module.exports) module.exports = BinarySearchTree;
})(typeof window !== 'undefined' ? window : globalThis);
