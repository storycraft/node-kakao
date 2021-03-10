/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChunkedArrayBufferList {
  private _total: number;
  private _list: Uint8Array[];

  constructor() {
    this._list = [];
    this._total = 0;
  }

  get byteLength(): number {
    return this._total;
  }

  get count(): number {
    return this._list.length;
  }

  append(buf: Uint8Array): void {
    this._total += buf.byteLength;
    this._list.push(buf);
  }

  toBuffer(): Uint8Array {
    if (this._list.length < 1) return new Uint8Array(0);
    if (this._list.length < 2) return this._list[0];

    const array = new Uint8Array(this._total);

    let offset = 0;
    for (const item of this._list) {
      array.set(item, offset);
      offset += item.byteLength;
    }

    return array;
  }

  clear(): void {
    this._list = [];
    this._total = 0;
  }
}
