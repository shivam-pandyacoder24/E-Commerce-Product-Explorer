/*
 * STORE
 * -----
 * The shop's logic, with no HTML in it. This file is where each data
 * structure is put to work:
 *
 *   catalogue      Array               every product, in catalogue order
 *   byPrice        Array (sorted)      binary search for price ranges
 *   productsById   Hash table          product ID -> product
 *   idTree         Binary search tree  product ID search with suggestions
 *   categories     General tree        category hierarchy
 *   related        Graph               products bought together
 *   cart           Linked list         items in the cart
 *   undoStack      Stack               cart changes, newest on top
 *   orderQueue     Queue               orders waiting to be dispatched
 *   ordersById     Hash table          order ID -> order
 *
 * Each action also records short notes about what the data structures did
 * (this.steps). The page shows those notes in the activity bar.
 */
(function (root) {
  'use strict';

  const inNode = typeof module !== 'undefined' && module.exports;
  const DSA = inNode
    ? Object.assign(
        {
          HashTable: require('./dsa/hash-table.js'),
          LinkedList: require('./dsa/linked-list.js'),
          Stack: require('./dsa/stack.js'),
          Queue: require('./dsa/queue.js'),
          CategoryTree: require('./dsa/category-tree.js'),
          BinarySearchTree: require('./dsa/bst.js'),
          Graph: require('./dsa/graph.js')
        },
        require('./dsa/search.js'),
        require('./dsa/sort.js')
      )
    : root.DSA;

  const MAX_QUANTITY = 10;

  const PRICE_RANGES = {
    any: { label: 'Any price', min: 0, max: Infinity },
    'under-1000': { label: 'Under ₹1,000', min: 0, max: 999 },
    '1000-4999': { label: '₹1,000 to ₹4,999', min: 1000, max: 4999 },
    '5000-19999': { label: '₹5,000 to ₹19,999', min: 5000, max: 19999 },
    '20000-up': { label: '₹20,000 and above', min: 20000, max: Infinity }
  };

  function compareText(a, b) {
    const first = a.toLowerCase();
    const second = b.toLowerCase();
    if (first < second) return -1;
    if (first > second) return 1;
    return 0;
  }

  const SORTS = {
    featured: { label: 'Catalogue order', compare: null },
    'price-low': {
      label: 'Price: low to high',
      noun: 'price, lowest first',
      compare: function (a, b) { return a.price - b.price; }
    },
    'price-high': {
      label: 'Price: high to low',
      noun: 'price, highest first',
      compare: function (a, b) { return b.price - a.price; }
    },
    rating: {
      label: 'Rating: best first',
      noun: 'rating, best first',
      compare: function (a, b) { return b.rating - a.rating; }
    },
    name: {
      label: 'Name: A to Z',
      noun: 'name',
      compare: function (a, b) { return compareText(a.name, b.name); }
    }
  };

  const ALGORITHMS = {
    merge: { label: 'Merge sort', run: DSA.mergeSort },
    quick: { label: 'Quick sort', run: DSA.quickSort },
    bubble: { label: 'Bubble sort', run: DSA.bubbleSort }
  };

  function priceOf(product) {
    return product.price;
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  class Store {
    constructor(data) {
      this.steps = [];

      this.catalogue = []; // ARRAY
      this.productsById = new DSA.HashTable(); // HASH TABLE
      this.idTree = new DSA.BinarySearchTree(); // TREE 2
      this.categories = new DSA.CategoryTree('all', 'All products'); // TREE 1
      this.related = new DSA.Graph(); // GRAPH
      this.cart = new DSA.LinkedList(); // LINKED LIST
      this.undoStack = new DSA.Stack(); // STACK
      this.orderQueue = new DSA.Queue(); // QUEUE
      this.ordersById = new DSA.HashTable(); // HASH TABLE
      this.dispatched = []; // dispatched orders, newest first
      this.nextOrderNumber = 1001;

      for (let i = 0; i < data.categories.length; i++) {
        const row = data.categories[i];
        this.categories.addCategory(row[0], row[1], row[2]);
      }

      for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        this.catalogue.push(product);
        this.productsById.set(product.id, product);
        this.idTree.insert(product.id, product);
        this.categories.addProduct(product.category, product.id);
        this.related.addVertex(product.id);
      }

      for (let i = 0; i < data.related.length; i++) {
        this.related.addEdge(data.related[i][0], data.related[i][1]);
      }

      // A second copy of the catalogue, sorted by price once, for binary search.
      this.byPrice = DSA.mergeSort(this.catalogue, SORTS['price-low'].compare).sorted;
    }

    /* ---------- activity notes ---------- */

    note(structure, text) {
      this.steps.push({ structure: structure, text: text });
    }

    /* Hand the notes collected so far to the page, and start a new list. */
    takeSteps() {
      const steps = this.steps;
      this.steps = [];
      return steps;
    }

    /* ---------- browsing ---------- */

    getProduct(id) {
      return this.productsById.get(id);
    }

    /*
     * The product list. options = { query, categoryId, priceRange, sortBy, algorithm }
     *   - a query made only of digits is a product ID  -> binary search tree
     *   - category                                     -> tree traversal
     *   - price range                                  -> binary search
     *   - keywords                                     -> linear search
     *   - sort order                                   -> merge / quick / bubble sort
     */
    findProducts(options) {
      const query = String(options.query || '').trim().toLowerCase();
      if (/^\d+$/.test(query)) return this.findById(Number(query));

      // Category: depth-first walk of the chosen subtree.
      let inCategory = null;
      const categoryId = options.categoryId || 'all';
      if (categoryId !== 'all') {
        const node = this.categories.find(categoryId);
        if (node !== null) {
          const ids = this.categories.collectProductIds(node);
          inCategory = new DSA.HashTable();
          for (let i = 0; i < ids.length; i++) inCategory.set(ids[i], true);
          this.note('Category tree', 'Depth-first walk below "' + node.name + '" collected ' + plural(ids.length, 'product'));
        }
      }

      // Price range: two binary searches on the price-sorted array.
      let inPriceRange = null;
      const range = PRICE_RANGES[options.priceRange] || PRICE_RANGES.any;
      if (range !== PRICE_RANGES.any) {
        const low = DSA.lowerBound(this.byPrice, range.min, priceOf);
        const high = DSA.upperBound(this.byPrice, range.max, priceOf);
        inPriceRange = new DSA.HashTable();
        for (let i = low.index; i < high.index; i++) inPriceRange.set(this.byPrice[i].id, true);
        this.note(
          'Binary search',
          'Found the ends of the price range in ' + plural(low.comparisons + high.comparisons, 'comparison') +
            ': ' + (high.index - low.index) + ' of ' + this.byPrice.length + ' products'
        );
      }

      // Keywords: linear search through the catalogue array.
      const words = query.split(/\s+/).filter(function (word) { return word !== ''; });
      const search = DSA.linearSearch(this.catalogue, function (product) {
        if (inCategory !== null && !inCategory.has(product.id)) return false;
        if (inPriceRange !== null && !inPriceRange.has(product.id)) return false;
        const text = (product.name + ' ' + product.brand + ' ' + product.tags).toLowerCase();
        for (let i = 0; i < words.length; i++) {
          if (text.indexOf(words[i]) === -1) return false;
        }
        return true;
      });
      if (words.length > 0) {
        this.note('Linear search', 'Checked ' + plural(search.comparisons, 'product') + ' for "' + query + '": ' + search.results.length + ' matched');
      } else {
        this.note('Array', 'Read ' + plural(search.comparisons, 'product') + ' from the catalogue array, kept ' + search.results.length);
      }

      // Sort order.
      let products = search.results;
      const sort = SORTS[options.sortBy] || SORTS.featured;
      if (sort.compare !== null && products.length > 1) {
        const algorithm = ALGORITHMS[options.algorithm] || ALGORITHMS.merge;
        const outcome = algorithm.run(products, sort.compare);
        products = outcome.sorted;
        this.note(algorithm.label, 'Sorted ' + plural(products.length, 'product') + ' by ' + sort.noun + ' in ' + plural(outcome.comparisons, 'comparison'));
      }

      return { mode: 'browse', products: products, suggestions: [] };
    }

    /* Product ID search in the binary search tree. */
    findById(id) {
      const result = this.idTree.search(id);
      if (result.found) {
        this.note('Binary search tree', 'Found ID ' + id + ' in ' + plural(result.comparisons, 'comparison') + ': ' + result.path.join(' → '));
        return { mode: 'id', id: id, products: [result.value], suggestions: [], path: result.path };
      }

      const near = this.idTree.nearest(id);
      const suggestions = [];
      if (near.below !== null) suggestions.push(this.getProduct(near.below));
      if (near.above !== null) suggestions.push(this.getProduct(near.above));
      this.note(
        'Binary search tree',
        'No product with ID ' + id + ' after ' + plural(result.comparisons, 'comparison') +
          '. Closest IDs: ' + suggestions.map(function (p) { return p.id; }).join(' and ')
      );
      return { mode: 'id', id: id, products: [], suggestions: suggestions, path: result.path };
    }

    /* One product with its related products from the graph. */
    openProduct(id) {
      const hit = this.productsById.lookup(id);
      if (!hit.found) return null;
      this.note('Hash table', 'Product ' + id + ' hashed to bucket ' + hit.bucket + ', found after ' + plural(hit.steps, 'check'));

      const self = this;
      const related = this.related.neighbours(id).map(function (neighbourId) {
        return self.getProduct(neighbourId);
      });
      const twoAway = this.related
        .breadthFirst(id, 2)
        .filter(function (entry) { return entry.distance === 2; })
        .map(function (entry) { return self.getProduct(entry.vertex); });
      this.note('Graph', plural(related.length, 'product') + ' one edge away, ' + twoAway.length + ' more two edges away (breadth-first search)');

      return {
        product: hit.value,
        related: related,
        alsoLiked: twoAway.slice(0, 4),
        lookup: { bucket: hit.bucket, steps: hit.steps }
      };
    }

    /* Categories as a flat, pre-order list for drawing the tree. */
    categoryList() {
      const list = [];
      const tree = this.categories;
      tree.traverse(function (node, depth) {
        list.push({ id: node.id, name: node.name, depth: depth, count: tree.countProducts(node), hasChildren: node.children.length > 0 });
      });
      return list;
    }

    breadcrumb(categoryId) {
      return this.categories.pathTo(categoryId).map(function (node) {
        return { id: node.id, name: node.name };
      });
    }

    /* ---------- cart (linked list) and undo (stack) ---------- */

    cartEntry(productId) {
      return this.cart.find(function (entry) { return entry.productId === productId; });
    }

    describeAction(action) {
      const name = this.getProduct(action.productId).name;
      if (action.type === 'add') return 'add ' + name;
      if (action.type === 'remove') return 'remove ' + name;
      return 'quantity change for ' + name;
    }

    record(action) {
      this.undoStack.push(action);
      this.note('Stack', 'Pushed "' + this.describeAction(action) + '" (' + this.undoStack.size() + ' on the stack)');
    }

    addToCart(productId) {
      const product = this.getProduct(productId);
      if (product === undefined) return false;

      const entry = this.cartEntry(productId);
      if (entry !== null) {
        if (entry.quantity >= MAX_QUANTITY) return false;
        entry.quantity += 1;
        this.note('Linked list', 'Found ' + product.name + ' in the list, quantity is now ' + entry.quantity);
        this.record({ type: 'increase', productId: productId });
      } else {
        this.cart.append({ productId: productId, quantity: 1 });
        this.note('Linked list', 'Appended ' + product.name + ' at the tail (' + plural(this.cart.size, 'node') + ')');
        this.record({ type: 'add', productId: productId });
      }
      return true;
    }

    decreaseQuantity(productId) {
      const entry = this.cartEntry(productId);
      if (entry === null) return false;
      if (entry.quantity === 1) return this.removeFromCart(productId);

      entry.quantity -= 1;
      this.note('Linked list', 'Quantity of ' + this.getProduct(productId).name + ' is now ' + entry.quantity);
      this.record({ type: 'decrease', productId: productId });
      return true;
    }

    removeFromCart(productId) {
      const removed = this.cart.removeWhere(function (entry) { return entry.productId === productId; });
      if (removed === null) return false;
      this.note('Linked list', 'Unlinked ' + this.getProduct(productId).name + ' from position ' + (removed.index + 1) + ' (' + plural(this.cart.size, 'node') + ' left)');
      this.record({ type: 'remove', productId: productId, quantity: removed.value.quantity, index: removed.index });
      return true;
    }

    /* What the next undo would reverse, or null when there is nothing to undo. */
    peekUndo() {
      const action = this.undoStack.peek();
      return action === undefined ? null : this.describeAction(action);
    }

    /* Undo history, newest first, as short labels. */
    undoHistory() {
      const self = this;
      return this.undoStack.toArray().map(function (action) { return self.describeAction(action); });
    }

    /* Pop the latest cart change and reverse it. Returns a short description. */
    undo() {
      const action = this.undoStack.pop();
      if (action === undefined) return null;

      const label = this.describeAction(action);
      const name = this.getProduct(action.productId).name;
      this.note('Stack', 'Popped "' + label + '" (' + this.undoStack.size() + ' left)');

      const entry = this.cartEntry(action.productId);
      if (action.type === 'add') {
        this.cart.removeWhere(function (item) { return item.productId === action.productId; });
        this.note('Linked list', 'Unlinked ' + name + ' again');
      } else if (action.type === 'remove') {
        this.cart.insertAt(action.index, { productId: action.productId, quantity: action.quantity });
        this.note('Linked list', 'Re-inserted ' + name + ' at position ' + (action.index + 1));
      } else if (action.type === 'increase' && entry !== null) {
        entry.quantity -= 1;
        this.note('Linked list', 'Quantity of ' + name + ' is back to ' + entry.quantity);
      } else if (action.type === 'decrease' && entry !== null) {
        entry.quantity += 1;
        this.note('Linked list', 'Quantity of ' + name + ' is back to ' + entry.quantity);
      }
      return label;
    }

    /* Walk the linked list and attach product details to each node. */
    cartItems() {
      const self = this;
      const items = [];
      this.cart.forEach(function (entry) {
        const product = self.getProduct(entry.productId);
        items.push({ product: product, quantity: entry.quantity, lineTotal: product.price * entry.quantity });
      });
      return items;
    }

    cartCount() {
      let count = 0;
      this.cart.forEach(function (entry) { count += entry.quantity; });
      return count;
    }

    cartTotal() {
      const self = this;
      let total = 0;
      this.cart.forEach(function (entry) {
        total += self.getProduct(entry.productId).price * entry.quantity;
      });
      return total;
    }

    /* ---------- orders (queue + hash table) ---------- */

    placeOrder() {
      if (this.cart.isEmpty()) return null;

      const items = this.cartItems().map(function (item) {
        return { productId: item.product.id, name: item.product.name, price: item.product.price, quantity: item.quantity };
      });
      const order = {
        id: 'ORD-' + this.nextOrderNumber,
        items: items,
        itemCount: this.cartCount(),
        total: this.cartTotal(),
        status: 'Waiting',
        placedAt: new Date(),
        dispatchedAt: null
      };
      this.nextOrderNumber += 1;

      this.orderQueue.enqueue(order);
      this.ordersById.set(order.id, order);
      this.note('Queue', order.id + ' joined the rear of the queue (' + this.orderQueue.size() + ' waiting)');
      this.note('Hash table', 'Stored ' + order.id + ' in bucket ' + this.ordersById.hash(order.id));

      // A placed order cannot be undone, so the cart and its history start again.
      this.cart.clear();
      this.undoStack.clear();
      return order;
    }

    /* Dispatch the order that has waited longest (front of the queue). */
    dispatchNext() {
      const order = this.orderQueue.dequeue();
      if (order === undefined) return null;
      order.status = 'Dispatched';
      order.dispatchedAt = new Date();
      this.dispatched.unshift(order);
      this.note('Queue', order.id + ' left the front of the queue (' + this.orderQueue.size() + ' still waiting)');
      return order;
    }

    waitingOrders() {
      return this.orderQueue.toArray();
    }

    /* Find an order by ID. "1001" and "ord-1001" both work. */
    trackOrder(input) {
      let id = String(input || '').trim().toUpperCase();
      if (/^\d+$/.test(id)) id = 'ORD-' + id;

      const hit = this.ordersById.lookup(id);
      if (!hit.found) {
        this.note('Hash table', id + ' hashed to bucket ' + hit.bucket + ': no order stored there with that ID');
        return { id: id, found: false, order: null, ahead: 0 };
      }
      this.note('Hash table', id + ' hashed to bucket ' + hit.bucket + ', found after ' + plural(hit.steps, 'check'));

      let ahead = 0;
      if (hit.value.status === 'Waiting') {
        const waiting = this.waitingOrders();
        for (let i = 0; i < waiting.length; i++) {
          if (waiting[i].id === id) ahead = i;
        }
      }
      return { id: id, found: true, order: hit.value, ahead: ahead };
    }

    /* ---------- numbers for the "How it works" page ---------- */

    stats() {
      return {
        products: this.catalogue.length,
        categories: this.categories.nodeCount,
        categoryHeight: this.categories.height(),
        bstNodes: this.idTree.size,
        bstHeight: this.idTree.height(),
        graphVertices: this.related.vertexCount(),
        graphEdges: this.related.edgeCount,
        productBuckets: this.productsById.capacity,
        productLoad: this.productsById.loadFactor(),
        productLongestChain: this.productsById.longestChain(),
        orderKeys: this.ordersById.size,
        cartNodes: this.cart.size,
        undoSize: this.undoStack.size(),
        waiting: this.orderQueue.size(),
        dispatched: this.dispatched.length
      };
    }
  }

  Store.PRICE_RANGES = PRICE_RANGES;
  Store.SORTS = SORTS;
  Store.ALGORITHMS = ALGORITHMS;
  Store.MAX_QUANTITY = MAX_QUANTITY;

  root.Store = Store;
  if (inNode) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
