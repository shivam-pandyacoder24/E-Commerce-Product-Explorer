/*
 * GENERAL TREE (any number of children per node)
 * ----------------------------------------------
 * Used for: product categories.
 *
 *   All products
 *   |- Computers
 *   |  |- Laptops
 *   |  |- Monitors
 *   |  `- Storage
 *   `- Audio
 *      |- Headphones
 *      `- Speakers
 *
 * Choosing a category shows every product in that category AND in all the
 * categories below it. That is a depth-first traversal of the subtree.
 * The breadcrumb ("All products / Computers / Laptops") is the path from a
 * node back up to the root, followed through the parent pointers.
 */
(function (root) {
  'use strict';

  class CategoryNode {
    constructor(id, name) {
      this.id = id;
      this.name = name;
      this.parent = null;
      this.children = [];
      this.productIds = []; // products placed directly in this category
    }
  }

  class CategoryTree {
    constructor(rootId, rootName) {
      this.root = new CategoryNode(rootId, rootName);
      this.nodeCount = 1;
    }

    /* Depth-first search for the node with this id. */
    find(id, node = this.root) {
      if (node.id === id) return node;
      for (let i = 0; i < node.children.length; i++) {
        const found = this.find(id, node.children[i]);
        if (found !== null) return found;
      }
      return null;
    }

    addCategory(parentId, id, name) {
      const parent = this.find(parentId);
      if (parent === null) throw new Error('Unknown parent category: ' + parentId);
      const child = new CategoryNode(id, name);
      child.parent = parent;
      parent.children.push(child);
      this.nodeCount += 1;
      return child;
    }

    addProduct(categoryId, productId) {
      const node = this.find(categoryId);
      if (node === null) throw new Error('Unknown category: ' + categoryId);
      node.productIds.push(productId);
    }

    /* Depth-first traversal: this node's products, then each child's. */
    collectProductIds(node = this.root, collected = []) {
      for (let i = 0; i < node.productIds.length; i++) collected.push(node.productIds[i]);
      for (let i = 0; i < node.children.length; i++) {
        this.collectProductIds(node.children[i], collected);
      }
      return collected;
    }

    countProducts(node = this.root) {
      let count = node.productIds.length;
      for (let i = 0; i < node.children.length; i++) count += this.countProducts(node.children[i]);
      return count;
    }

    /* Nodes from the root down to the given category. */
    pathTo(id) {
      const path = [];
      let node = this.find(id);
      while (node !== null) {
        path.unshift(node);
        node = node.parent;
      }
      return path;
    }

    /* Number of levels below the root. */
    height(node = this.root) {
      let tallest = -1;
      for (let i = 0; i < node.children.length; i++) {
        const childHeight = this.height(node.children[i]);
        if (childHeight > tallest) tallest = childHeight;
      }
      return tallest + 1;
    }

    /* Pre-order walk. visit(node, depth) is called for every category. */
    traverse(visit, node = this.root, depth = 0) {
      visit(node, depth);
      for (let i = 0; i < node.children.length; i++) {
        this.traverse(visit, node.children[i], depth + 1);
      }
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.CategoryTree = CategoryTree;
  if (typeof module !== 'undefined' && module.exports) module.exports = CategoryTree;
})(typeof window !== 'undefined' ? window : globalThis);
