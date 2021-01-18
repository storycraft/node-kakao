/*
 * Created on Sat May 23 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChunkedBufferList {

    private total: number;
    private list: Buffer[];

    constructor() {
        this.list = [];
        this.total = 0;
    }

    get TotalByteLength(): number {
        return this.total;
    }

    get Count() {
        return this.list.length;
    }

    append(buf: Buffer) {
        this.total += buf.byteLength;
        this.list.push(buf);
    }

    toBuffer() {
        return Buffer.concat(this.list);
    }

    clear() {
        this.list = [];
        this.total = 0;
    }

}