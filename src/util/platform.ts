/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


declare var process: any;
declare var window: any;
declare var navigator: any;

export function isNode() {
    return typeof process !== 'undefined' && process.release && process.release.name === 'node';
}

export function isDeno() {
    return typeof window !== 'undefined' && window.Deno && window.Deno.version && window.Deno.version.deno;
}

export function isBrowser() {
    return typeof navigator !== 'undefined' && 'userAgent' in navigator;
}