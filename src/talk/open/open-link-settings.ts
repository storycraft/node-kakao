/*
 * Created on Fri Jun 12 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface OpenLinkSettings {

    linkName: string;
    linkCoverPath: string;

    maxUser?: number;
    maxChannelLimit?: number;

    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;

    description: string;

    activated: boolean;
    UNKNOWN2: true;

}