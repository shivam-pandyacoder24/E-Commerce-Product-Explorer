/*
 * QUEUE (first in, first out) built on a circular array
 * -----------------------------------------------------
 * Used for: order processing. A new order joins at the rear and the order at
 * the front is dispatched first, so customers are served in the order they
 * paid. The graph's breadth-first search uses the same queue.
 *
 * `front` is the index of the oldest item. The rear is worked out from
 * front + count, wrapping round to slot 0 when it passes the end of the
 * array. That wrap-around is what makes the array "circular".
 *
 * Time: enqueue, dequeue and peek are all O(1).
 */
(function (root) {
  'use strict';

  class Queue {
    constructor(capacity = 8) {
      this.capacity = capacity;
      this.items = new Array(capacity);
      this.front = 0;
      this.count = 0;
    }

    isEmpty() {
      return this.count === 0;
    }

    size() {
      return this.count;
    }

    enqueue(item) {
      if (this.count === this.capacity) this.grow();
      const rear = (this.front + this.count) % this.capacity;
      this.items[rear] = item;
      this.count += 1;
    }

    dequeue() {
      if (this.isEmpty()) return undefined;
      const item = this.items[this.front];
      this.items[this.front] = undefined;
      this.front = (this.front + 1) % this.capacity;
      this.count -= 1;
      return item;
    }

    peek() {
      return this.isEmpty() ? undefined : this.items[this.front];
    }

    /* Array is full: copy into one twice the size, oldest item first. */
    grow() {
      const bigger = new Array(this.capacity * 2);
      for (let i = 0; i < this.count; i++) {
        bigger[i] = this.items[(this.front + i) % this.capacity];
      }
      this.items = bigger;
      this.capacity = this.capacity * 2;
      this.front = 0;
    }

    /* Front of the queue first. */
    toArray() {
      const values = [];
      for (let i = 0; i < this.count; i++) {
        values.push(this.items[(this.front + i) % this.capacity]);
      }
      return values;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.Queue = Queue;
  if (typeof module !== 'undefined' && module.exports) module.exports = Queue;
})(typeof window !== 'undefined' ? window : globalThis);
