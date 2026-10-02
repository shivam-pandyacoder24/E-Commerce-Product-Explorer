/*
 * Tests for the data structures and the shop logic.
 * Run with:  node tests/run-tests.js
 * No packages needed. Uses Node's built-in assert module.
 */
'use strict';

const assert = require('assert');

const HashTable = require('../js/dsa/hash-table.js');
const LinkedList = require('../js/dsa/linked-list.js');
const Stack = require('../js/dsa/stack.js');
const Queue = require('../js/dsa/queue.js');
const CategoryTree = require('../js/dsa/category-tree.js');
const BinarySearchTree = require('../js/dsa/bst.js');
const Graph = require('../js/dsa/graph.js');
const search = require('../js/dsa/search.js');
const sort = require('../js/dsa/sort.js');
const data = require('../js/data.js');
const Store = require('../js/store.js');

let passed = 0;
let failed = 0;

function test(name, body) {
  try {
    body();
    passed += 1;
    console.log('  ok    ' + name);
  } catch (error) {
    failed += 1;
    console.log('  FAIL  ' + name);
    console.log('        ' + error.message);
  }
}

function byNumber(a, b) {
  return a - b;
}

function same(value) {
  return value;
}

console.log('\nHash table');
test('stores, reads, replaces and deletes values', function () {
  const table = new HashTable(4);
  table.set('ORD-1001', 'first');
  table.set(4821, 'laptop');
  table.set('ORD-1001', 'updated');
  assert.strictEqual(table.size, 2);
  assert.strictEqual(table.get('ORD-1001'), 'updated');
  assert.strictEqual(table.get(4821), 'laptop');
  assert.strictEqual(table.get('missing'), undefined);
  assert.strictEqual(table.delete(4821), true);
  assert.strictEqual(table.has(4821), false);
  assert.strictEqual(table.delete(4821), false);
});
test('grows and keeps every entry when it gets full', function () {
  const table = new HashTable(4);
  for (let i = 0; i < 200; i++) table.set('key' + i, i);
  assert.strictEqual(table.size, 200);
  assert.ok(table.capacity > 4);
  assert.ok(table.loadFactor() <= 0.75);
  for (let i = 0; i < 200; i++) assert.strictEqual(table.get('key' + i), i);
  assert.strictEqual(table.keys().length, 200);
});
test('handles collisions with chaining', function () {
  const table = new HashTable(1); // one bucket: every key collides
  table.buckets = [[]];
  table.capacity = 1;
  table.resize = function () {}; // keep a single bucket for this test
  table.set('a', 1);
  table.set('b', 2);
  table.set('c', 3);
  assert.strictEqual(table.longestChain(), 3);
  assert.strictEqual(table.lookup('c').steps, 3);
  assert.strictEqual(table.get('b'), 2);
});

console.log('\nLinked list');
test('append, prepend and insertAt keep the right order', function () {
  const list = new LinkedList();
  list.append('b');
  list.append('d');
  list.prepend('a');
  list.insertAt(2, 'c');
  list.insertAt(99, 'e');
  list.insertAt(0, 'start');
  assert.deepStrictEqual(list.toArray(), ['start', 'a', 'b', 'c', 'd', 'e']);
  assert.strictEqual(list.size, 6);
  assert.strictEqual(list.tail.value, 'e');
});
test('removeWhere unlinks head, middle and tail nodes', function () {
  const list = new LinkedList();
  ['a', 'b', 'c', 'd'].forEach(function (value) { list.append(value); });
  assert.deepStrictEqual(list.removeWhere(function (v) { return v === 'a'; }), { value: 'a', index: 0 });
  assert.deepStrictEqual(list.removeWhere(function (v) { return v === 'c'; }), { value: 'c', index: 1 });
  assert.deepStrictEqual(list.removeWhere(function (v) { return v === 'd'; }), { value: 'd', index: 1 });
  assert.strictEqual(list.removeWhere(function (v) { return v === 'zzz'; }), null);
  assert.deepStrictEqual(list.toArray(), ['b']);
  assert.strictEqual(list.head, list.tail);
  list.append('z'); // tail pointer must still be correct
  assert.deepStrictEqual(list.toArray(), ['b', 'z']);
});
test('removing the only node empties the list', function () {
  const list = new LinkedList();
  list.append('only');
  list.removeWhere(function () { return true; });
  assert.strictEqual(list.head, null);
  assert.strictEqual(list.tail, null);
  assert.strictEqual(list.isEmpty(), true);
  assert.strictEqual(list.find(function () { return true; }), null);
});

