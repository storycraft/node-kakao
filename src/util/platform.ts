/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


declare let process: any;
declare let window: any;
declare let navigator: any;

export function isNode(): boolean {
  return typeof process !== 'undefined' && process.release && process.release.name === 'node';
}

export function isDeno(): boolean {
  return typeof window !== 'undefined' && window.Deno && window.Deno.version && window.Deno.version.deno;
}

export function isBrowser(): boolean {
  return typeof navigator !== 'undefined' && 'userAgent' in navigator;
}
