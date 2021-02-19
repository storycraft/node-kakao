/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChainedIterator<T> implements IterableIterator<T> {
  private _list: Iterator<T>[];

  constructor(...list: Iterator<T>[]) {
    this._list = list.reverse();
  }

  [Symbol.iterator](): ChainedIterator<T> {
    return this;
  }

  next(): IteratorResult<T> {
    if (this._list.length < 1) return { done: true, value: null };

    const last = this._list[this._list.length - 1];
    const next = last.next();

    if (next.done) {
      this._list.pop();
      return this.next();
    }

    return next;
  }
}
