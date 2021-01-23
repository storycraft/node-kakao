/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ListenerSignature } from "tiny-typed-emitter";

export interface ContextEmitter<T extends ListenerSignature<T>> {
    emit: <U extends keyof T>(event: U, ...args: Parameters<T[U]>) => void;
}

/**
 * TypedEmitter override
 */
export declare interface TypedEmitter<T extends ListenerSignature<T>> extends ContextEmitter<T> {}

/**
 * Create event reverse traversal tree structure
 */
export class EventContext<T extends ListenerSignature<T>> implements ContextEmitter<T> {

    private _emitterList: ContextEmitter<T>[];

    constructor(...emitters: ContextEmitter<T>[]) {
        this._emitterList = emitters;
    }

    emit<U extends keyof T>(event: U, ...args: Parameters<T[U]>) {
        this._emitterList.forEach(emitter => emitter.emit(event, ...args));
    }

}