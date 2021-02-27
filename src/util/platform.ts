/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


declare let process: { release?: { name?: string } } & Record<string, unknown> | undefined;
declare let window: { Deno?: { version?: { deno?: string } } } & Record<string, unknown> | undefined;
declare let navigator: Record<string, unknown>;

export function isNode(): boolean {
  return !!(process && process.release && process.release.name === 'node');
}

export function isDeno(): boolean {
  return !!(window && window.Deno && window.Deno.version && window.Deno.version);
}

export function isBrowser(): boolean {
  return navigator && 'userAgent' in navigator;
}
