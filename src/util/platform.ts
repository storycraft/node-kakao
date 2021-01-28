/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */


declare var process: any;
declare var window: any;
declare var navigator: any;

export function isNode() {
    return process && process.release && process.release.name === 'node';
}

export function isDeno() {
    return window && 'Deno' in window;
}

export function isBrowser() {
    return navigator && 'userAgent' in navigator;
}