console.log('\nStack');
test('pops in last-in, first-out order', function () {
  const stack = new Stack();
  assert.strictEqual(stack.pop(), undefined);
  stack.push(1);
  stack.push(2);
  stack.push(3);
  assert.strictEqual(stack.peek(), 3);
  assert.deepStrictEqual(stack.toArray(), [3, 2, 1]);
  assert.strictEqual(stack.pop(), 3);
  assert.strictEqual(stack.pop(), 2);
  assert.strictEqual(stack.size(), 1);
  stack.clear();
  assert.strictEqual(stack.isEmpty(), true);
});

console.log('\nQueue');
test('dequeues in first-in, first-out order', function () {
  const queue = new Queue(4);
  assert.strictEqual(queue.dequeue(), undefined);
  queue.enqueue('a');
  queue.enqueue('b');
  queue.enqueue('c');
  assert.strictEqual(queue.peek(), 'a');
  assert.strictEqual(queue.dequeue(), 'a');
  assert.strictEqual(queue.dequeue(), 'b');
  assert.deepStrictEqual(queue.toArray(), ['c']);
});
test('wraps around the end of the array and grows when full', function () {
  const queue = new Queue(4);
  for (let i = 1; i <= 4; i++) queue.enqueue(i);
  queue.dequeue();
  queue.dequeue();
  queue.enqueue(5); // wraps to slot 0
  queue.enqueue(6); // wraps to slot 1, array is now full
  assert.strictEqual(queue.capacity, 4);
  assert.deepStrictEqual(queue.toArray(), [3, 4, 5, 6]);
  queue.enqueue(7); // forces grow()
  assert.strictEqual(queue.capacity, 8);
  assert.deepStrictEqual(queue.toArray(), [3, 4, 5, 6, 7]);
  const out = [];
  while (!queue.isEmpty()) out.push(queue.dequeue());
  assert.deepStrictEqual(out, [3, 4, 5, 6, 7]);
});

console.log('\nCategory tree');
test('collects products from a whole subtree', function () {
  const tree = new CategoryTree('all', 'All');
  tree.addCategory('all', 'computers', 'Computers');
  tree.addCategory('computers', 'laptops', 'Laptops');
  tree.addCategory('computers', 'monitors', 'Monitors');
  tree.addCategory('all', 'audio', 'Audio');
  tree.addProduct('laptops', 1);
  tree.addProduct('laptops', 2);
  tree.addProduct('monitors', 3);
  tree.addProduct('audio', 4);
  assert.deepStrictEqual(tree.collectProductIds(tree.find('computers')), [1, 2, 3]);
  assert.deepStrictEqual(tree.collectProductIds(), [1, 2, 3, 4]);
  assert.strictEqual(tree.countProducts(tree.find('audio')), 1);
  assert.strictEqual(tree.height(), 2);
  assert.strictEqual(tree.nodeCount, 5);
  assert.strictEqual(tree.find('nope'), null);
  assert.deepStrictEqual(tree.pathTo('laptops').map(function (n) { return n.id; }), ['all', 'computers', 'laptops']);
  assert.throws(function () { tree.addCategory('nope', 'x', 'X'); });
});

