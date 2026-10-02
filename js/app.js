/*
 * APP
 * ---
 * Draws the page and reacts to clicks. All shop logic lives in js/store.js;
 * this file only asks the store for data and turns it into HTML.
 */
(function () {
  'use strict';

  const store = new Store(ShopData);

  const state = {
    view: 'shop',
    query: '',
    categoryId: 'all',
    priceRange: 'any',
    sortBy: 'featured',
    algorithm: 'merge',
    result: null, // latest product list from the store
    bstPath: [], // IDs visited by the latest product-ID search
    lastBucket: null, // bucket used by the latest product lookup
    tracked: null, // latest "track an order" answer
    trace: [], // activity history, newest first
    traceOpen: false
  };

  /* ---------- small helpers ---------- */

  function $(id) {
    return document.getElementById(id);
  }

  function append(parent, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      for (let i = 0; i < child.length; i++) append(parent, child[i]);
    } else if (typeof child === 'string' || typeof child === 'number') {
      parent.appendChild(document.createTextNode(String(child)));
    } else {
      parent.appendChild(child);
    }
  }

  function setProps(element, props) {
    for (const key in props) {
      const value = props[key];
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') element.setAttribute('class', value);
      else if (key === 'html') element.innerHTML = value; // only used for our own icon markup
      else element.setAttribute(key, value === true ? '' : String(value));
    }
  }

  /* Build an HTML element: h('button', { class: 'x' }, 'Label') */
  function h(tag, props) {
    const element = document.createElement(tag);
    if (props) setProps(element, props);
    for (let i = 2; i < arguments.length; i++) append(element, arguments[i]);
    return element;
  }

  /* Build an SVG element. */
  function svg(tag, props) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (props) setProps(element, props);
    for (let i = 2; i < arguments.length; i++) append(element, arguments[i]);
    return element;
  }

  function clear(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function money(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  }

  function plural(count, word) {
    return count + ' ' + word + (count === 1 ? '' : 's');
  }

  function clock(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function announce(text) {
    $('announcer').textContent = text;
  }

  /* Re-draw something, then put keyboard focus back on the same control. */
  function keepFocus(draw) {
    const active = document.activeElement;
    const key = active && active.getAttribute ? active.getAttribute('data-key') : null;
    draw();
    if (key === null) return;
    const again = document.querySelector('[data-key="' + key + '"]');
    if (again && !again.disabled) {
      again.focus();
      return;
    }
    // The control is gone or switched off (for example the last item was
    // removed). Move focus somewhere sensible instead of losing it.
    if (state.view !== 'shop') $('main').focus({ preventScroll: true });
    else if (!$('undo-button').disabled) $('undo-button').focus();
    else $('cart').focus({ preventScroll: true });
  }

  /* Collect the notes the store made during the last action. */
  function logAction(title) {
    const steps = store.takeSteps();
    if (steps.length === 0) return;
    state.trace.unshift({ title: title, steps: steps });
    if (state.trace.length > 12) state.trace.pop();
    renderTrace();
  }

  /* A barcode drawn from the product ID (EAN-style bar patterns). */
  const BAR_PATTERNS = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];

  function barcode(id) {
    const digits = String(id);
    let bits = '101';
    for (let i = 0; i < digits.length; i++) bits += BAR_PATTERNS[Number(digits[i])];
    bits += '101';

    const picture = svg('svg', { viewBox: '0 0 ' + bits.length + ' 10', width: bits.length * 2, height: 22, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] === '1') picture.appendChild(svg('rect', { x: i, y: 0, width: 1, height: 10, fill: 'currentColor' }));
    }
    return picture;
  }

  function ratingLine(product) {
    return h(
      'span',
      { class: 'rating', role: 'img', 'aria-label': 'Rated ' + product.rating.toFixed(1) + ' out of 5 by ' + product.ratings.toLocaleString('en-IN') + ' shoppers' },
      h('span', { class: 'rating-star', 'aria-hidden': 'true' }, '★'),
      h('span', { 'aria-hidden': 'true' }, ' ' + product.rating.toFixed(1)),
      h('span', { class: 'rating-count', 'aria-hidden': 'true' }, ' (' + product.ratings.toLocaleString('en-IN') + ')')
    );
  }

  /* ---------- categories (tree) ---------- */

  function categoryItem(node) {
    const item = h('li', null);
    item.appendChild(
      h(
        'button',
        { type: 'button', class: 'tree-item', 'data-action': 'category', 'data-id': node.id, 'data-key': 'category-' + node.id, 'aria-current': node.id === state.categoryId ? 'true' : null },
        h('span', { class: 'tree-name' }, node.name),
        h('span', { class: 'tree-count' }, store.categories.countProducts(node))
      )
    );
    if (node.children.length > 0) {
      const list = h('ul', null);
      for (let i = 0; i < node.children.length; i++) list.appendChild(categoryItem(node.children[i]));
      item.appendChild(list);
    }
    return item;
  }

  function renderCategories() {
    const tree = $('category-tree');
    clear(tree);
    tree.appendChild(categoryItem(store.categories.root));
  }

  /* ---------- product list ---------- */

  function fillSelect(select, options, selected) {
    clear(select);
    Object.keys(options).forEach(function (key) {
      select.appendChild(h('option', { value: key, selected: key === selected }, options[key].label));
    });
  }

  function productCard(product) {
    return h(
      'li',
      { class: 'label' },
      h(
        'div',
        { class: 'label-top' },
        h('span', { class: 'label-icon', html: ShopIcons.icon(product.icon) }),
        ratingLine(product)
      ),
      h('h3', { class: 'label-name' }, h('button', { type: 'button', 'data-action': 'open', 'data-id': product.id, 'data-key': 'open-' + product.id }, product.name)),
      h('p', { class: 'label-specs' }, product.specs),
      h(
        'div',
        { class: 'label-strip' },
        h('span', { class: 'label-code' }, barcode(product.id), h('span', { class: 'label-id' }, h('span', { class: 'visually-hidden' }, 'Product ID '), product.id)),
        h('span', { class: 'price' }, money(product.price))
      ),
      h(
        'div',
        { class: 'label-action' },
        h('button', { type: 'button', class: 'button dark', 'data-action': 'add', 'data-id': product.id, 'data-key': 'add-' + product.id, 'aria-label': 'Add ' + product.name + ' to cart' }, 'Add to cart'),
        h('span', { class: 'in-cart', 'data-in-cart': product.id, hidden: true })
      )
    );
  }

  function describeFilters() {
    const parts = [];
    if (state.query.trim() !== '') parts.push('matching "' + state.query.trim() + '"');
    if (state.categoryId !== 'all') parts.push('in ' + store.categories.find(state.categoryId).name);
    if (state.priceRange !== 'any') parts.push('priced ' + Store.PRICE_RANGES[state.priceRange].label.toLowerCase());
    return parts.join(', ');
  }

  function renderResults() {
    const result = state.result;
    const heading = $('results-heading');
    const grid = $('product-grid');
    const empty = $('results-empty');
    clear(heading);
    clear(grid);
    clear(empty);

    if (result.mode === 'id') {
      heading.appendChild(h('p', { class: 'crumbs' }, h('span', { class: 'crumb-current' }, 'Product ID ' + result.id)));
      heading.appendChild(h('p', { class: 'results-count' }, result.products.length === 1 ? 'Found in the binary search tree' : 'No match'));
    } else {
      const crumbs = store.breadcrumb(state.categoryId);
      const path = h('nav', { class: 'crumbs', 'aria-label': 'Category path' });
      crumbs.forEach(function (crumb, index) {
        if (index > 0) path.appendChild(h('span', { class: 'crumb-separator', 'aria-hidden': 'true' }, '/'));
        if (index === crumbs.length - 1) path.appendChild(h('span', { class: 'crumb-current', 'aria-current': 'true' }, crumb.name));
        else path.appendChild(h('button', { type: 'button', class: 'crumb', 'data-action': 'category', 'data-id': crumb.id }, crumb.name));
      });
      heading.appendChild(path);

      let count = plural(result.products.length, 'product');
      if (state.query.trim() !== '') count += ' for "' + state.query.trim() + '"';
      heading.appendChild(h('p', { class: 'results-count' }, count));
    }

    for (let i = 0; i < result.products.length; i++) grid.appendChild(productCard(result.products[i]));
    grid.hidden = result.products.length === 0;
    empty.hidden = result.products.length !== 0;

    if (result.products.length === 0 && result.mode === 'id') {
      empty.appendChild(h('h3', null, 'No product has ID ' + result.id));
      if (result.suggestions.length > 0) {
        empty.appendChild(h('p', null, 'The closest IDs in the tree are:'));
        const list = h('ul', { class: 'suggestions' });
        result.suggestions.forEach(function (product) {
          list.appendChild(h('li', null, h('button', { type: 'button', class: 'button', 'data-action': 'find-id', 'data-id': product.id }, product.id + ' ' + product.name)));
        });
        empty.appendChild(list);
      }
    } else if (result.products.length === 0) {
      empty.appendChild(h('h3', null, 'No products ' + describeFilters()));
      empty.appendChild(h('p', null, 'Try a shorter search, another category or a wider price range.'));
      empty.appendChild(h('button', { type: 'button', class: 'button', 'data-action': 'clear-filters' }, 'Clear search and filters'));
    }

    updateInCartBadges();
  }

  function refreshProducts(title) {
    state.result = store.findProducts(state);
    state.bstPath = state.result.mode === 'id' ? state.result.path : [];
    logAction(title);
    renderResults();
  }

  /* "2 in cart" notes on product cards and in the product dialog. */
  function updateInCartBadges() {
    const badges = document.querySelectorAll('[data-in-cart]');
    for (let i = 0; i < badges.length; i++) {
      const entry = store.cartEntry(Number(badges[i].getAttribute('data-in-cart')));
      badges[i].hidden = entry === null;
      badges[i].textContent = entry === null ? '' : entry.quantity + ' in cart';
    }
  }

  /* ---------- cart (linked list) and undo (stack) ---------- */

  function chainPiece(className, text) {
    return h('span', { class: className }, text);
  }

  function renderCart() {
    const items = store.cartItems();
    $('cart-count').textContent = store.cartCount();

    // The linked list itself: head -> node -> node -> null
    const chain = $('cart-chain');
    clear(chain);
    chain.setAttribute('role', 'img');
    chain.setAttribute('aria-label', 'Linked list: head, ' + items.map(function (item) { return item.product.name; }).concat(['null']).join(', '));
    chain.appendChild(chainPiece('chain-pointer', 'head'));
    items.forEach(function (item) {
      chain.appendChild(chainPiece('chain-arrow', '→'));
      chain.appendChild(h('span', { class: 'chain-node' }, h('span', { class: 'chain-node-name' }, item.product.name), h('span', { class: 'chain-node-count' }, '×' + item.quantity)));
    });
    chain.appendChild(chainPiece('chain-arrow', '→'));
    chain.appendChild(chainPiece('chain-pointer', 'null'));

    const list = $('cart-items');
    clear(list);
    items.forEach(function (item) {
      const id = item.product.id;
      list.appendChild(
        h(
          'li',
          { class: 'cart-item' },
          h(
            'div',
            { class: 'cart-item-main' },
            h('button', { type: 'button', class: 'cart-item-name', 'data-action': 'open', 'data-id': id, 'data-key': 'cart-open-' + id }, item.product.name),
            h('span', { class: 'cart-item-total' }, money(item.lineTotal))
          ),
          h(
            'div',
            { class: 'cart-item-controls' },
            h(
              'div',
              { class: 'stepper', role: 'group', 'aria-label': 'Quantity of ' + item.product.name },
              h('button', { type: 'button', 'data-action': 'minus', 'data-id': id, 'data-key': 'minus-' + id, 'aria-label': 'Decrease quantity' }, '−'),
              h('span', { class: 'stepper-value', 'aria-live': 'polite' }, item.quantity),
              h('button', { type: 'button', 'data-action': 'plus', 'data-id': id, 'data-key': 'plus-' + id, 'aria-label': 'Increase quantity', disabled: item.quantity >= Store.MAX_QUANTITY }, '+')
            ),
            h('span', { class: 'cart-item-unit' }, money(item.product.price) + ' each'),
            h('button', { type: 'button', class: 'link-button danger', 'data-action': 'remove', 'data-id': id, 'data-key': 'remove-' + id, 'aria-label': 'Remove ' + item.product.name }, 'Remove')
          )
        )
      );
    });

    $('cart-empty').hidden = items.length > 0;
    $('cart-total').hidden = items.length === 0;
    $('cart-total-amount').textContent = money(store.cartTotal());
    $('place-order').disabled = items.length === 0;

    // The undo stack, newest change on top.
    const history = store.undoHistory();
    $('undo-button').disabled = history.length === 0;
    $('undo-next').textContent = history.length === 0 ? 'Nothing to undo yet.' : 'Next undo: ' + history[0];

    const pile = $('undo-pile');
    clear(pile);
    history.slice(0, 4).forEach(function (label, index) {
      pile.appendChild(h('li', { class: index === 0 ? 'pile-item pile-top' : 'pile-item' }, index === 0 ? h('span', { class: 'pile-tag' }, 'top') : null, label));
    });
    if (history.length > 4) pile.appendChild(h('li', { class: 'pile-more' }, plural(history.length - 4, 'older change') + ' below'));

    updateInCartBadges();
  }

  /* ---------- orders (queue + hash table) ---------- */

  function orderSummary(order) {
    return order.items
      .map(function (item) { return item.name + (item.quantity > 1 ? ' ×' + item.quantity : ''); })
      .join(', ');
  }

  function renderOrders() {
    const waiting = store.waitingOrders();

    const tabCount = $('orders-count');
    tabCount.hidden = waiting.length === 0;
    tabCount.textContent = waiting.length;
    tabCount.setAttribute('aria-label', plural(waiting.length, 'order') + ' waiting');

    const lane = $('queue-lane');
    clear(lane);
    lane.hidden = waiting.length === 0;
    if (waiting.length > 0) {
      lane.appendChild(h('span', { class: 'lane-end' }, 'front'));
      const tickets = h('ol', { class: 'tickets' });
      waiting.forEach(function (order, index) {
        tickets.appendChild(
          h(
            'li',
            { class: index === 0 ? 'ticket ticket-next' : 'ticket' },
            h('strong', null, order.id),
            h('span', null, plural(order.itemCount, 'item') + ', ' + money(order.total)),
            h('span', { class: 'ticket-time' }, 'Placed ' + clock(order.placedAt))
          )
        );
      });
      lane.appendChild(tickets);
      lane.appendChild(h('span', { class: 'lane-end' }, 'rear'));
    }
    $('queue-empty').hidden = waiting.length > 0;
    $('dispatch-button').disabled = waiting.length === 0;

    const done = $('dispatched-list');
    clear(done);
    store.dispatched.forEach(function (order) {
      done.appendChild(
        h(
          'li',
          { class: 'order-row' },
          h('div', { class: 'order-row-head' }, h('strong', null, order.id), h('span', { class: 'status status-done' }, 'Dispatched ' + clock(order.dispatchedAt))),
          h('p', null, orderSummary(order)),
          h('p', { class: 'order-row-total' }, money(order.total))
        )
      );
    });
    $('dispatched-empty').hidden = store.dispatched.length > 0;

    renderTracked();
  }

  function renderTracked() {
    const box = $('track-result');
    clear(box);
    const tracked = state.tracked;
    if (tracked === null) return;

    if (!tracked.found) {
      box.appendChild(h('p', { class: 'track-missing' }, 'No order has the ID ' + tracked.id + '. Order IDs look like ORD-1001 and are shown when you place an order.'));
      return;
    }

    const order = tracked.order;
    let status;
    if (order.status === 'Dispatched') status = 'Dispatched at ' + clock(order.dispatchedAt);
    else if (tracked.ahead === 0) status = 'Waiting, next to be dispatched';
    else status = 'Waiting, ' + plural(tracked.ahead, 'order') + ' ahead of it';

    const lines = h('ul', { class: 'track-items' });
    order.items.forEach(function (item) {
      lines.appendChild(h('li', null, h('span', null, item.name + ' ×' + item.quantity), h('span', null, money(item.price * item.quantity))));
    });

    box.appendChild(
      h(
        'div',
        { class: 'track-card' },
        h('div', { class: 'order-row-head' }, h('strong', null, order.id), h('span', { class: order.status === 'Dispatched' ? 'status status-done' : 'status' }, status)),
        lines,
        h('p', { class: 'order-row-total' }, 'Total ' + money(order.total))
      )
    );
  }

  /* ---------- how it works ---------- */

  function codeLink(file) {
    return h('a', { href: 'js/' + file }, 'js/' + file);
  }

  function renderHow() {
    const stats = store.stats();
    const rows = [
      ['Array', 'Holds the product catalogue in order. Every product list starts from it.', plural(stats.products, 'product'), 'data.js'],
      ['Linear search', 'Checks every product for the words you type in the search box.', 'Up to ' + plural(stats.products, 'comparison') + ' per search', 'dsa/search.js'],
      ['Binary search', 'Finds the two ends of a price range in the price-sorted array.', 'About ' + Math.ceil(Math.log2(stats.products + 1)) * 2 + ' comparisons per range', 'dsa/search.js'],
      ['Sorting', 'Merge sort, quick sort and bubble sort order the list by price, rating or name.', 'Using ' + Store.ALGORITHMS[state.algorithm].label.toLowerCase(), 'dsa/sort.js'],
      ['Linked list', 'The cart. Each item points to the next, so items are added and removed without shifting the rest.', plural(stats.cartNodes, 'node'), 'dsa/linked-list.js'],
      ['Stack', 'Undo. The newest cart change is on top and is reversed first.', plural(stats.undoSize, 'change') + ' stored', 'dsa/stack.js'],
      ['Queue', 'Order processing. The order that has waited longest is dispatched first.', stats.waiting + ' waiting, ' + stats.dispatched + ' dispatched', 'dsa/queue.js'],
      ['Tree', 'Product categories. Choosing a category collects every product below it.', stats.categories + ' categories, ' + stats.categoryHeight + ' levels deep', 'dsa/category-tree.js'],
      ['Binary search tree', 'Product-ID search, with the closest IDs suggested when there is no match.', stats.bstNodes + ' nodes, height ' + stats.bstHeight, 'dsa/bst.js'],
      ['Graph', 'Related products. An edge joins two products that are bought together.', stats.graphVertices + ' products, ' + stats.graphEdges + ' edges', 'dsa/graph.js'],
      ['Hash table', 'Instant lookup of a product or an order by its ID.', stats.products + ' products and ' + plural(stats.orderKeys, 'order') + ' stored', 'dsa/hash-table.js']
    ];

    const body = $('how-rows');
    clear(body);
    rows.forEach(function (row) {
      body.appendChild(
        h(
          'tr',
          null,
          h('th', { scope: 'row' }, row[0]),
          h('td', { 'data-label': 'What it does' }, row[1]),
          h('td', { 'data-label': 'Right now' }, row[2]),
          h('td', { 'data-label': 'Code' }, codeLink(row[3]))
        )
      );
    });

    renderBst(stats);
    renderHash(stats);
  }

  function renderBst(stats) {
    const placed = [];
    let column = 0;

    // In-order walk: the left subtree is placed first, so x follows key order.
    function place(node, depth) {
      if (node === null) return null;
      const left = place(node.left, depth + 1);
      const spot = { key: node.key, name: node.value.name, x: 24 + column * 35, y: 20 + depth * 52, left: left, right: null };
      column += 1;
      spot.right = place(node.right, depth + 1);
      placed.push(spot);
      return spot;
    }
    place(store.idTree.root, 0);

    const onPath = {};
    state.bstPath.forEach(function (key) { onPath[key] = true; });

    const width = 48 + (column - 1) * 35;
    const height = 40 + stats.bstHeight * 52;
    const picture = svg('svg', { viewBox: '0 0 ' + width + ' ' + height, width: width, height: height, role: 'img', 'aria-label': 'Binary search tree of ' + stats.bstNodes + ' product IDs, height ' + stats.bstHeight });

    placed.forEach(function (spot) {
      [spot.left, spot.right].forEach(function (child) {
        if (child === null) return;
        picture.appendChild(svg('line', { x1: spot.x, y1: spot.y, x2: child.x, y2: child.y, class: onPath[spot.key] && onPath[child.key] ? 'bst-edge bst-on-path' : 'bst-edge' }));
      });
    });
    placed.forEach(function (spot) {
      const group = svg('g', { class: onPath[spot.key] ? 'bst-node bst-on-path' : 'bst-node' });
      group.appendChild(svg('title', null, spot.key + ': ' + spot.name));
      group.appendChild(svg('rect', { x: spot.x - 16, y: spot.y - 10, width: 32, height: 20, rx: 3 }));
      group.appendChild(svg('text', { x: spot.x, y: spot.y + 4, 'text-anchor': 'middle' }, spot.key));
      picture.appendChild(group);
    });

    const figure = $('bst-figure');
    clear(figure);
    figure.appendChild(picture);

    $('bst-caption').textContent =
      state.bstPath.length > 0
        ? 'Smaller IDs go left, larger IDs go right. The highlighted path is your last ID search: ' + state.bstPath.join(' → ') + '.'
        : 'Smaller IDs go left, larger IDs go right. Type a product ID such as 5907 in the search box, then come back to see the path it took.';
  }

  function renderHash(stats) {
    const sizes = store.productsById.bucketSizes();
    const figure = $('hash-figure');
    clear(figure);
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', stats.products + ' products spread over ' + stats.productBuckets + ' buckets');

    sizes.forEach(function (size, index) {
      const bucket = h('span', { class: index === state.lastBucket ? 'bucket bucket-last' : 'bucket', title: 'Bucket ' + index + ': ' + plural(size, 'product') }, h('span', { class: 'bucket-index' }, index));
      for (let i = 0; i < size; i++) bucket.appendChild(h('span', { class: 'bucket-dot' }));
      figure.appendChild(bucket);
    });

    let caption = stats.products + ' products in ' + stats.productBuckets + ' buckets. Load factor ' + stats.productLoad.toFixed(2) + ', longest chain ' + stats.productLongestChain + '. Each dot is one product.';
    if (state.lastBucket !== null) caption += ' The outlined bucket is the one used for the last product you opened.';
    $('hash-caption').textContent = caption;
  }

  /* ---------- product dialog (hash table + graph) ---------- */

  function relatedFan(product, related) {
    const rowHeight = 52;
    const height = related.length * rowHeight - 8;
    const lines = svg('svg', { class: 'fan-lines ds', viewBox: '0 0 40 ' + height, width: 40, height: height, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' });
    related.forEach(function (item, index) {
      const y = index * rowHeight + 22;
      lines.appendChild(svg('path', { d: 'M0 ' + height / 2 + ' C 22 ' + height / 2 + ', 18 ' + y + ', 40 ' + y }));
    });

    const list = h('ul', { class: 'fan-list' });
    related.forEach(function (item) {
      list.appendChild(
        h(
          'li',
          { class: 'fan-row' },
          h('button', { type: 'button', class: 'fan-open', 'data-action': 'open', 'data-id': item.id, 'data-key': 'dialog-open-' + item.id }, h('span', { class: 'fan-name' }, item.name), h('span', { class: 'fan-price' }, money(item.price))),
          h('button', { type: 'button', class: 'button small', 'data-action': 'add', 'data-id': item.id, 'data-key': 'dialog-add-' + item.id, 'aria-label': 'Add ' + item.name + ' to cart' }, 'Add')
        )
      );
    });

    return h('div', { class: 'fan' }, h('div', { class: 'fan-source ds' }, product.name), lines, list);
  }

  function openProduct(id) {
    const view = store.openProduct(id);
    if (view === null) return;
    state.lastBucket = store.productsById.hash(id);
    logAction('Opened ' + view.product.name);

    const product = view.product;
    const body = $('dialog-body');
    clear(body);

    body.appendChild(
      h(
        'div',
        { class: 'dialog-main' },
        h('span', { class: 'dialog-icon', html: ShopIcons.icon(product.icon) }),
        h('p', { class: 'dialog-path' }, store.breadcrumb(product.category).map(function (crumb) { return crumb.name; }).slice(1).join(' / ')),
        h('h2', { id: 'dialog-title', tabindex: '-1' }, product.name),
        h('p', { class: 'dialog-specs' }, product.specs),
        ratingLine(product),
        h(
          'div',
          { class: 'label-strip dialog-strip' },
          h('span', { class: 'label-code' }, barcode(product.id), h('span', { class: 'label-id' }, h('span', { class: 'visually-hidden' }, 'Product ID '), product.id)),
          h('span', { class: 'price' }, money(product.price))
        ),
        h(
          'div',
          { class: 'label-action' },
          h('button', { type: 'button', class: 'button dark', 'data-action': 'add', 'data-id': product.id, 'data-key': 'dialog-add-' + product.id }, 'Add to cart'),
          h('span', { class: 'in-cart', 'data-in-cart': product.id, hidden: true })
        ),
        h('p', { class: 'dialog-lookup ds' }, 'Found in the hash table: bucket ' + view.lookup.bucket + ', ' + plural(view.lookup.steps, 'check') + '.')
      )
    );

    const side = h('div', { class: 'dialog-related' });
    side.appendChild(h('div', { class: 'panel-title' }, h('h3', null, 'Bought together'), h('span', { class: 'ds-chip ds' }, 'Graph')));
    side.appendChild(h('p', { class: 'panel-text ds' }, 'Each line is an edge from this product to a related one.'));
    side.appendChild(relatedFan(product, view.related));

    if (view.alsoLiked.length > 0) {
      side.appendChild(h('h3', { class: 'also-title' }, 'You may also like'));
      side.appendChild(h('p', { class: 'panel-text ds' }, 'Two edges away, found by breadth-first search.'));
      const also = h('ul', { class: 'also-list' });
      view.alsoLiked.forEach(function (item) {
        also.appendChild(h('li', null, h('button', { type: 'button', class: 'button small', 'data-action': 'open', 'data-id': item.id, 'data-key': 'dialog-also-' + item.id }, item.name)));
      });
      side.appendChild(also);
    }
    body.appendChild(side);

    const dialog = $('product-dialog');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    $('dialog-title').focus();
    updateInCartBadges();
    if (state.view === 'how') renderHow();
  }

  /* ---------- activity bar ---------- */

  function stepItem(step) {
    return h('li', null, h('span', { class: 'trace-structure' }, step.structure), ' ' + step.text);
  }

  function renderTrace() {
    const latest = state.trace[0];
    $('trace-title').textContent = latest ? latest.title : '';

    const steps = $('trace-steps');
    clear(steps);
    if (latest) latest.steps.forEach(function (step) { steps.appendChild(stepItem(step)); });

    const history = $('trace-history');
    clear(history);
    history.hidden = !state.traceOpen;
    $('trace-toggle').setAttribute('aria-expanded', state.traceOpen ? 'true' : 'false');
    $('trace-toggle').textContent = state.traceOpen ? 'Hide history' : 'Show history';
    if (!state.traceOpen) return;

    history.appendChild(h('h2', null, 'Activity history'));
    const groups = h('ol', { class: 'trace-groups' });
    state.trace.forEach(function (group) {
      const list = h('ul', null);
      group.steps.forEach(function (step) { list.appendChild(stepItem(step)); });
      groups.appendChild(h('li', null, h('p', { class: 'trace-group-title' }, group.title), list));
    });
    history.appendChild(groups);
  }

  /* ---------- views ---------- */

  function showView(view) {
    state.view = view;
    ['shop', 'orders', 'how'].forEach(function (name) {
      $('view-' + name).hidden = name !== view;
    });
    const tabs = document.querySelectorAll('.tab');
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-view') === view) tabs[i].setAttribute('aria-current', 'page');
      else tabs[i].removeAttribute('aria-current');
    }
    if (view === 'orders') renderOrders();
    if (view === 'how') renderHow();
    window.scrollTo(0, 0);
  }

  /* ---------- actions ---------- */

  function cartChanged(title, message) {
    logAction(title);
    keepFocus(renderCart);
    $('order-confirmation').hidden = true;
    announce(message);
  }

  const actions = {
    view: function (target) {
      showView(target.getAttribute('data-view'));
    },

    'go-to-cart': function () {
      if (state.view !== 'shop') showView('shop');
      const cart = $('cart');
      cart.scrollIntoView({ block: 'start' });
      cart.focus({ preventScroll: true });
    },

    category: function (target) {
      state.categoryId = target.getAttribute('data-id');
      // Choosing a category leaves product-ID mode, where filters do not apply.
      if (/^\d+$/.test(state.query.trim())) {
        state.query = '';
        $('search-input').value = '';
      }
      keepFocus(renderCategories);
      refreshProducts('Chose ' + store.categories.find(state.categoryId).name);
    },

    open: function (target) {
      openProduct(Number(target.getAttribute('data-id')));
    },

    'close-dialog': function () {
      $('product-dialog').close();
    },

    add: function (target) {
      const id = Number(target.getAttribute('data-id'));
      const name = store.getProduct(id).name;
      if (store.addToCart(id)) cartChanged('Added ' + name, name + ' added to cart');
      else announce('The cart already holds the maximum of ' + Store.MAX_QUANTITY + ' for ' + name);
    },

    plus: function (target) {
      const id = Number(target.getAttribute('data-id'));
      if (store.addToCart(id)) cartChanged('Raised quantity', 'Quantity raised');
    },

    minus: function (target) {
      const id = Number(target.getAttribute('data-id'));
      if (store.decreaseQuantity(id)) cartChanged('Lowered quantity', 'Quantity lowered');
    },

    remove: function (target) {
      const id = Number(target.getAttribute('data-id'));
      const name = store.getProduct(id).name;
      if (store.removeFromCart(id)) cartChanged('Removed ' + name, name + ' removed from cart');
    },

    undo: function () {
      const undone = store.undo();
      if (undone !== null) cartChanged('Undo', 'Undid: ' + undone);
    },

    'place-order': function () {
      const order = store.placeOrder();
      if (order === null) return;
      logAction('Placed ' + order.id);
      renderCart();
      renderOrders();

      const box = $('order-confirmation');
      clear(box);
      box.hidden = false;
      box.appendChild(h('p', null, h('strong', null, order.id + ' placed.'), ' ' + plural(order.itemCount, 'item') + ', ' + money(order.total) + '. It is waiting in the order queue.'));
      box.appendChild(h('button', { type: 'button', class: 'button small', 'data-action': 'view', 'data-view': 'orders', 'data-key': 'view-orders' }, 'View orders'));
      box.querySelector('button').focus();
    },

    dispatch: function () {
      const order = store.dispatchNext();
      if (order === null) return;
      logAction('Dispatched ' + order.id);
      if (state.tracked !== null && state.tracked.found) {
        // Refresh the tracked order quietly so its status stays correct.
        state.tracked = store.trackOrder(state.tracked.id);
        store.takeSteps();
      }
      keepFocus(renderOrders);
      announce(order.id + ' dispatched');
    },

    'find-id': function (target) {
      state.query = target.getAttribute('data-id');
      $('search-input').value = state.query;
      refreshProducts('Searched for ID ' + state.query);
    },

    'clear-filters': function () {
      state.query = '';
      state.categoryId = 'all';
      state.priceRange = 'any';
      $('search-input').value = '';
      $('price-select').value = 'any';
      renderCategories();
      refreshProducts('Cleared search and filters');
      $('search-input').focus();
    },

    'trace-toggle': function () {
      state.traceOpen = !state.traceOpen;
      renderTrace();
    }
  };

  document.addEventListener('click', function (event) {
    const target = event.target.closest ? event.target.closest('[data-action]') : null;
    if (target === null || target.disabled) return;
    const action = actions[target.getAttribute('data-action')];
    if (action) action(target);
  });

  // Click on the dark area around the dialog closes it.
  $('product-dialog').addEventListener('click', function (event) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });

  function runSearch() {
    const typed = $('search-input').value;
    if (typed === state.query) return;
    state.query = typed;
    const trimmed = typed.trim();
    if (state.view !== 'shop') showView('shop');
    if (trimmed === '') refreshProducts('Cleared the search');
    else if (/^\d+$/.test(trimmed)) refreshProducts('Searched for ID ' + trimmed);
    else refreshProducts('Searched for "' + trimmed + '"');
  }

  let searchTimer = null;
  $('search-input').addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 250);
  });

  $('search-form').addEventListener('submit', function (event) {
    event.preventDefault();
    clearTimeout(searchTimer);
    runSearch();
    if (state.view !== 'shop') showView('shop');
  });

  $('sort-select').addEventListener('change', function (event) {
    state.sortBy = event.target.value;
    refreshProducts('Sorted: ' + Store.SORTS[state.sortBy].label.toLowerCase());
  });

  $('algorithm-select').addEventListener('change', function (event) {
    state.algorithm = event.target.value;
    refreshProducts('Switched to ' + Store.ALGORITHMS[state.algorithm].label.toLowerCase());
  });

  $('price-select').addEventListener('change', function (event) {
    state.priceRange = event.target.value;
    refreshProducts('Price: ' + Store.PRICE_RANGES[state.priceRange].label.toLowerCase());
  });

  $('track-form').addEventListener('submit', function (event) {
    event.preventDefault();
    const typed = $('track-input').value.trim();
    if (typed === '') {
      state.tracked = null;
      renderTracked();
      return;
    }
    state.tracked = store.trackOrder(typed);
    logAction('Tracked ' + state.tracked.id);
    renderTracked();
  });

  $('structures-toggle').addEventListener('change', function (event) {
    document.body.classList.toggle('hide-structures', !event.target.checked);
  });

  /* ---------- start ---------- */

  fillSelect($('sort-select'), Store.SORTS, state.sortBy);
  fillSelect($('algorithm-select'), Store.ALGORITHMS, state.algorithm);
  fillSelect($('price-select'), Store.PRICE_RANGES, state.priceRange);

  // On small screens the category tree starts closed so products come first.
  if (window.matchMedia && window.matchMedia('(max-width: 819px)').matches) {
    $('categories-details').removeAttribute('open');
  }

  const built = store.stats();
  store.note('Array', built.products + ' products loaded');
  store.note('Hash table', built.productBuckets + ' buckets');
  store.note('Binary search tree', 'height ' + built.bstHeight);
  store.note('Category tree', built.categories + ' categories');
  store.note('Graph', built.graphEdges + ' edges');
  logAction('Shop ready');

  renderCategories();
  state.result = store.findProducts(state);
  store.takeSteps(); // the first listing is not an action worth logging
  renderResults();
  renderCart();
  renderOrders();
  renderTrace();
})();
