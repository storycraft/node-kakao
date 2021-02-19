/*
 * Created on Sat Jan 23 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { TypedListeners } from './typed';

export interface ContextEmitter<T extends TypedListeners<T>> {
  emit: <U extends keyof T>(event: U, ...args: Parameters<T[U]>) => void;
}

/**
 * Create event reverse traversal tree structure
 */
export class EventContext<T extends TypedListeners<T>> implements ContextEmitter<T> {
  private _emitterList: ContextEmitter<T>[];

  constructor(...emitters: ContextEmitter<T>[]) {
    this._emitterList = emitters;
  }

  emit<U extends keyof T>(event: U, ...args: Parameters<T[U]>): void {
    this._emitterList.forEach((emitter) => emitter.emit(event, ...args));
  }
}
