/*
 * STACK (last in, first out)
 * --------------------------
 * Used for: undo in the cart. Every cart change is pushed on the stack.
 * Undo pops the most recent change and reverses it, so changes are undone in
 * the opposite order to the one they happened in.
 *
 * Time: push, pop and peek are all O(1).
 */
(function (root) {
  'use strict';

  class Stack {
    constructor() {
      this.items = [];
      this.top = -1; // index of the top item, -1 when the stack is empty
    }

    isEmpty() {
      return this.top === -1;
    }

    size() {
      return this.top + 1;
    }

    push(item) {
      this.top += 1;
      this.items[this.top] = item;
    }

    pop() {
      if (this.isEmpty()) return undefined;
      const item = this.items[this.top];
      this.items.length = this.top; // drop the top slot
      this.top -= 1;
      return item;
    }

    peek() {
      return this.isEmpty() ? undefined : this.items[this.top];
    }

    clear() {
      this.items = [];
      this.top = -1;
    }

    /* Top of the stack first. */
    toArray() {
      const values = [];
      for (let i = this.top; i >= 0; i--) values.push(this.items[i]);
      return values;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.Stack = Stack;
  if (typeof module !== 'undefined' && module.exports) module.exports = Stack;
})(typeof window !== 'undefined' ? window : globalThis);
