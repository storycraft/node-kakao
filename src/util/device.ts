/*
 * Created on Sat Jan 30 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

const BASE64_LIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Create random device uuid
 *
 * @return {string} random device UUID
 */
export function randomDeviceUUID(): string {
  return Array.from({ length: 86 }, () => BASE64_LIST[~~(Math.random() * 64)]).join('') + '==';
}
