/*
 * Created on Sat Jan 30 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

/**
 * Create random device uuid
 */
export function randomDeviceUUID() {
  return btoa(String.fromCharCode(...Array.from({ length: 64 }, () => Math.floor(Math.random() * 256))));
}
