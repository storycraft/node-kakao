/*
 * Created on Mon Feb 01 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import EventEmitter from 'eventemitter3';

// https://github.com/binier/tiny-typed-emitter
export type TypedListeners<L> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [E in keyof L]: (...args: any[]) => unknown;
};

export type DefaultListeners = Record<string | symbol, (...args: unknown[]) => unknown>;

declare class TypedEmitterDecl<L extends TypedListeners<L> = DefaultListeners> {
  addListener<U extends keyof L>(event: U, listener: L[U]): this;
  removeListener<U extends keyof L>(event: U, listener: L[U]): this;
  removeAllListeners(event?: keyof L): this;
  once<U extends keyof L>(event: U, listener: L[U]): this;
  on<U extends keyof L>(event: U, listener: L[U]): this;
  off<U extends keyof L>(event: U, listener: L[U]): this;
  emit<U extends keyof L>(event: U, ...args: Parameters<L[U]>): boolean;
  eventNames<U extends keyof L>(): U[];
  listenerCount(type: keyof L): number;
  listeners<U extends keyof L>(type: U): L[U][];
}


// We can just use EventEmitter but the typings break on nested event map.
export class TypedEmitter<L extends TypedListeners<L>>
  extends (EventEmitter as { new <L extends TypedListeners<L>>(): TypedEmitterDecl<L> })<L> {

}
