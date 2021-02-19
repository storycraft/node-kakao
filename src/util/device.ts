/*
 * Created on Sat Jan 30 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

const BASE64_LIST = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const HEX_LIST = '0123456789abcdef';

/**
 * Create random device uuid for windows platform
 *
 * @return {string} random device UUID
 */
export function randomWin32DeviceUUID(): string {
  return Array.from({ length: 86 }, () => BASE64_LIST[~~(Math.random() * 64)]).join('') + '==';
}

/**
 * Create random device uuid for android subdevice
 *
 * @return {string} random device UUID
 */
export function randomAndroidSubDeviceUUID(): string {
  return Array.from({ length: 40 }, () => HEX_LIST[~~(Math.random() * 16)]).join('');
}
