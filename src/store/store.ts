/*
 * Created on Sat May 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from "bson";

export interface Store<K, V> {

    has(key: K): boolean;

    get(key: K): V;

}

export interface AsyncStore<K, V> extends Store<K, Promise<V>> {

}

export interface NullableStore<K, V> extends Store<K, V | null> {

}

export interface NullableAsyncStore<K, V> extends AsyncStore<K, V | null> {

}

export interface NullableIdStore<V> extends NullableStore<Long, V> {

}

export interface NullableAsyncIdStore<V> extends NullableAsyncStore<Long, V> {

}

export class IdStore<V> implements NullableIdStore<V> {

    private map: Map<string, V>;

    constructor() {
        this.map = new Map();
    }

    has(key: Long) {
        return this.map.has(this.convertKey(key));
    }

    get(key: Long) {
        return this.map.get(this.convertKey(key)) || null;
    }

    protected set(key: Long, value: V) {
        return this.map.set(this.convertKey(key), value);
    }

    protected delete(key: Long) {
        return this.map.delete(this.convertKey(key));
    }

    protected clear() {
        return this.map.clear();
    }

    protected values() {
        return this.map.values();
    }

    protected convertKey(key: Long): string {
        return key.toString();
    }

}

export class AsyncIdStore<V> implements NullableAsyncIdStore<V> {

    private map: Map<string, V>;

    constructor() {
        this.map = new Map();
    }

    has(key: Long) {
        return this.map.has(this.convertKey(key));
    }

    async get(key: Long) {
        return this.map.get(this.convertKey(key)) || null;
    }

    protected getFromMap(key: Long) {
        return this.map.get(this.convertKey(key));
    }

    protected set(key: Long, value: V) {
        return this.map.set(this.convertKey(key), value);
    }

    protected delete(key: Long) {
        return this.map.delete(this.convertKey(key));
    }

    protected clear() {
        return this.map.clear();
    }

    protected values() {
        return this.map.values();
    }

    protected convertKey(key: Long): string {
        return key.toString();
    }

}

export abstract class IdInstanceStore<V> extends IdStore<V> {

    protected abstract createInstanceFor(key: Long): V;

    get(key: Long): V | null {
        let val = super.get(key);

        if (!val) {
            val = this.createInstanceFor(key);

            if (!val) return null;

            this.set(key, val);
        }

        return val;
    }

}

export abstract class AsyncIdInstanceStore<V> extends AsyncIdStore<V> {

    protected abstract async createInstanceFor(key: Long): Promise<V>;

    async get(key: Long): Promise<V | null> {
        let val = await super.get(key);

        if (!val) {
            val = await this.createInstanceFor(key);

            if (!val) return null;

            this.set(key, val);
        }

        return val;
    }

}