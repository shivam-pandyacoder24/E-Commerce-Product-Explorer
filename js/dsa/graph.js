/*
 * GRAPH (undirected, adjacency list)
 * ----------------------------------
 * Used for: related products. Each product is a vertex. An edge joins two
 * products that are commonly bought together:
 *
 *   Laptop --- Laptop Bag
 *     |  \---- Mouse
 *     |   \--- Keyboard
 *     `------- Cooling Pad
 *
 * neighbours(v)      -> products directly related to v (one edge away)
 * breadthFirst(v, 2) -> products up to two edges away, nearest first.
 *                       The site uses distance 2 for "Shoppers also add".
 *
 * The adjacency list is stored in our own HashTable (vertex -> neighbours)
 * and breadth-first search uses our own Queue.
 */
(function (root) {
  'use strict';

  const inNode = typeof module !== 'undefined' && module.exports;
  const HashTable = inNode ? require('./hash-table.js') : root.DSA.HashTable;
  const Queue = inNode ? require('./queue.js') : root.DSA.Queue;

  class Graph {
    constructor() {
      this.adjacency = new HashTable();
      this.edgeCount = 0;
    }

    addVertex(vertex) {
      if (!this.adjacency.has(vertex)) this.adjacency.set(vertex, []);
    }

    hasEdge(a, b) {
      const neighbours = this.adjacency.get(a);
      if (neighbours === undefined) return false;
      for (let i = 0; i < neighbours.length; i++) {
        if (neighbours[i] === b) return true;
      }
      return false;
    }

    /* Undirected: a is related to b, and b is related to a. */
    addEdge(a, b) {
      if (a === b) return;
      this.addVertex(a);
      this.addVertex(b);
      if (this.hasEdge(a, b)) return;
      this.adjacency.get(a).push(b);
      this.adjacency.get(b).push(a);
      this.edgeCount += 1;
    }

    neighbours(vertex) {
      const neighbours = this.adjacency.get(vertex);
      return neighbours === undefined ? [] : neighbours.slice();
    }

    vertexCount() {
      return this.adjacency.size;
    }

    /* Breadth-first search. Returns [{ vertex, distance }] for every vertex
       within maxDistance edges of start, closest first (start is left out). */
    breadthFirst(start, maxDistance) {
      const reached = [];
      if (!this.adjacency.has(start)) return reached;

      const distanceTo = new HashTable(); // doubles as the "visited" set
      const queue = new Queue();
      distanceTo.set(start, 0);
      queue.enqueue(start);

      while (!queue.isEmpty()) {
        const vertex = queue.dequeue();
        const distance = distanceTo.get(vertex);
        if (distance === maxDistance) continue; // do not go further out

        const neighbours = this.adjacency.get(vertex);
        for (let i = 0; i < neighbours.length; i++) {
          const next = neighbours[i];
          if (distanceTo.has(next)) continue; // already visited
          distanceTo.set(next, distance + 1);
          reached.push({ vertex: next, distance: distance + 1 });
          queue.enqueue(next);
        }
      }
      return reached;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.Graph = Graph;
  if (inNode) module.exports = Graph;
})(typeof window !== 'undefined' ? window : globalThis);
