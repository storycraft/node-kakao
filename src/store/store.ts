/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";

export abstract class ConvertibleMap<K, MK, V> {

    private cacheMap: Map<MK, V>;

    constructor() {
        this.cacheMap = new Map();
    }

    has(key: K): boolean {
        return this.cacheMap.has(this.convertKey(key));
    }

    async get(key: K, cache = true): Promise<V> {
        let k = this.convertKey(key);

        if (cache && this.has(key)) return this.cacheMap.get(k)!;

        let val = await this.fetchValue(key);
        if (cache) this.cacheMap.set(k, val);

        return val;
    }

    protected setCache(key: K, value: V) {
        this.cacheMap.set(this.convertKey(key), value);
    }

    protected delete(key: K) {
        this.cacheMap.delete(this.convertKey(key));
    }

    protected clear() {
        this.cacheMap.clear();
    }

    protected abstract convertKey(key: K): MK;

    protected async abstract fetchValue(key: K): Promise<V>;

}

export abstract class Store<K, V> extends ConvertibleMap<K, K, V> {

    constructor() {
        super();
    }

    protected convertKey(key: K) {
        return key;
    }

}

export abstract class IdStore<V> extends ConvertibleMap<Long, string, V> {

    protected convertKey(key: Long): string {
        return key.toString();
    }

}