console.log('\nBinary search tree');
test('finds keys and returns them sorted in order', function () {
  const tree = new BinarySearchTree();
  [50, 30, 70, 20, 40, 60, 80].forEach(function (key) { tree.insert(key, 'value' + key); });
  assert.strictEqual(tree.size, 7);
  assert.strictEqual(tree.height(), 2);
  assert.deepStrictEqual(tree.search(60).path, [50, 70, 60]);
  assert.strictEqual(tree.search(60).value, 'value60');
  assert.strictEqual(tree.search(65).found, false);
  assert.deepStrictEqual(tree.inOrder().map(function (e) { return e.key; }), [20, 30, 40, 50, 60, 70, 80]);
  assert.strictEqual(tree.min(), 20);
  assert.strictEqual(tree.max(), 80);
  tree.insert(60, 'replaced');
  assert.strictEqual(tree.size, 7);
  assert.strictEqual(tree.search(60).value, 'replaced');
});
test('nearest() gives the closest keys on both sides', function () {
  const tree = new BinarySearchTree();
  [50, 30, 70, 20, 40, 60, 80].forEach(function (key) { tree.insert(key, key); });
  assert.deepStrictEqual(tree.nearest(65), { below: 60, above: 70 });
  assert.deepStrictEqual(tree.nearest(10), { below: null, above: 20 });
  assert.deepStrictEqual(tree.nearest(99), { below: 80, above: null });
  assert.deepStrictEqual(tree.nearest(40), { below: 40, above: 40 });
});

console.log('\nGraph');
test('edges are undirected and never duplicated', function () {
  const graph = new Graph();
  graph.addEdge('laptop', 'bag');
  graph.addEdge('bag', 'laptop');
  graph.addEdge('laptop', 'mouse');
  graph.addEdge('laptop', 'laptop');
  assert.strictEqual(graph.edgeCount, 2);
  assert.strictEqual(graph.vertexCount(), 3);
  assert.deepStrictEqual(graph.neighbours('laptop'), ['bag', 'mouse']);
  assert.deepStrictEqual(graph.neighbours('bag'), ['laptop']);
  assert.deepStrictEqual(graph.neighbours('unknown'), []);
});
test('breadth-first search reports distances and respects the limit', function () {
  const graph = new Graph();
  graph.addEdge('a', 'b');
  graph.addEdge('a', 'c');
  graph.addEdge('b', 'd');
  graph.addEdge('c', 'd');
  graph.addEdge('d', 'e');
  assert.deepStrictEqual(graph.breadthFirst('a', 2), [
    { vertex: 'b', distance: 1 },
    { vertex: 'c', distance: 1 },
    { vertex: 'd', distance: 2 }
  ]);
  assert.strictEqual(graph.breadthFirst('a', 3).length, 4);
  assert.deepStrictEqual(graph.breadthFirst('zzz', 2), []);
});

console.log('\nSearching');
test('linear search returns every match', function () {
  const result = search.linearSearch([1, 2, 3, 4, 5, 6], function (n) { return n % 2 === 0; });
  assert.deepStrictEqual(result.results, [2, 4, 6]);
  assert.strictEqual(result.comparisons, 6);
});
test('binary search finds present keys and rejects missing ones', function () {
  const sorted = [3, 8, 15, 23, 42, 57, 91];
  for (let i = 0; i < sorted.length; i++) {
    assert.strictEqual(search.binarySearch(sorted, sorted[i], same).index, i);
  }
  assert.strictEqual(search.binarySearch(sorted, 50, same).index, -1);
  assert.strictEqual(search.binarySearch([], 50, same).index, -1);
  assert.ok(search.binarySearch(sorted, 91, same).comparisons <= 3);
});
test('lowerBound and upperBound mark the ends of a range', function () {
  const sorted = [100, 200, 200, 300, 500, 500, 900];
  assert.strictEqual(search.lowerBound(sorted, 200, same).index, 1);
  assert.strictEqual(search.upperBound(sorted, 200, same).index, 3);
  assert.strictEqual(search.lowerBound(sorted, 0, same).index, 0);
  assert.strictEqual(search.upperBound(sorted, 5000, same).index, 7);
  assert.strictEqual(search.lowerBound(sorted, 450, same).index, 4);
  assert.strictEqual(search.upperBound(sorted, 450, same).index, 4);
});

