/*
 * Created on Thu Jan 28 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { RequestHeader } from '.';
import { WebApiConfig } from '../config';

export function fillAHeader(header: RequestHeader, config: WebApiConfig) {
  header['A'] = `${config.agent}/${config.version}/${config.language}`;
}

export function fillBaseHeader(header: RequestHeader, config: WebApiConfig) {
  header['Accept'] = '*/*';
  header['Accept-Language'] = config.language;
}

export function getUserAgent(config: WebApiConfig) {
  let os = '';
  if (config.agent === 'win32') {
    os = `Wd/${config.osVersion}`;
  } else {
    // TODO
    os = `Wd/${config.osVersion}`;
  }

  return `KT/${config.version} ${os} ${config.language}`;
}
