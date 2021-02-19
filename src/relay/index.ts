/*
 * Created on Sun Aug 02 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export enum KnownRelayEventType {

  SHOUT = 1

}

export type RelayEventType = KnownRelayEventType | number;