console.log('\nSorting');
['mergeSort', 'quickSort', 'bubbleSort'].forEach(function (name) {
  test(name + ' matches the built-in sort on many random arrays', function () {
    let seed = 12345;
    function random() {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    }
    for (let round = 0; round < 200; round++) {
      const length = Math.floor(random() * 40);
      const input = [];
      for (let i = 0; i < length; i++) input.push(Math.floor(random() * 50));
      const copy = input.slice();
      const result = sort[name](input, byNumber);
      assert.deepStrictEqual(result.sorted, input.slice().sort(byNumber));
      assert.deepStrictEqual(input, copy, 'the input array must not be changed');
    }
    assert.deepStrictEqual(sort[name]([], byNumber).sorted, []);
    assert.deepStrictEqual(sort[name]([7], byNumber).sorted, [7]);
  });
});
test('merge sort is stable', function () {
  const items = [{ k: 2, tag: 'a' }, { k: 1, tag: 'b' }, { k: 2, tag: 'c' }, { k: 1, tag: 'd' }];
  const sorted = sort.mergeSort(items, function (a, b) { return a.k - b.k; }).sorted;
  assert.deepStrictEqual(sorted.map(function (i) { return i.tag; }), ['b', 'd', 'a', 'c']);
});
test('bubble sort needs more comparisons than merge sort on shuffled data', function () {
  const input = [];
  for (let i = 0; i < 36; i++) input.push((i * 17) % 36);
  assert.ok(sort.bubbleSort(input, byNumber).comparisons > sort.mergeSort(input, byNumber).comparisons);
});

console.log('\nShop data');
test('product IDs are unique and every product has a real category', function () {
  const seen = new HashTable();
  const categoryIds = data.categories.map(function (row) { return row[1]; });
  data.products.forEach(function (product) {
    assert.strictEqual(seen.has(product.id), false, 'duplicate ID ' + product.id);
    seen.set(product.id, true);
    assert.ok(categoryIds.indexOf(product.category) !== -1, 'unknown category ' + product.category);
    assert.ok(product.price > 0 && product.rating > 0 && product.rating <= 5);
  });
  data.related.forEach(function (pair) {
    assert.ok(seen.has(pair[0]) && seen.has(pair[1]), 'edge uses an unknown product: ' + pair);
  });
});

