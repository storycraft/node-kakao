/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";

export abstract class BaseConvertibleStore<K, MK, V, MV> {

    private cacheMap: Map<MK, MV>;

    constructor() {
        this.cacheMap = new Map();
    }

    abstract get(key: K, cache: boolean): V;

    has(key: K): boolean {
        return this.cacheMap.has(this.convertKey(key));
    }

    protected getValue(key: K) {
        return this.cacheMap.get(this.convertKey(key));
    }

    protected getValueRaw(key: MK) {
        return this.cacheMap.get(key);
    }

    protected setCache(key: K, value: MV) {
        this.cacheMap.set(this.convertKey(key), value);
    }

    protected setCacheRaw(key: MK, value: MV) {
        this.cacheMap.set(key, value);
    }

    protected delete(key: K) {
        this.cacheMap.delete(this.convertKey(key));
    }

    protected values() {
        return this.cacheMap.values();
    }

    protected clear() {
        this.cacheMap.clear();
    }

    protected abstract convertKey(key: K): MK;
}

export abstract class ConvertibleStore<K, MK, V> extends BaseConvertibleStore<K, MK, V, V> {

    constructor() {
        super();
    }

    get(key: K, cache = true): V {
        let k = this.convertKey(key);

        if (cache && this.has(key)) return this.getValueRaw(k)!;

        let val = this.fetchValue(key);
        if (cache) this.setCacheRaw(k, val);

        return val;
    }

    protected abstract fetchValue(key: K): V;

}

export abstract class AsyncConvertibleStore<K, MK, V> extends BaseConvertibleStore<K, MK, Promise<V>, V> {

    constructor() {
        super();
    }

    async get(key: K, cache = true): Promise<V> {
        let k = this.convertKey(key);

        if (cache && this.has(key)) return this.getValueRaw(k)!;

        let val = await this.fetchValue(key);
        if (cache) this.setCacheRaw(k, val);

        return val;
    }

    protected abstract convertKey(key: K): MK;

    protected async abstract fetchValue(key: K): Promise<V>;

}

export abstract class Store<K, V> extends AsyncConvertibleStore<K, K, V> {

    constructor() {
        super();
    }

    protected convertKey(key: K) {
        return key;
    }

}

export abstract class AsyncIdStore<V> extends AsyncConvertibleStore<Long, string, V> {

    protected convertKey(key: Long): string {
        return key.toString();
    }

}

export abstract class IdStore<V> extends ConvertibleStore<Long, string, V> {

    protected convertKey(key: Long): string {
        return key.toString();
    }

}