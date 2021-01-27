/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChunkedArrayBufferList {

    private _total: number;
    private _list: ArrayBuffer[];

    constructor() {
        this._list = [];
        this._total = 0;
    }

    get byteLength(): number {
        return this._total;
    }

    get count() {
        return this._list.length;
    }

    append(buf: ArrayBuffer) {
        this._total += buf.byteLength;
        this._list.push(buf);
    }

    toBuffer() {
        const buffer = new ArrayBuffer(this._total);
        const array = new Uint8Array(buffer);

        let offset = 0;
        for (const item of this._list) {
            array.set(new Uint8Array(item), offset);
            offset += item.byteLength;
        }

        return buffer;
    }

    clear() {
        this._list = [];
        this._total = 0;
    }

}