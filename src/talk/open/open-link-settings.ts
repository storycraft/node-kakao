/*
 * Created on Fri Jun 12 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { OpenLinkType } from "./open-link-type";

export interface OpenLinkSettings {

    linkName: string;

    maxUser: number;
    passcode?: string; // '' === passcode disabled
    canSearchLink: boolean;
    UNKNOWN1: boolean;
    UNKNOWN2: boolean;

    description: string;
    
    linkURL: string;
    linkType: OpenLinkType;

    coverURL: string;

}