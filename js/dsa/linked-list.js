/*
 * SINGLY LINKED LIST
 * ------------------
 * Used for: the shopping cart. Every cart item is a node that points to the
 * next item, so items can be added or removed without shifting the others.
 *
 *   head -> [Laptop] -> [Mouse] -> [Keyboard] -> null
 *                                      ^ tail
 *
 * Time: append O(1), find / remove / insertAt O(n).
 */
(function (root) {
  'use strict';

  class ListNode {
    constructor(value) {
      this.value = value;
      this.next = null;
    }
  }

  class LinkedList {
    constructor() {
      this.head = null;
      this.tail = null;
      this.size = 0;
    }

    isEmpty() {
      return this.size === 0;
    }

    /* Add at the end. The tail pointer makes this O(1). */
    append(value) {
      const node = new ListNode(value);
      if (this.head === null) {
        this.head = node;
        this.tail = node;
      } else {
        this.tail.next = node;
        this.tail = node;
      }
      this.size += 1;
    }

    /* Add at the front. */
    prepend(value) {
      const node = new ListNode(value);
      node.next = this.head;
      this.head = node;
      if (this.tail === null) this.tail = node;
      this.size += 1;
    }

    /* Insert so the new node ends up at position `index` (0 = front).
       Undo uses this to put a removed item back where it was. */
    insertAt(index, value) {
      if (index <= 0 || this.head === null) return this.prepend(value);
      if (index >= this.size) return this.append(value);

      let previous = this.head;
      for (let i = 0; i < index - 1; i++) previous = previous.next;

      const node = new ListNode(value);
      node.next = previous.next;
      previous.next = node;
      this.size += 1;
    }

    /* Walk the list and return the first value that matches, or null. */
    find(matches) {
      let current = this.head;
      while (current !== null) {
        if (matches(current.value)) return current.value;
        current = current.next;
      }
      return null;
    }

    /* Unlink the first matching node. Returns { value, index } or null. */
    removeWhere(matches) {
      let previous = null;
      let current = this.head;
      let index = 0;

      while (current !== null) {
        if (matches(current.value)) {
          if (previous === null) this.head = current.next; // removing the head
          else previous.next = current.next; // skip over the node
          if (current === this.tail) this.tail = previous;
          this.size -= 1;
          return { value: current.value, index: index };
        }
        previous = current;
        current = current.next;
        index += 1;
      }
      return null;
    }

    clear() {
      this.head = null;
      this.tail = null;
      this.size = 0;
    }

    /* Visit every value from head to tail. */
    forEach(visit) {
      let current = this.head;
      let index = 0;
      while (current !== null) {
        visit(current.value, index);
        current = current.next;
        index += 1;
      }
    }

    toArray() {
      const values = [];
      this.forEach(function (value) {
        values.push(value);
      });
      return values;
    }
  }

  root.DSA = root.DSA || {};
  root.DSA.LinkedList = LinkedList;
  if (typeof module !== 'undefined' && module.exports) module.exports = LinkedList;
})(typeof window !== 'undefined' ? window : globalThis);