console.log('\nStore: browsing');
const allOptions = { query: '', categoryId: 'all', priceRange: 'any', sortBy: 'featured', algorithm: 'merge' };
function options(changes) {
  return Object.assign({}, allOptions, changes);
}
test('shows the whole catalogue in catalogue order by default', function () {
  const store = new Store(data);
  const result = store.findProducts(allOptions);
  assert.strictEqual(result.products.length, data.products.length);
  assert.strictEqual(result.products[0].id, data.products[0].id);
});
test('keyword search matches name, brand and tags', function () {
  const store = new Store(data);
  const mice = store.findProducts(options({ query: 'mouse' })).products;
  assert.ok(mice.length >= 3);
  mice.forEach(function (p) { assert.ok(/mouse/i.test(p.name + p.tags)); });
  assert.strictEqual(store.findProducts(options({ query: 'KITE keyboard' })).products.length, 2);
  assert.strictEqual(store.findProducts(options({ query: 'zzzz' })).products.length, 0);
});
test('category filter includes sub-categories', function () {
  const store = new Store(data);
  const computers = store.findProducts(options({ categoryId: 'computers' })).products;
  const expected = data.products.filter(function (p) { return ['laptops', 'monitors', 'storage'].indexOf(p.category) !== -1; });
  assert.strictEqual(computers.length, expected.length);
  assert.strictEqual(store.findProducts(options({ categoryId: 'laptops' })).products.length, 3);
});
test('price ranges match a plain filter of the data', function () {
  const store = new Store(data);
  Object.keys(Store.PRICE_RANGES).forEach(function (key) {
    const range = Store.PRICE_RANGES[key];
    const expected = data.products.filter(function (p) { return p.price >= range.min && p.price <= range.max; });
    const actual = store.findProducts(options({ priceRange: key })).products;
    assert.deepStrictEqual(actual.map(function (p) { return p.id; }), expected.map(function (p) { return p.id; }), key);
  });
});
test('every sort order and algorithm gives a correctly ordered list', function () {
  const store = new Store(data);
  Object.keys(Store.ALGORITHMS).forEach(function (algorithm) {
    const low = store.findProducts(options({ sortBy: 'price-low', algorithm: algorithm })).products;
    const high = store.findProducts(options({ sortBy: 'price-high', algorithm: algorithm })).products;
    const rating = store.findProducts(options({ sortBy: 'rating', algorithm: algorithm })).products;
    const name = store.findProducts(options({ sortBy: 'name', algorithm: algorithm })).products;
    for (let i = 1; i < low.length; i++) {
      assert.ok(low[i - 1].price <= low[i].price);
      assert.ok(high[i - 1].price >= high[i].price);
      assert.ok(rating[i - 1].rating >= rating[i].rating);
      assert.ok(name[i - 1].name.toLowerCase() <= name[i].name.toLowerCase());
    }
    assert.strictEqual(low.length, data.products.length);
  });
});
test('a number is looked up as a product ID, with suggestions when missing', function () {
  const store = new Store(data);
  const found = store.findProducts(options({ query: '4821', categoryId: 'audio' }));
  assert.strictEqual(found.mode, 'id');
  assert.strictEqual(found.products[0].name, 'AeroBook 14 Laptop');
  const missing = store.findProducts(options({ query: '4800' }));
  assert.strictEqual(missing.products.length, 0);
  assert.deepStrictEqual(missing.suggestions.map(function (p) { return p.id; }), [4486, 4821]);
});
test('the ID tree holds every product and stays shallow', function () {
  const store = new Store(data);
  const ids = store.idTree.inOrder().map(function (e) { return e.key; });
  assert.deepStrictEqual(ids, data.products.map(function (p) { return p.id; }).sort(byNumber));
  assert.ok(store.idTree.height() <= 9, 'height was ' + store.idTree.height());
});
test('a laptop is related to a bag, mouse, keyboard and cooling pad', function () {
  const store = new Store(data);
  const view = store.openProduct(4821);
  const names = view.related.map(function (p) { return p.name; }).join(' | ');
  ['Laptop Bag', 'Mouse', 'Keyboard', 'Cooling Pad'].forEach(function (word) {
    assert.ok(names.indexOf(word) !== -1, word + ' missing from: ' + names);
  });
  view.alsoLiked.forEach(function (p) {
    assert.ok(view.related.indexOf(p) === -1 && p.id !== 4821);
  });
  assert.strictEqual(store.openProduct(1), null);
});
test('every product has at least one related product', function () {
  const store = new Store(data);
  data.products.forEach(function (p) {
    assert.ok(store.related.neighbours(p.id).length > 0, p.name + ' has no related products');
  });
});

