/*
 * Created on Sun Jan 17 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketIdGenerator {

    private _current: number;

    constructor(start: number = 0) {
        this._current = start;
    }

    next(): number {
        return ++this._current;
    }

}