console.log('\nStore: cart and undo');
function cartSummary(store) {
  return store.cartItems().map(function (item) { return item.product.id + 'x' + item.quantity; }).join(' ');
}
test('adding the same product twice raises its quantity', function () {
  const store = new Store(data);
  store.addToCart(4821);
  store.addToCart(5332);
  store.addToCart(4821);
  assert.strictEqual(cartSummary(store), '4821x2 5332x1');
  assert.strictEqual(store.cartCount(), 3);
  assert.strictEqual(store.cartTotal(), 54990 * 2 + 699);
  assert.strictEqual(store.addToCart(999999), false);
});
test('quantity cannot go above the limit', function () {
  const store = new Store(data);
  for (let i = 0; i < 25; i++) store.addToCart(5332);
  assert.strictEqual(store.cartEntry(5332).quantity, Store.MAX_QUANTITY);
  assert.strictEqual(store.undoStack.size(), Store.MAX_QUANTITY);
});
test('undo reverses adds, removals and quantity changes in reverse order', function () {
  const store = new Store(data);
  store.addToCart(4821); // 4821x1
  store.addToCart(5332); // 4821x1 5332x1
  store.addToCart(7726); // 4821x1 5332x1 7726x1
  store.addToCart(5332); // 5332x2
  store.removeFromCart(5332); // 4821x1 7726x1
  store.decreaseQuantity(7726); // quantity 1 -> removed: 4821x1
  assert.strictEqual(cartSummary(store), '4821x1');

  assert.strictEqual(store.peekUndo(), 'remove Kite Mechanical Keyboard');
  store.undo();
  assert.strictEqual(cartSummary(store), '4821x1 7726x1');
  store.undo(); // the mouse returns to its old position, with quantity 2
  assert.strictEqual(cartSummary(store), '4821x1 5332x2 7726x1');
  store.undo();
  assert.strictEqual(cartSummary(store), '4821x1 5332x1 7726x1');
  store.undo();
  store.undo();
  store.undo();
  assert.strictEqual(cartSummary(store), '');
  assert.strictEqual(store.undo(), null);
  assert.strictEqual(store.peekUndo(), null);
});
test('undo restores a decreased quantity', function () {
  const store = new Store(data);
  store.addToCart(2874);
  store.addToCart(2874);
  store.addToCart(2874);
  store.decreaseQuantity(2874);
  assert.strictEqual(cartSummary(store), '2874x2');
  store.undo();
  assert.strictEqual(cartSummary(store), '2874x3');
});

console.log('\nStore: orders');
test('orders are dispatched first in, first out and can be tracked', function () {
  const store = new Store(data);
  assert.strictEqual(store.placeOrder(), null);
  assert.strictEqual(store.dispatchNext(), null);

  store.addToCart(4821);
  store.addToCart(6610);
  const first = store.placeOrder();
  assert.strictEqual(first.id, 'ORD-1001');
  assert.strictEqual(first.total, 54990 + 1499);
  assert.strictEqual(store.cart.isEmpty(), true);
  assert.strictEqual(store.peekUndo(), null);

  store.addToCart(5332);
  const second = store.placeOrder();
  store.addToCart(7726);
  const third = store.placeOrder();
  assert.deepStrictEqual(store.waitingOrders().map(function (o) { return o.id; }), ['ORD-1001', 'ORD-1002', 'ORD-1003']);

  assert.strictEqual(store.trackOrder('ord-1003').ahead, 2);
  assert.strictEqual(store.trackOrder('1002').order, second);
  assert.strictEqual(store.trackOrder('ORD-9999').found, false);

  assert.strictEqual(store.dispatchNext(), first);
  assert.strictEqual(first.status, 'Dispatched');
  assert.strictEqual(store.trackOrder('ORD-1003').ahead, 1);
  assert.strictEqual(store.dispatchNext(), second);
  assert.strictEqual(store.dispatchNext(), third);
  assert.strictEqual(store.dispatchNext(), null);
  assert.deepStrictEqual(store.dispatched.map(function (o) { return o.id; }), ['ORD-1003', 'ORD-1002', 'ORD-1001']);
});
test('changing the cart after an order does not change the order', function () {
  const store = new Store(data);
  store.addToCart(5332);
  const order = store.placeOrder();
  store.addToCart(5332);
  store.addToCart(5332);
  assert.strictEqual(order.items[0].quantity, 1);
  assert.strictEqual(order.total, 699);
});
test('actions record notes for the activity bar', function () {
  const store = new Store(data);
  store.takeSteps();
  store.findProducts(options({ query: 'mouse', categoryId: 'accessories', priceRange: 'under-1000', sortBy: 'price-low' }));
  const structures = store.takeSteps().map(function (s) { return s.structure; });
  assert.deepStrictEqual(structures, ['Category tree', 'Binary search', 'Linear search', 'Merge sort']);
  assert.deepStrictEqual(store.takeSteps(), []);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed\n');
process.exit(failed === 0 ? 0 : 1);
